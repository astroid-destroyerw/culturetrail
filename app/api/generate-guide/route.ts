import { NextRequest, NextResponse } from "next/server";
import { generateCultureGuide } from "@/lib/gemini";
import { GuideRequest } from "@/types";

// In-memory rate limiting map.
// NOTE: This should be replaced with a persistent, distributed store like Redis/Upstash in production
// to prevent memory leaks, share rate limit state across multiple serverless instances, and ensure consistency.
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

const ALLOWED_INTERESTS = [
  "Heritage & History",
  "Food & Cuisine",
  "Nature & Outdoors",
  "Art & Design",
  "Nightlife & Music",
  "Local Markets",
  "Festivals & Events",
];

function sanitizeText(text: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, "");
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const now = Date.now();
    const rateLimit = rateLimitMap.get(ip);

    if (!rateLimit) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    } else {
      if (now > rateLimit.resetTime) {
        rateLimit.count = 1;
        rateLimit.resetTime = now + 60000;
      } else {
        rateLimit.count += 1;
        if (rateLimit.count > 10) {
          return NextResponse.json(
            { error: "Too many requests. Please try again in a minute." },
            { status: 429 }
          );
        }
      }
    }

    // 2. Parse Request Body
    let body: Partial<GuideRequest>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const { destination, days, interests, notes } = body;

    // 3. Validation
    if (typeof destination !== "string" || destination.trim() === "") {
      return NextResponse.json(
        { error: "Destination is required and must be a non-empty string." },
        { status: 400 }
      );
    }
    if (destination.length > 100) {
      return NextResponse.json(
        { error: "Destination must be under 100 characters." },
        { status: 400 }
      );
    }

    if (typeof days !== "number" || isNaN(days) || days < 1 || days > 30) {
      return NextResponse.json(
        { error: "Days must be a number between 1 and 30." },
        { status: 400 }
      );
    }

    if (!Array.isArray(interests) || interests.length === 0) {
      return NextResponse.json(
        { error: "Interests must be a non-empty array of strings." },
        { status: 400 }
      );
    }

    const invalidInterests = interests.filter(
      (interest) => typeof interest !== "string" || !ALLOWED_INTERESTS.includes(interest)
    );
    if (invalidInterests.length > 0) {
      return NextResponse.json(
        { error: `Invalid interests selected: ${invalidInterests.join(", ")}.` },
        { status: 400 }
      );
    }

    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      return NextResponse.json(
        { error: "Notes must be a string." },
        { status: 400 }
      );
    }
    if (notes && notes.length > 500) {
      return NextResponse.json(
        { error: "Notes must be under 500 characters." },
        { status: 400 }
      );
    }

    // 4. Sanitization
    const sanitizedDestination = sanitizeText(destination);
    const sanitizedNotes = sanitizeText(notes || "");

    // 5. Generate Guide via Gemini Client
    const guideInput: GuideRequest = {
      destination: sanitizedDestination,
      days,
      interests,
      notes: sanitizedNotes,
    };

    try {
      const guideResult = await generateCultureGuide(guideInput);
      return NextResponse.json(guideResult, { status: 200 });
    } catch (error: any) {
      console.error("Gemini generation/parsing error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (
        errMsg.toLowerCase().includes("json") ||
        errMsg.toLowerCase().includes("structure") ||
        errMsg.toLowerCase().includes("parsing") ||
        errMsg.toLowerCase().includes("gemini") ||
        errMsg.toLowerCase().includes("token")
      ) {
        return NextResponse.json(
          { error: "Couldn't generate a guide for that destination. Try being more specific (e.g. a city or region name)." },
          { status: 422 }
        );
      }
      throw error; // Re-throw to be caught by the outer block as a 500 error
    }

  } catch (error) {
    // 7. Error Handling (Log details server-side, hide from client)
    console.error("API generate-guide error:", error);
    return NextResponse.json(
      { error: "Something went wrong generating your guide. Please try again." },
      { status: 500 }
    );
  }
}

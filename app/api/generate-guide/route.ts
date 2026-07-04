import { NextRequest, NextResponse } from "next/server";
import { generateCultureGuide } from "@/lib/gemini";
import { GuideRequest } from "@/types";
import { geocodeDestination } from "@/lib/geocode";
import { fetchPOIs, POI } from "@/lib/overpass";
import { fetchWikiSummary, WikiSummary } from "@/lib/wikipedia";

// In-memory rate limiting map.
// NOTE: This should be replaced with a persistent, distributed store like Redis/Upstash in production.
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
    // 1. Rate Limiting Check
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const now = Date.now();
    const limitWindow = 60 * 1000; // 1 minute
    const maxRequests = 10;

    let rateInfo = rateLimitMap.get(ip);
    if (!rateInfo || now > rateInfo.resetTime) {
      rateInfo = {
        count: 0,
        resetTime: now + limitWindow,
      };
    }

    if (rateInfo.count >= maxRequests) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    rateInfo.count++;
    rateLimitMap.set(ip, rateInfo);

    // 2. Body Parsing Validation
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const { destination, days, interests, notes } = body;

    // 3. Inputs Bounds Validation
    if (!destination || typeof destination !== "string" || destination.trim() === "") {
      return NextResponse.json(
        { error: "Destination is required." },
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

    // 5. Grounding Data Fetching (RAG Pipeline)
    let geocodeResult = null;
    try {
      geocodeResult = await geocodeDestination(sanitizedDestination);
    } catch (err) {
      console.warn("Geocoding failed, proceeding without coordinates:", err);
    }

    let pois: POI[] = [];
    if (geocodeResult) {
      try {
        pois = await fetchPOIs(geocodeResult.lat, geocodeResult.lng);
      } catch (err) {
        console.warn("Overpass POI fetching failed, proceeding without POIs:", err);
      }
    }

    let destWikiSummary: WikiSummary | null = null;
    if (geocodeResult) {
      try {
        destWikiSummary = await fetchWikiSummary(sanitizedDestination);
      } catch (err) {
        console.warn("Destination Wikipedia summary fetch failed:", err);
      }
    }

    const wikiSummaries: WikiSummary[] = [];
    if (destWikiSummary) {
      wikiSummaries.push(destWikiSummary);
    }

    if (pois.length > 0) {
      const interestTypes = new Set<string>();
      for (const interest of interests) {
        if (interest === "Heritage & History") {
          interestTypes.add("historic");
          interestTypes.add("religion");
          interestTypes.add("museum");
        } else if (interest === "Local Markets") {
          interestTypes.add("marketplace");
        } else if (interest === "Nature & Outdoors") {
          interestTypes.add("viewpoint");
          interestTypes.add("attraction");
        } else if (interest === "Art & Design") {
          interestTypes.add("museum");
          interestTypes.add("artwork");
        }
      }

      // Score POIs by matching category relevance
      const scoredPois = pois.map((p) => {
        let score = 0;
        if (interestTypes.has(p.type)) {
          score = 2;
        }
        return { poi: p, score };
      });

      scoredPois.sort((a, b) => b.score - a.score);

      // Select top 5 and fetch Wiki summaries concurrently
      const top5Scored = scoredPois.slice(0, 5).map((sp) => sp.poi);
      const wikiPromises = top5Scored.map(async (p) => {
        try {
          return await fetchWikiSummary(p.name);
        } catch {
          return null;
        }
      });

      const results = await Promise.all(wikiPromises);
      for (const r of results) {
        if (r) {
          wikiSummaries.push(r);
        }
      }
    }

    const hasUsablePois = pois.length >= 5;
    if (!hasUsablePois) {
      console.warn(`Obscure destination or empty POIs returned. POIs length: ${pois.length}. Falling back to Gemini self-knowledge.`);
    }

    // 6. Generate Guide via Gemini Client
    const guideInput: GuideRequest = {
      destination: sanitizedDestination,
      days,
      interests,
      notes: sanitizedNotes,
    };

    try {
      const guideResult = await generateCultureGuide(
        guideInput,
        hasUsablePois ? { pois, wikiSummaries } : undefined
      );

      // Append destination Wikipedia summary if available for display
      if (destWikiSummary) {
        guideResult.wikiSummary = destWikiSummary.extract;
      }

      return NextResponse.json(guideResult, { status: 200 });
    } catch (error) {
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
      throw error;
    }

  } catch (error) {
    console.error("API generate-guide error:", error);
    return NextResponse.json(
      { error: "Something went wrong generating your guide. Please try again." },
      { status: 500 }
    );
  }
}

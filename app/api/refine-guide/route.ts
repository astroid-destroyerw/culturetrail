import { NextResponse } from "next/server";
import { refineGuide } from "@/lib/gemini";
import { RefineRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RefineRequest;

    const { currentGuide, instruction, destination } = body;

    if (!instruction || !instruction.trim()) {
      return NextResponse.json(
        { error: "Instruction is required." },
        { status: 400 }
      );
    }

    if (instruction.length > 500) {
      return NextResponse.json(
        { error: "Instruction exceeds maximum length of 500 characters." },
        { status: 400 }
      );
    }

    if (!currentGuide || !destination) {
      return NextResponse.json(
        { error: "currentGuide and destination are required." },
        { status: 400 }
      );
    }

    const result = await refineGuide({ currentGuide, instruction: instruction.trim(), destination });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Refine guide error:", err);

    const message =
      err instanceof SyntaxError
        ? "AI returned an unexpected format. Please try rephrasing your request."
        : "Failed to refine the itinerary. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

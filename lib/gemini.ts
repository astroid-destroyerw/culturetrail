import { GoogleGenerativeAI } from "@google/generative-ai";
import { GuideRequest, GuideResponse, RefineRequest, RefineResponse } from "@/types";
import { POI } from "./overpass";
import { WikiSummary } from "./wikipedia";

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

function getGenAIClient(): GoogleGenerativeAI {
  if (!genAI) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateCultureGuide(
  input: GuideRequest,
  groundingData?: { pois: POI[]; wikiSummaries: WikiSummary[] }
): Promise<GuideResponse> {
  const client = getGenAIClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  let groundingPrompt = "";
  if (groundingData && groundingData.pois.length > 0) {
    const poiListText = groundingData.pois
      .map((p) => `- ${p.name} (Type: ${p.type}, Latitude: ${p.lat}, Longitude: ${p.lng})`)
      .join("\n");
    const wikiText = groundingData.wikiSummaries
      .map((w) => `[Wikipedia Page: ${w.title}]\n${w.extract}`)
      .join("\n\n");

    groundingPrompt = `
Here is REAL geospatial and historical data for the destination to ground your generation:

REAL PLACES OF INTEREST (POIs):
${poiListText}

WIKIPEDIA EXTRACTS:
${wikiText}

INSTRUCTIONS FOR ITINERARY GROUNDING:
1. Build a day-by-day itinerary for exactly ${input.days} days.
2. For each day, plan a "morning", "afternoon", and "evening" activity.
3. You MUST prioritize and select activities ONLY from the REAL PLACES OF INTEREST (POIs) listed above. Make sure the "activity" matches the POI name exactly, and reuse its exact "lat" and "lng" and "type" (e.g. museum, historic, viewpoint, marketplace, artwork, religion, attraction).
4. Do NOT invent/hallucinate place names, and do NOT invent random coordinates.
5. If there are not enough POIs listed to fully fill all ${input.days} days (which requires ${input.days * 3} activities total), you may supplement with highly famous real-world landmarks in ${input.destination} that you are confident exist, using realistic coordinate points, but prioritize the provided POI list.
`;
  } else {
    groundingPrompt = `
Generate a day-by-day itinerary using famous real-world landmarks and places in ${input.destination} that you are highly confident exist. Do not invent fake names or placeholder coordinates. Provide realistic coordinates for all suggested landmarks.
`;
  }

  const prompt = `
You are an expert cultural travel guide and historian. Generate a rich, grounded day-by-day itinerary for this trip:
Destination: ${input.destination}
Duration: ${input.days} days
Interests: ${input.interests.join(", ")}
Notes: ${input.notes || "None"}

${groundingPrompt}

Generate content matching this exact JSON schema:
{
  "destination": string,
  "days": [
    {
      "day": number,
      "morning": {
        "activity": string,
        "description": string,
        "type": string,
        "lat": number,
        "lng": number
      },
      "afternoon": {
        "activity": string,
        "description": string,
        "type": string,
        "lat": number,
        "lng": number
      },
      "evening": {
        "activity": string,
        "description": string,
        "type": string,
        "lat": number,
        "lng": number
      }
    }
  ]
}

Guidelines:
1. Tailor all content and recommendations directly to the user's specified interests: ${input.interests.join(", ")} and notes: ${input.notes || "none"}.
2. Keep descriptions concise, exactly 2 to 3 sentences maximum, highlighting the cultural significance.
3. Return ONLY the raw JSON string matching the structure above. Do not wrap the JSON output in markdown code blocks, HTML, or provide any introductory or concluding text. It must be directly parseable as JSON.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) {
    throw new Error("Empty response received from Gemini model.");
  }

  const parsedResponse = JSON.parse(text) as GuideResponse;
  
  if (!parsedResponse.destination || !Array.isArray(parsedResponse.days)) {
    throw new Error("Parsed response does not match the expected GuideResponse structure.");
  }

  return parsedResponse;
}

export async function refineGuide(input: RefineRequest): Promise<RefineResponse> {
  const client = getGenAIClient();
  // Do NOT set responseMimeType here — the nested {guide, changeSummary} wrapper
  // confuses Gemini's JSON-mode schema inference and causes malformed output.
  // We extract JSON manually from the text response instead.
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  // Compact the itinerary to reduce token pressure (omit wikiSummary body from prompt)
  const compactGuide = {
    destination: input.currentGuide.destination,
    days: input.currentGuide.days,
  };
  const currentGuideJson = JSON.stringify(compactGuide);

  const prompt = `You are an expert travel planner. A user wants to refine their itinerary for ${input.destination}.

USER INSTRUCTION: "${input.instruction}"

CURRENT ITINERARY:
${currentGuideJson}

Modify the itinerary according to the instruction. Keep unchanged days exactly as they are.
For new or changed activities, use realistic coordinates.

Respond with ONLY a valid JSON object — no markdown fences, no extra text — in this exact shape:
{"guide":{"destination":"...","days":[...]},"changeSummary":"One warm conversational sentence describing what changed (max 20 words)."}

Rules:
- "guide.days" must contain ALL days (modified + unchanged)
- Each day must have "day", "morning", "afternoon", "evening" keys
- Each time slot must have "activity", "description", "type", "lat", "lng"
- "changeSummary" must be a non-empty string`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  if (!rawText || !rawText.trim()) {
    throw new Error("Empty response received from Gemini model during refinement.");
  }

  // Strip accidental markdown code fences if present
  const text = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: RefineResponse;
  try {
    parsed = JSON.parse(text) as RefineResponse;
  } catch {
    console.error("refineGuide: JSON.parse failed. Raw text:", text.slice(0, 500));
    throw new SyntaxError("AI returned malformed JSON. Please try rephrasing your request.");
  }

  if (!parsed.guide || !parsed.guide.destination || !Array.isArray(parsed.guide.days)) {
    console.error("refineGuide: unexpected structure", JSON.stringify(parsed).slice(0, 300));
    throw new Error("Refined guide does not match the expected structure.");
  }

  // Carry wikiSummary forward if Gemini dropped it
  if (input.currentGuide.wikiSummary && !parsed.guide.wikiSummary) {
    parsed.guide.wikiSummary = input.currentGuide.wikiSummary;
  }

  if (!parsed.changeSummary || typeof parsed.changeSummary !== "string") {
    parsed.changeSummary = "Your itinerary has been updated!";
  }

  return parsed;
}


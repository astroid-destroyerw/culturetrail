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
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const currentGuideJson = JSON.stringify(input.currentGuide, null, 2);

  const prompt = `
You are an expert travel planner with deep local knowledge. A user is refining their existing cultural itinerary for ${input.destination}.

USER'S CHAT INSTRUCTION: "${input.instruction}"

CURRENT ITINERARY (JSON):
${currentGuideJson}

TASK:
Apply the user's instruction to modify the itinerary. You may:
- Swap or replace specific activities on specific days/times
- Re-theme a day or time slot to match a new focus (e.g. food, nature, nightlife)
- Add hidden gems, adjust pacing, or make the schedule more relaxed/intense
- Keep unchanged days EXACTLY as they are unless the instruction specifically targets them

Return a JSON object with EXACTLY this structure:
{
  "guide": { /* the complete updated itinerary with the same schema as the input */ },
  "changeSummary": "A single natural-language sentence (max 25 words) describing exactly what changed, written as if talking to the user. Be specific, warm, and conversational."
}

IMPORTANT:
- The "guide" must include ALL days, not just the modified ones
- Preserve the "wikiSummary" field from the original if present
- Preserve real lat/lng coordinates for any places you keep
- For any NEW places you suggest, use realistic coordinates
- The "changeSummary" should describe only what actually changed, not repeat the whole itinerary
- Return ONLY raw JSON — no markdown, no code fences, no prose outside the JSON
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text) {
    throw new Error("Empty response received from Gemini model during refinement.");
  }

  const parsed = JSON.parse(text) as RefineResponse;

  if (!parsed.guide || !parsed.guide.destination || !Array.isArray(parsed.guide.days)) {
    throw new Error("Refined guide does not match the expected structure.");
  }

  if (!parsed.changeSummary || typeof parsed.changeSummary !== "string") {
    parsed.changeSummary = "Your itinerary has been updated!";
  }

  return parsed;
}


import { GoogleGenerativeAI } from "@google/generative-ai";
import { GuideRequest, GuideResponse } from "@/types";

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

export async function generateCultureGuide(input: GuideRequest): Promise<GuideResponse> {
  const client = getGenAIClient();
  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
You are an expert cultural travel guide and historian. Generate a rich, curated cultural guide for the following trip:
Destination: ${input.destination}
Duration: ${input.days} days
Interests: ${input.interests.join(", ")}
Specific Notes/Curiosities: ${input.notes || "None"}

Generate content matching this exact JSON schema:
{
  "destination": string,
  "attractions": [{ "name": string, "description": string, "whyVisit": string }],
  "hiddenGems": [{ "name": string, "description": string, "howToFind": string }],
  "story": { "title": string, "narrative": string },
  "heritage": [{ "title": string, "description": string }],
  "localEvents": [{ "name": string, "description": string, "typicalTiming": string }],
  "culturalExperiences": [{ "name": string, "description": string, "howToEngage": string }]
}

Guidelines:
1. Provide between 3 to 5 items in each of the array sections (attractions, hiddenGems, heritage, localEvents, culturalExperiences).
2. Tailor all content and recommendations directly to the user's specified interests: ${input.interests.join(", ")} and notes: ${input.notes || "none"}.
3. Keep the descriptions and text for items concise, exactly 2 to 3 sentences maximum.
4. For the "story" section, write a highly evocative and narrative story (such as a local myth, folklore legend, or historical vignette) that is deeply tied to the destination. It should be written in 100 to 150 words under a compelling title.
5. Return ONLY the raw JSON string matching the structure above. Do not wrap the JSON output in markdown code blocks, HTML, or provide any introductory or concluding text. It must be directly parseable as JSON.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) {
    throw new Error("Empty response received from Gemini model.");
  }

  const parsedResponse = JSON.parse(text) as GuideResponse;
  
  if (!parsedResponse.destination || !Array.isArray(parsedResponse.attractions) || !parsedResponse.story) {
    throw new Error("Parsed response does not match the expected GuideResponse structure.");
  }

  return parsedResponse;
}

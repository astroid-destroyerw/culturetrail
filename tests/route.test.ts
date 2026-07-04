import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/generate-guide/route";
import { NextRequest } from "next/server";
import { generateCultureGuide } from "@/lib/gemini";

vi.mock("@/lib/gemini", () => ({
  generateCultureGuide: vi.fn(),
}));

vi.mock("@/lib/geocode", () => ({
  geocodeDestination: vi.fn().mockResolvedValue({
    lat: 48.8566,
    lng: 2.3522,
    displayName: "Paris, France",
  }),
}));

vi.mock("@/lib/overpass", () => ({
  fetchPOIs: vi.fn().mockResolvedValue([
    { name: "Eiffel Tower", type: "attraction", lat: 48.8584, lng: 2.2945 },
    { name: "Louvre Museum", type: "museum", lat: 48.8606, lng: 2.3376 },
    { name: "Seine Cruise", type: "attraction", lat: 48.8566, lng: 2.3522 },
    { name: "Notre Dame", type: "religion", lat: 48.8530, lng: 2.3499 },
    { name: "Sacred Heart", type: "religion", lat: 48.8867, lng: 2.3431 },
  ]),
}));

vi.mock("@/lib/wikipedia", () => ({
  fetchWikiSummary: vi.fn().mockResolvedValue({
    title: "Paris",
    extract: "Paris is the capital of France.",
  }),
}));

describe("app/api/generate-guide/route.ts - POST Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: Record<string, unknown>) => {
    return new NextRequest("http://localhost/api/generate-guide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify(body),
    });
  };

  it("rejects empty destination", async () => {
    const req = createRequest({
      destination: "",
      days: 3,
      interests: ["Heritage & History"],
      notes: "",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Destination is required");
  });

  it("rejects days outside range 1-30", async () => {
    const reqLow = createRequest({
      destination: "Paris",
      days: 0,
      interests: ["Heritage & History"],
      notes: "",
    });
    const resLow = await POST(reqLow);
    expect(resLow.status).toBe(400);

    const reqHigh = createRequest({
      destination: "Paris",
      days: 31,
      interests: ["Heritage & History"],
      notes: "",
    });
    const resHigh = await POST(reqHigh);
    expect(resHigh.status).toBe(400);
  });

  it("rejects empty interests array", async () => {
    const req = createRequest({
      destination: "Paris",
      days: 5,
      interests: [],
      notes: "",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects overly long notes", async () => {
    const longNotes = "a".repeat(501);
    const req = createRequest({
      destination: "Paris",
      days: 5,
      interests: ["Heritage & History"],
      notes: longNotes,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("calls generateCultureGuide and returns 200 with valid input", async () => {
    const mockOutput = {
      destination: "Paris",
      days: [
        {
          day: 1,
          morning: { activity: "Eiffel Tower", description: "Visit tower", type: "attraction", lat: 48.8584, lng: 2.2945 },
          afternoon: { activity: "Louvre Museum", description: "See art", type: "museum", lat: 48.8606, lng: 2.3376 },
          evening: { activity: "Seine Cruise", description: "Boat ride", type: "attraction", lat: 48.8566, lng: 2.3522 },
        },
      ],
    };
    vi.mocked(generateCultureGuide).mockResolvedValue(mockOutput as unknown as Awaited<ReturnType<typeof generateCultureGuide>>);

    const req = createRequest({
      destination: "Paris",
      days: 1,
      interests: ["Heritage & History"],
      notes: "Quiet trip",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.destination).toEqual("Paris");
    expect(data.days).toEqual(mockOutput.days);
    expect(data.wikiSummary).toEqual("Paris is the capital of France.");
    expect(generateCultureGuide).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/refine-guide/route";
import { NextRequest } from "next/server";
import { refineGuide } from "@/lib/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";

vi.mock("@/lib/gemini", () => ({
  refineGuide: vi.fn(),
}));

vi.mock("@google/generative-ai", () => {
  const generateContentMock = vi.fn();
  const getGenerativeModelMock = vi.fn(() => ({
    generateContent: generateContentMock,
  }));
  
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(function (this: { getGenerativeModel: unknown }) {
      this.getGenerativeModel = getGenerativeModelMock;
      return this;
    }),
  };
});

describe("app/api/refine-guide/route.ts - POST Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: Record<string, unknown>) => {
    return new NextRequest("http://localhost/api/refine-guide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  it("rejects request if instruction is missing", async () => {
    const req = createRequest({
      currentGuide: { destination: "Kyoto", days: [] },
      destination: "Kyoto",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Instruction is required");
  });

  it("rejects request if instruction is overly long", async () => {
    const longInstruction = "a".repeat(501);
    const req = createRequest({
      currentGuide: { destination: "Kyoto", days: [] },
      instruction: longInstruction,
      destination: "Kyoto",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Instruction exceeds maximum length");
  });

  it("rejects request if currentGuide is missing", async () => {
    const req = createRequest({
      instruction: "Add a hidden gem",
      destination: "Kyoto",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("currentGuide and destination are required");
  });

  it("calls refineGuide and returns 200 with valid input", async () => {
    const mockOutput = {
      guide: {
        destination: "Kyoto",
        days: [
          {
            day: 1,
            morning: { activity: "Kinkaku-ji", description: "Golden Pavilion", type: "attraction", lat: 35.0394, lng: 135.7292 },
            afternoon: { activity: "Nijo Castle", description: "Shogun residence", type: "historic", lat: 35.0142, lng: 135.7482 },
            evening: { activity: "Gion District", description: "Geisha area", type: "cultural", lat: 34.9961, lng: 135.7772 },
          },
        ],
      },
      changeSummary: "Added Kinkaku-ji to day 1.",
    };

    vi.mocked(refineGuide).mockResolvedValue(mockOutput as any);

    const req = createRequest({
      currentGuide: { destination: "Kyoto", days: [] },
      instruction: "Add Kinkaku-ji",
      destination: "Kyoto",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.guide.destination).toBe("Kyoto");
    expect(data.changeSummary).toBe("Added Kinkaku-ji to day 1.");
    expect(refineGuide).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCultureGuide } from "@/lib/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

describe("lib/gemini.ts - generateCultureGuide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "mock-api-key";
  });

  it("throws a clear error when Gemini returns invalid JSON", async () => {
    const mockClientInstance = new GoogleGenerativeAI("mock-key");
    const mockModel = mockClientInstance.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    vi.mocked(mockModel.generateContent).mockResolvedValue({
      response: {
        text: () => "invalid json content",
      },
    } as unknown as Awaited<ReturnType<typeof mockModel.generateContent>>);

    await expect(
      generateCultureGuide({
        destination: "Kyoto",
        days: 3,
        interests: ["Heritage & History"],
        notes: "",
      })
    ).rejects.toThrow();
  });
});

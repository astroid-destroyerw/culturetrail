import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { geocodeDestination } from "@/lib/geocode";
import { fetchWikiSummary } from "@/lib/wikipedia";
import { fetchPOIs } from "@/lib/overpass";

describe("lib/geocode.ts - geocodeDestination", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  beforeEach(() => {
    fetchSpy.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully returns coordinates and display name", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: "35.0116",
          lon: "135.7681",
          display_name: "Kyoto, Japan",
        },
      ],
    } as Response);

    const result = await geocodeDestination("Kyoto");
    expect(result).toEqual({
      lat: 35.0116,
      lng: 135.7681,
      displayName: "Kyoto, Japan",
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("q=Kyoto"),
      expect.any(Object)
    );
  });

  it("throws error on empty Nominatim response", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    await expect(geocodeDestination("InvalidPlace")).rejects.toThrow();
  });

  it("throws error on non-ok HTTP status", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(geocodeDestination("ErrorPlace")).rejects.toThrow();
  });
});

describe("lib/wikipedia.ts - fetchWikiSummary", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  beforeEach(() => {
    fetchSpy.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully returns Wiki title and extract", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Kyoto",
        extract: "Kyoto was the imperial capital of Japan.",
      }),
    } as Response);

    const result = await fetchWikiSummary("Kyoto");
    expect(result).toEqual({
      title: "Kyoto",
      extract: "Kyoto was the imperial capital of Japan.",
    });
  });

  it("returns null if Wikipedia page not found", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
    } as Response);

    const result = await fetchWikiSummary("NonexistentArticle");
    expect(result).toBeNull();
  });
});

describe("lib/overpass.ts - fetchPOIs", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  beforeEach(() => {
    fetchSpy.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches, parses, maps types, filters unnamed, and deduplicates POIs", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        elements: [
          // Valid attraction
          {
            type: "node",
            id: 1,
            lat: 35.0116,
            lon: 135.7681,
            tags: { name: "Kinkaku-ji", tourism: "attraction" },
          },
          // Valid museum
          {
            type: "node",
            id: 2,
            lat: 35.0223,
            lon: 135.7554,
            tags: { name: "Kyoto National Museum", tourism: "museum" },
          },
          // Unnamed (should be filtered)
          {
            type: "node",
            id: 3,
            lat: 35.0223,
            lon: 135.7554,
            tags: { tourism: "museum" },
          },
          // Duplicate name (should be deduplicated)
          {
            type: "node",
            id: 4,
            lat: 35.0120,
            lon: 135.7690,
            tags: { name: "Kinkaku-ji", tourism: "viewpoint" },
          },
          // Way with center
          {
            type: "way",
            id: 5,
            center: { lat: 35.0333, lon: 135.7444 },
            tags: { name: "Nijo Castle", historic: "castle" },
          },
        ],
      }),
    } as Response);

    const results = await fetchPOIs(35.0116, 135.7681);
    expect(results).toHaveLength(3);
    
    expect(results[0]).toEqual({
      name: "Kinkaku-ji",
      type: "attraction",
      lat: 35.0116,
      lng: 135.7681,
    });

    expect(results[1]).toEqual({
      name: "Kyoto National Museum",
      type: "museum",
      lat: 35.0223,
      lng: 135.7554,
    });

    expect(results[2]).toEqual({
      name: "Nijo Castle",
      type: "historic",
      lat: 35.0333,
      lng: 135.7444,
    });
  });
});

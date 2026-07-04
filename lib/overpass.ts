export interface POI {
  name: string;
  type: string;
  lat: number;
  lng: number;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    tourism?: string;
    historic?: string;
    amenity?: string;
    religion?: string;
  };
}

export async function fetchPOIs(lat: number, lng: number, radiusMeters = 5000, timeoutMs = 8000): Promise<POI[]> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const query = `[out:json][timeout:10];
(
  node(around:${radiusMeters},${lat},${lng})[tourism=attraction];
  way(around:${radiusMeters},${lat},${lng})[tourism=attraction];
  node(around:${radiusMeters},${lat},${lng})[historic];
  way(around:${radiusMeters},${lat},${lng})[historic];
  node(around:${radiusMeters},${lat},${lng})[tourism=museum];
  way(around:${radiusMeters},${lat},${lng})[tourism=museum];
  node(around:${radiusMeters},${lat},${lng})[amenity=marketplace];
  way(around:${radiusMeters},${lat},${lng})[amenity=marketplace];
  node(around:${radiusMeters},${lat},${lng})[tourism=viewpoint];
  way(around:${radiusMeters},${lat},${lng})[tourism=viewpoint];
  node(around:${radiusMeters},${lat},${lng})[religion];
  way(around:${radiusMeters},${lat},${lng})[religion];
  node(around:${radiusMeters},${lat},${lng})[tourism=artwork];
  way(around:${radiusMeters},${lat},${lng})[tourism=artwork];
);
out center;`;

  try {
    const url = "https://overpass-api.de/api/interpreter";
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "CultureTrail/1.0 (hackathon project)",
      },
      body: "data=" + encodeURIComponent(query),
    });

    if (!res.ok) {
      throw new Error(`Overpass API failed with status ${res.status}`);
    }

    const data = await res.json();
    const elements = (data.elements || []) as OverpassElement[];

    const pois: POI[] = elements
      .map((el) => {
        const name = el.tags?.name;
        const elementLat = el.lat ?? el.center?.lat;
        const elementLng = el.lon ?? el.center?.lon;

        let type = "other";
        if (el.tags?.tourism === "museum") type = "museum";
        else if (el.tags?.tourism === "attraction") type = "attraction";
        else if (el.tags?.historic) type = "historic";
        else if (el.tags?.amenity === "marketplace") type = "marketplace";
        else if (el.tags?.tourism === "viewpoint") type = "viewpoint";
        else if (el.tags?.religion || el.tags?.amenity === "place_of_worship") type = "religion";
        else if (el.tags?.tourism === "artwork") type = "artwork";

        return {
          name: name ? String(name).trim() : "",
          type,
          lat: elementLat ? parseFloat(String(elementLat)) : 0,
          lng: elementLng ? parseFloat(String(elementLng)) : 0,
        };
      })
      .filter((poi) => poi.name && poi.lat !== 0 && poi.lng !== 0);

    // Deduplicate by name
    const seen = new Set<string>();
    const uniquePois: POI[] = [];
    for (const poi of pois) {
      const lowerName = poi.name.toLowerCase();
      if (!seen.has(lowerName)) {
        seen.add(lowerName);
        uniquePois.push(poi);
      }
    }

    return uniquePois.slice(0, 40);
  } finally {
    clearTimeout(id);
  }
}

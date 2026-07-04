export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeDestination(destination: string, timeoutMs = 6000): Promise<GeocodeResult> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CultureTrail/1.0 (hackathon project)",
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim geocode failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No geocoding results found for "${destination}"`);
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const displayName = result.display_name;

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid coordinates received from geocoder");
    }

    return { lat, lng, displayName };
  } finally {
    clearTimeout(id);
  }
}

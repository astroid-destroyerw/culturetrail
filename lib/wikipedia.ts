export interface WikiSummary {
  title: string;
  extract: string;
}

export async function fetchWikiSummary(placeName: string, timeoutMs = 5000): Promise<WikiSummary | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  // Wikipedia article title naming convention replaces spaces with underscores
  const formattedTitle = encodeURIComponent(placeName.trim().replace(/\s+/g, "_"));

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${formattedTitle}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CultureTrail/1.0 (hackathon project)",
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data.title || !data.extract) {
      return null;
    }

    return {
      title: data.title,
      extract: data.extract,
    };
  } catch (err) {
    console.warn(`Wikipedia summary request failed for "${placeName}":`, err);
    return null;
  } finally {
    clearTimeout(id);
  }
}

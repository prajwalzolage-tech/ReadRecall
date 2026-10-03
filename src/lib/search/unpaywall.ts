// src/lib/search/unpaywall.ts
// Client for Unpaywall DOI lookup to find legal open-access PDF links

export async function getOpenAccessUrl(doi: string): Promise<string | null> {
  if (!doi) return null;

  try {
    const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '').trim();
    const url = `https://api.unpaywall.org/v2/${encodeURIComponent(
      cleanDoi
    )}?email=readrecall@example.com`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    return (
      data.best_oa_location?.url_for_pdf ||
      data.best_oa_location?.url ||
      null
    );
  } catch {
    return null;
  }
}

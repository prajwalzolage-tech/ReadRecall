// src/lib/search/openalex.ts
// OpenAlex API client with inverted index abstract reconstruction

import type { SearchResult } from '@/types';

/**
 * Reconstruct readable abstract text from OpenAlex's abstract_inverted_index
 */
export function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null | undefined
): string {
  if (!invertedIndex) return '';

  const wordsWithPos: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      wordsWithPos.push({ word, pos });
    }
  }

  wordsWithPos.sort((a, b) => a.pos - b.pos);
  return wordsWithPos.map((w) => w.word).join(' ');
}

export async function searchOpenAlex(
  query: string,
  maxResults = 10
): Promise<SearchResult[]> {
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(
      query
    )}&per_page=${maxResults}&select=id,title,authorships,publication_year,abstract_inverted_index,doi,open_access,primary_location`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ReadRecall/1.0 (mailto:readrecall@example.com)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`OpenAlex API error: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((item: any): SearchResult => {
      const authors = (item.authorships || []).map(
        (a: any) => a.author?.display_name || ''
      ).filter(Boolean);

      const abstract = reconstructAbstract(item.abstract_inverted_index);

      const pdfUrl =
        item.open_access?.oa_url ||
        item.primary_location?.pdf_url ||
        item.primary_location?.landing_page_url;

      const isOa = Boolean(item.open_access?.is_oa);
      const doi = item.doi ? item.doi.replace(/^https?:\/\/doi\.org\//, '') : undefined;

      return {
        id: item.id || `oa:${Math.random().toString(36).slice(2)}`,
        title: item.title || 'Untitled Work',
        authors,
        year: item.publication_year || new Date().getFullYear(),
        abstract,
        doi,
        pdfUrl: isOa && pdfUrl ? pdfUrl : undefined,
        source: 'openalex',
        fullTextAvailable: isOa && Boolean(pdfUrl),
      };
    });
  } catch (error) {
    console.error('OpenAlex search error:', error);
    return [];
  }
}

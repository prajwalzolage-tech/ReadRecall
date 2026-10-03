// src/lib/search/merge.ts
// De-duplicates and merges search results from arXiv and OpenAlex

import type { SearchResult, MergedSearchResult } from '@/types';

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mergeResults(
  arxivResults: SearchResult[],
  openalexResults: SearchResult[]
): MergedSearchResult[] {
  const merged: MergedSearchResult[] = [];
  const doiMap = new Map<string, number>();
  const titleMap = new Map<string, number>();

  const allItems: { item: SearchResult; src: 'arxiv' | 'openalex' }[] = [
    ...arxivResults.map((item) => ({ item, src: 'arxiv' as const })),
    ...openalexResults.map((item) => ({ item, src: 'openalex' as const })),
  ];

  for (const { item, src } of allItems) {
    const cleanDoi = item.doi ? item.doi.toLowerCase().trim() : null;
    const cleanTitle = normalizeTitle(item.title);

    let existingIndex: number | undefined;

    if (cleanDoi && doiMap.has(cleanDoi)) {
      existingIndex = doiMap.get(cleanDoi);
    } else if (cleanTitle && cleanTitle.length > 10 && titleMap.has(cleanTitle)) {
      existingIndex = titleMap.get(cleanTitle);
    }

    if (existingIndex !== undefined) {
      // Merge with existing
      const existing = merged[existingIndex];
      if (!existing.sources.includes(src)) {
        existing.sources.push(src);
      }

      // Upgrade to full text if this candidate has PDF and existing does not
      if (!existing.fullTextAvailable && item.fullTextAvailable && item.pdfUrl) {
        existing.fullTextAvailable = true;
        existing.pdfUrl = item.pdfUrl;
      }

      // Supplement abstract if longer
      if ((!existing.abstract || existing.abstract.length < 50) && item.abstract) {
        existing.abstract = item.abstract;
      }

      // Merge authors
      if (item.authors && item.authors.length > existing.authors.length) {
        existing.authors = item.authors;
      }
    } else {
      // Add new
      const newEntry: MergedSearchResult = {
        ...item,
        sources: [src],
      };
      const index = merged.length;
      merged.push(newEntry);

      if (cleanDoi) doiMap.set(cleanDoi, index);
      if (cleanTitle) titleMap.set(cleanTitle, index);
    }
  }

  return merged;
}

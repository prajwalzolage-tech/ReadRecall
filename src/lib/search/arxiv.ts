// src/lib/search/arxiv.ts
// Client for arXiv API querying and Atom XML parsing

import { XMLParser } from 'fast-xml-parser';
import type { SearchResult } from '@/types';

export async function searchArxiv(
  query: string,
  maxResults = 10
): Promise<SearchResult[]> {
  try {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
      query
    )}&max_results=${maxResults}&sortBy=relevance`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`arXiv API error: HTTP ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const parsed = parser.parse(xml);

    const feed = parsed.feed;
    if (!feed || !feed.entry) return [];

    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

    return entries.map((entry: any) => {
      // Authors extraction
      let authors: string[] = [];
      if (entry.author) {
        const rawAuthors = Array.isArray(entry.author)
          ? entry.author
          : [entry.author];
        authors = rawAuthors.map((a: any) =>
          typeof a === 'string' ? a : a.name || ''
        );
      }

      // Year extraction
      const published = entry.published || entry.updated || '';
      const year = published ? new Date(published).getFullYear() : undefined;

      // Extract PDF link
      let pdfUrl: string | undefined;
      if (entry.link) {
        const links = Array.isArray(entry.link) ? entry.link : [entry.link];
        const pdfLink = links.find(
          (l: any) =>
            l['@_title'] === 'pdf' || l['@_type'] === 'application/pdf'
        );
        if (pdfLink && pdfLink['@_href']) {
          pdfUrl = pdfLink['@_href'];
        }
      }

      const id = String(entry.id || '').replace(/^https?:\/\/arxiv\.org\/abs\//, '');
      if (!pdfUrl && id) {
        pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
      }

      const doi = entry['arxiv:doi']?.['#text'] || entry['arxiv:doi'] || undefined;

      return {
        id: `arxiv:${id}`,
        title: (entry.title || '').replace(/\s+/g, ' ').trim(),
        authors: authors.filter(Boolean),
        year: year || new Date().getFullYear(),
        abstract: (entry.summary || '').replace(/\s+/g, ' ').trim(),
        doi: typeof doi === 'string' ? doi : undefined,
        pdfUrl,
        source: 'arxiv',
        fullTextAvailable: !!pdfUrl,
      };
    });
  } catch (error) {
    console.error('arXiv search error:', error);
    return [];
  }
}

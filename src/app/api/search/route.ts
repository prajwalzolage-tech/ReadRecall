// src/app/api/search/route.ts
// GET: Queries arXiv, OpenAlex, and Unpaywall in parallel and merges results

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { checkRateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_SEARCH } from '@/lib/constants';
import { searchQuerySchema } from '@/lib/schemas';
import { searchArxiv } from '@/lib/search/arxiv';
import { searchOpenAlex } from '@/lib/search/openalex';
import { getOpenAccessUrl } from '@/lib/search/unpaywall';
import { mergeResults } from '@/lib/search/merge';
import { searchSystemArticles } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  // Rate limit
  const rateLimit = checkRateLimit(`search:${user.uid}`, RATE_LIMIT_SEARCH);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Search rate limit exceeded. Please wait a moment.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  const q = request.nextUrl.searchParams.get('q');
  const parseResult = searchQuerySchema.safeParse({ q });
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid search query. Minimum 2 characters.' },
      { status: 400 }
    );
  }

  const query = parseResult.data.q;

  try {
    // Run system search, arXiv, and OpenAlex in parallel
    const [systemSettled, arxivSettled, openalexSettled] = await Promise.allSettled([
      searchSystemArticles(query, user.uid),
      searchArxiv(query, 10),
      searchOpenAlex(query, 10),
    ]);

    const systemArticles =
      systemSettled.status === 'fulfilled' ? systemSettled.value : [];
    const arxivResults =
      arxivSettled.status === 'fulfilled' ? arxivSettled.value : [];
    const openalexResults =
      openalexSettled.status === 'fulfilled' ? openalexSettled.value : [];

    // Merge & deduplicate external results
    const merged = mergeResults(arxivResults, openalexResults);

    // Check Unpaywall for up to 5 results with DOIs that lack a direct PDF link
    const needsPdf = merged.filter((m) => !m.fullTextAvailable && m.doi).slice(0, 5);

    if (needsPdf.length > 0) {
      await Promise.allSettled(
        needsPdf.map(async (item) => {
          if (!item.doi) return;
          const oaPdf = await getOpenAccessUrl(item.doi);
          if (oaPdf) {
            item.fullTextAvailable = true;
            item.pdfUrl = oaPdf;
          }
        })
      );
    }

    return NextResponse.json({
      systemArticles,
      results: merged,
      externalResults: merged,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed. Please try again later.' },
      { status: 500 }
    );
  }
}

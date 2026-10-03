// src/app/api/articles/[id]/route.ts
// GET: Get a single article by ID
// Supports ?metadataOnly=true to return without text (used by write page)

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { getArticleById } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await getArticleById(id);

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const metadataOnly =
      request.nextUrl.searchParams.get('metadataOnly') === 'true';

    if (metadataOnly) {
      // Write page: return metadata without article text (enforces hiding)
      return NextResponse.json({
        id: article.id,
        title: article.title,
        wordCount: article.wordCount,
        source: article.source,
        keyPointSource: article.keyPointSource,
        authors: article.authors,
        year: article.year,
      });
    }

    // Full article (for reading page and reveal)
    return NextResponse.json({
      id: article.id,
      title: article.title,
      text: article.text,
      wordCount: article.wordCount,
      source: article.source,
      keyPointSource: article.keyPointSource,
      mainIdea: article.mainIdea,
      keyPoints: article.keyPoints,
      authors: article.authors,
      year: article.year,
      sections: article.sections,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

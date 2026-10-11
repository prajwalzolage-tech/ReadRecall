// src/app/api/articles/[id]/route.ts
// GET: Get a single article by ID
// Supports ?metadataOnly=true to return without text (used by write page)

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { getArticleById, deleteArticle } from '@/lib/data-store';
import { splitSections } from '@/lib/section-splitter';

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

    let sections = article.sections;
    if ((!sections || sections.length <= 1) && article.text && article.wordCount > 800) {
      sections = splitSections(article.text);
    }

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
        sections,
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
      sections,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  try {
    const { id } = await params;
    const article = await getArticleById(id);

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (article.source === 'curated') {
      return NextResponse.json(
        { error: 'Curated system articles cannot be deleted.' },
        { status: 403 }
      );
    }

    if (article.createdBy && article.createdBy !== 'user' && article.createdBy !== user.uid) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this document.' },
        { status: 403 }
      );
    }

    await deleteArticle(id, user.uid);

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
      id,
    });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete article' },
      { status: 500 }
    );
  }
}

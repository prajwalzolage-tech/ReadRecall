// src/app/api/articles/[id]/sections/route.ts
// GET: Fetch split sections for an article

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { getArticleById } from '@/lib/data-store';
import { splitSections } from '@/lib/section-splitter';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;
    const article = await getArticleById(id);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    let sections = article.sections;

    if (!sections || sections.length === 0) {
      sections = splitSections(article.text || '');
    }

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article sections' },
      { status: 500 }
    );
  }
}

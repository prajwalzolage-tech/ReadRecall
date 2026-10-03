// src/app/api/articles/route.ts
// GET: List articles (curated only by default, or all for the user)
// POST: Create a new article (used by upload/search flows)

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { getArticles, saveArticle } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;

  try {
    const source = request.nextUrl.searchParams.get('source');
    const articles = await getArticles({ source });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  try {
    const data = await request.json();
    const article = await saveArticle({
      ...data,
      createdBy: user.uid,
    });
    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}

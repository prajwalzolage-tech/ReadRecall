// src/app/api/search/fetch/route.ts
// POST: Fetches an open-access PDF paper, validates via SSRF guard, extracts text, and stores article

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { db, isFirestoreConfigured } from '@/lib/firebase/admin';
import { saveArticle } from '@/lib/data-store';
import { validateUrl } from '@/lib/ssrf-guard';
import { extractText, computeHash } from '@/lib/text-extraction';
import { cleanArticleText } from '@/lib/text-cleaning';
import { splitSections } from '@/lib/section-splitter';
import { generateKeyPoints } from '@/lib/llm';
import { getJevProvider } from '@/lib/jev';
import { countWords } from '@/hooks/use-word-count';
import {
  FETCH_TIMEOUT_MS,
  FETCH_MAX_SIZE_BYTES,
  ARTICLE_MIN_WORDS,
  ARTICLE_MAX_WORDS,
  SECTION_MAX_WORDS,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  try {
    const body = await request.json();
    const { pdfUrl, title, authors, year, doi } = body;

    if (!pdfUrl) {
      return NextResponse.json({ error: 'Missing pdfUrl' }, { status: 400 });
    }

    // 1. SSRF Guard
    const ssrfCheck = await validateUrl(pdfUrl);
    if (!ssrfCheck.valid) {
      return NextResponse.json(
        { error: `URL rejected by SSRF guard: ${ssrfCheck.reason}` },
        { status: 400 }
      );
    }

    // 2. Fetch PDF with timeout and size check
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const pdfResponse = await fetch(pdfUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ReadRecall/1.0 (academic-reading-assistant)',
      },
    });
    clearTimeout(timeout);

    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: `Failed to download PDF: HTTP ${pdfResponse.status}` },
        { status: 502 }
      );
    }

    const contentLength = Number(pdfResponse.headers.get('content-length') || '0');
    if (contentLength > FETCH_MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'PDF file exceeds the 20 MB size limit' },
        { status: 413 }
      );
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    if (arrayBuffer.byteLength > FETCH_MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'PDF file exceeds the 20 MB size limit' },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(arrayBuffer);

    // 3. Extract text
    const rawText = await extractText(buffer, 'application/pdf');
    const cleanedText = cleanArticleText(rawText);
    const wordCount = countWords(cleanedText);

    if (wordCount < ARTICLE_MIN_WORDS) {
      return NextResponse.json(
        { error: 'The downloaded paper contains too little extractable text.' },
        { status: 400 }
      );
    }

    const truncatedText =
      wordCount > ARTICLE_MAX_WORDS
        ? cleanedText.split(/\s+/).slice(0, ARTICLE_MAX_WORDS).join(' ')
        : cleanedText;

    // 4. Content hash & deduplication
    const contentHash = computeHash(truncatedText);
    if (isFirestoreConfigured()) {
      try {
        const existingSnap = await db
          .collection('articles')
          .where('contentHash', '==', contentHash)
          .limit(1)
          .get();

        if (!existingSnap.empty) {
          return NextResponse.json({
            articleId: existingSnap.docs[0].id,
            deduplicated: true,
          });
        }
      } catch (err) {
        console.warn('Deduplication check failed:', err);
      }
    }

    // 5. Generate key points and verify with Jev
    const { mainIdea, keyPoints: generatedPoints, appliedPurpose } =
      await generateKeyPoints(truncatedText);

    const jevProvider = getJevProvider();
    const verifiedKeyPoints: { text: string; verified: boolean }[] = [];

    for (const point of generatedPoints) {
      const isVerified = await jevProvider.verifyKeyPoint(truncatedText, point);
      if (isVerified || verifiedKeyPoints.length < 3) {
        verifiedKeyPoints.push({ text: point, verified: isVerified });
      }
    }

    // 6. Section splitting
    const effectiveWordCount = countWords(truncatedText);
    const sections =
      effectiveWordCount > SECTION_MAX_WORDS
        ? splitSections(truncatedText)
        : undefined;

    // 7. Store article
    const articleRecord = {
      title: title || 'Research Paper',
      source: 'search' as const,
      link: pdfUrl,
      authors: authors || [],
      year: year || new Date().getFullYear(),
      doi,
      contentHash,
      text: truncatedText,
      wordCount: effectiveWordCount,
      status: 'ready' as const,
      mainIdea,
      keyPoints: verifiedKeyPoints,
      appliedPurpose,
      keyPointSource: 'ai' as const,
      sections,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    };

    const savedArticle = await saveArticle(articleRecord);

    return NextResponse.json({
      articleId: savedArticle.id,
      wordCount: effectiveWordCount,
      sections,
    });
  } catch (error: any) {
    console.error('Fetch paper error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch and process paper' },
      { status: 500 }
    );
  }
}

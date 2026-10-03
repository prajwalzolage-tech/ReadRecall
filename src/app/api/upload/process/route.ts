// src/app/api/upload/process/route.ts
// POST: Processes uploaded files or pasted text, extracts content, verifies key points with Jev, and stores article

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { db, isFirestoreConfigured } from '@/lib/firebase/admin';
import { saveArticle } from '@/lib/data-store';
import { extractText, computeHash, validateMagicBytes } from '@/lib/text-extraction';
import { cleanArticleText } from '@/lib/text-cleaning';
import { splitSections } from '@/lib/section-splitter';
import { generateKeyPoints } from '@/lib/llm';
import { getJevProvider } from '@/lib/jev';
import { countWords } from '@/hooks/use-word-count';
import {
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
    const contentType = request.headers.get('content-type') || '';
    let rawText = '';
    let articleTitle = 'Uploaded Document';
    let source: 'uploaded' | 'pasted' = 'uploaded';
    let cloudinaryId: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const titleField = formData.get('title') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      articleTitle = titleField || file.name.replace(/\.[^/.]+$/, '');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate magic bytes
      const validation = validateMagicBytes(buffer);
      if (!validation.valid || !validation.mimeType) {
        return NextResponse.json(
          { error: validation.error || 'Invalid file format' },
          { status: 400 }
        );
      }

      // Extract raw text
      rawText = await extractText(buffer, validation.mimeType);
    } else {
      // JSON body (pasted text or Cloudinary reference)
      const body = await request.json();

      if (body.text) {
        source = 'pasted';
        articleTitle = body.title || 'Pasted Article';
        rawText = body.text;
      } else if (body.cloudinaryId) {
        cloudinaryId = body.cloudinaryId;
        articleTitle = body.originalFilename || 'Uploaded Article';

        // Fetch file from Cloudinary URL
        const fetchUrl = body.secureUrl || `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'}/raw/upload/${body.cloudinaryId}`;
        const res = await fetch(fetchUrl);
        if (!res.ok) {
          throw new Error('Failed to retrieve file from Cloudinary');
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        const validation = validateMagicBytes(buffer);
        rawText = await extractText(buffer, validation.mimeType || body.mimeType || 'text/plain');
      } else {
        return NextResponse.json(
          { error: 'Missing file or text payload' },
          { status: 400 }
        );
      }
    }

    // Clean text
    const cleanedText = cleanArticleText(rawText);
    const wordCount = countWords(cleanedText);

    if (wordCount < ARTICLE_MIN_WORDS) {
      return NextResponse.json(
        {
          error: `Article is too short (${wordCount} words). Minimum length is ${ARTICLE_MIN_WORDS} words.`,
        },
        { status: 400 }
      );
    }

    if (wordCount > ARTICLE_MAX_WORDS) {
      return NextResponse.json(
        {
          error: `Article exceeds maximum length (${wordCount} words). Maximum length is ${ARTICLE_MAX_WORDS} words.`,
        },
        { status: 400 }
      );
    }

    // Compute content hash
    const contentHash = computeHash(cleanedText);

    // Check for existing deduplicated article
    if (isFirestoreConfigured()) {
      try {
        const existingSnap = await db
          .collection('articles')
          .where('contentHash', '==', contentHash)
          .limit(1)
          .get();

        if (!existingSnap.empty) {
          const existingDoc = existingSnap.docs[0];
          const existingData = existingDoc.data();
          return NextResponse.json({
            articleId: existingDoc.id,
            wordCount: existingData.wordCount,
            sections: existingData.sections,
            keyPointSource: existingData.keyPointSource,
            deduplicated: true,
          });
        }
      } catch (err) {
        console.warn('Deduplication check failed:', err);
      }
    }

    // Generate Key Points using LLM
    const { mainIdea, keyPoints: generatedPoints, appliedPurpose } =
      await generateKeyPoints(cleanedText);

    // Verify Key Points using Jev
    const jevProvider = getJevProvider();
    const verifiedKeyPoints: { text: string; verified: boolean }[] = [];

    for (const point of generatedPoints) {
      const isVerified = await jevProvider.verifyKeyPoint(cleanedText, point);
      if (isVerified || verifiedKeyPoints.length < 3) {
        verifiedKeyPoints.push({ text: point, verified: isVerified });
      }
    }

    // Split sections if article is long
    const sections =
      wordCount > SECTION_MAX_WORDS ? splitSections(cleanedText) : undefined;

    // Create article record in data-store
    const articleRecord = {
      title: articleTitle,
      source,
      cloudinaryId,
      contentHash,
      text: cleanedText,
      wordCount,
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
      wordCount,
      sections,
      keyPointSource: 'ai',
    });
  } catch (error: any) {
    console.error('Process upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}

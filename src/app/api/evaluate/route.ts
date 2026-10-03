// src/app/api/evaluate/route.ts
// POST: Evaluates a student summary using Jev and stores attempt in Firestore

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { getArticleById, getUserProfile, saveAttempt } from '@/lib/data-store';
import { evaluateRequestSchema } from '@/lib/schemas';
import { checkRateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_EVALUATE } from '@/lib/constants';
import { buildQuestions, getJevProvider } from '@/lib/jev';
import { calculateRating } from '@/lib/rating';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  // 2. Rate limit
  const rateLimit = checkRateLimit(`eval:${user.uid}`, RATE_LIMIT_EVALUATE);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Evaluation rate limit exceeded. Please wait a moment.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  try {
    const json = await request.json();
    const parseResult = evaluateRequestSchema.safeParse(json);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { articleId, summary, section } = parseResult.data;
    const retryOf = typeof json.retryOf === 'string' ? json.retryOf : undefined;

    // 3. Fetch article
    const articleData = await getArticleById(articleId);
    if (!articleData) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    let articleText = articleData.text;

    if (section && articleData.sections) {
      const matchedSection = articleData.sections.find(
        (s: any) => s.title === section
      );
      if (matchedSection) {
        articleText = matchedSection.text;
      }
    }

    // 4. Build Jev questions & Evaluate
    const questions = buildQuestions(
      articleData.keyPoints || [],
      articleData.appliedPurpose
    );
    const jevProvider = getJevProvider();
    const { results: jevResults, model: jevModel, latency } =
      await jevProvider.evaluate(
        { article: articleText, summary },
        questions
      );

    // 5. Calculate final rating and guards
    const ratingResult = calculateRating(jevResults, articleText, summary);

    // 6. Check user privacy preferences
    let storeSummary = true;
    try {
      const profile = await getUserProfile(user.uid, user.email);
      if (profile?.privacySummary === true) {
        storeSummary = false;
      }
    } catch {
      // ignore
    }

    // 7. Store attempt in data-store
    const attemptData: any = {
      userId: user.uid,
      articleId,
      dimensionScores: ratingResult.dimensionScores,
      rating: ratingResult.rating,
      guards: ratingResult.guards,
      flags: ratingResult.flags,
      jevModel,
      latency,
      jevResults,
      createdAt: new Date().toISOString(),
    };

    if (section) attemptData.section = section;
    if (retryOf) attemptData.retryOf = retryOf;
    if (storeSummary) attemptData.summary = summary;

    const savedAttempt = await saveAttempt(attemptData);

    // 8. Return response
    return NextResponse.json({
      attemptId: savedAttempt.id,
      attempt: savedAttempt,
      rating: ratingResult.rating,
      rawScore: ratingResult.rawScore,
      dimensionScores: ratingResult.dimensionScores,
      guards: ratingResult.guards,
      flags: ratingResult.flags,
      jevModel,
      latency,
      jevResults,
    });
  } catch (error) {
    console.error('Evaluate API error:', error);
    return NextResponse.json(
      { error: 'Evaluation failed. Please try again.' },
      { status: 500 }
    );
  }
}

// src/app/api/feedback/route.ts
// POST: Generates streamed AI feedback using Vercel AI SDK

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth-helper';
import { getArticleById } from '@/lib/data-store';
import {
  streamFeedback,
  generateFallbackFeedback,
  createFeedbackStream,
} from '@/lib/llm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authResult = await verifyRequest(request);
  if ('error' in authResult) return authResult.error;

  try {
    const json = await request.json();
    const { articleId, summary, jevResults, rating } = json;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Missing articleId' },
        { status: 400 }
      );
    }

    const effectiveSummary = summary || '';
    const effectiveRating = typeof rating === 'number' ? rating : 5;

    // Fetch article for context using resilient data-store
    const articleData = await getArticleById(articleId);

    try {
      const streamResult: any = await streamFeedback({
        articleTitle: articleData?.title,
        articleText: articleData?.text || '',
        summary: effectiveSummary,
        jevResults: jevResults || {},
        rating: effectiveRating,
      });

      if (typeof streamResult?.toTextStreamResponse === 'function') {
        return streamResult.toTextStreamResponse();
      }

      if (typeof streamResult?.toDataStreamResponse === 'function') {
        return streamResult.toDataStreamResponse();
      }

      // Direct response
      return new Response(streamResult?.textStream || streamResult, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (llmError) {
      console.warn('Live LLM feedback error, using streaming fallback:', llmError);
      const chunks = generateFallbackFeedback(
        effectiveSummary,
        jevResults || {},
        effectiveRating
      );
      const stream = createFeedbackStream(chunks);
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }
  } catch (error) {
    console.error('Feedback API error:', error);
    const chunks = generateFallbackFeedback('', {}, 5);
    const stream = createFeedbackStream(chunks);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

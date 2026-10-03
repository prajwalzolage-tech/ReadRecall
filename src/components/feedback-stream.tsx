// src/components/feedback-stream.tsx
// Component that consumes and streams AI feedback token-by-token

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';

interface FeedbackStreamProps {
  articleId: string;
  summary: string;
  jevResults: Record<string, any>;
  rating: number;
  idToken: string;
  initialFeedback?: string;
}

export function FeedbackStream({
  articleId,
  summary,
  jevResults,
  rating,
  idToken,
  initialFeedback = '',
}: FeedbackStreamProps) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [isStreaming, setIsStreaming] = useState(!initialFeedback);
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (initialFeedback || hasStartedRef.current || !idToken) return;
    hasStartedRef.current = true;

    const startStreaming = async () => {
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            articleId,
            summary,
            jevResults,
            rating,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to start feedback stream');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setFeedback(accumulated);
        }
      } catch (err) {
        console.error('Streaming error:', err);
        setError('Unable to stream live tutor feedback. Reviewing your scores above.');
      } finally {
        setIsStreaming(false);
      }
    };

    startStreaming();
  }, [articleId, summary, jevResults, rating, idToken, initialFeedback]);

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2.5 text-indigo-700">
        <Sparkles className="h-4 w-4 animate-pulse text-indigo-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
          AI Tutor Coaching Feedback
        </h3>
      </div>

      <div className="mt-3.5 text-base leading-relaxed text-slate-800 font-sans">
        {isStreaming && !feedback && (
          <div className="flex items-center gap-2 text-sm text-indigo-700/80 animate-pulse font-medium">
            <MessageSquare className="h-4 w-4" />
            <span>Analyzing recall fidelity and generating coaching feedback...</span>
          </div>
        )}

        {feedback && (
          <p className="whitespace-pre-line text-slate-800 leading-relaxed">
            {feedback}
            {isStreaming && (
              <span className="inline-block h-4 w-1.5 ml-1 bg-indigo-600 animate-pulse align-middle" />
            )}
          </p>
        )}

        {error && <p className="text-sm text-slate-500 italic">{error}</p>}
      </div>
    </div>
  );
}

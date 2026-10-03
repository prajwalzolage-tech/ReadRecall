// src/hooks/use-word-count.ts
// Hook for live word counting and range validation

import { useMemo } from 'react';
import {
  SUMMARY_MIN_WORDS,
  SUMMARY_SUGGESTED_MIN,
  SUMMARY_SUGGESTED_MAX,
} from '@/lib/constants';

export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function useWordCount(
  text: string,
  minWords = SUMMARY_MIN_WORDS,
  suggestedMin = SUMMARY_SUGGESTED_MIN,
  suggestedMax = SUMMARY_SUGGESTED_MAX
) {
  return useMemo(() => {
    const count = countWords(text);
    return {
      count,
      isAboveMin: count >= minWords,
      isInRange: count >= suggestedMin && count <= suggestedMax,
      minWords,
      suggestedMin,
      suggestedMax,
    };
  }, [text, minWords, suggestedMin, suggestedMax]);
}

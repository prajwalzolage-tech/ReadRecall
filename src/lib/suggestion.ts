// src/lib/suggestion.ts
// Adaptive article suggestion engine based on recent attempt scores

import type { Attempt, ArticleListItem } from '@/types';

export type DifficultyBand = 'easy' | 'medium' | 'hard';

export interface RecommendationResult {
  difficulty: DifficultyBand;
  reason: string;
  minWords: number;
  maxWords: number;
  recommendedArticle?: ArticleListItem;
}

/**
 * Determine the recommended difficulty band based on user's recent attempts
 */
export function getAdaptiveDifficulty(recentAttempts: Attempt[]): {
  difficulty: DifficultyBand;
  reason: string;
  minWords: number;
  maxWords: number;
} {
  if (recentAttempts.length < 2) {
    return {
      difficulty: 'medium',
      reason: 'Standard medium difficulty to calibrate your baseline recall ability.',
      minWords: 300,
      maxWords: 400,
    };
  }

  const lastTwo = recentAttempts.slice(0, 2);
  const isHighPerformer = lastTwo.every((a) => a.rating >= 8);
  const isStruggling = lastTwo.every((a) => a.rating <= 4);

  if (isHighPerformer) {
    return {
      difficulty: 'hard',
      reason: 'Strong performance on recent summaries! Leveling up to longer, higher-density articles.',
      minWords: 400,
      maxWords: 600,
    };
  }

  if (isStruggling) {
    return {
      difficulty: 'easy',
      reason: 'Focusing on shorter, high-clarity articles to rebuild recall confidence and coverage.',
      minWords: 200,
      maxWords: 300,
    };
  }

  return {
    difficulty: 'medium',
    reason: 'Maintaining medium length to solidify core active recall habits.',
    minWords: 300,
    maxWords: 400,
  };
}

/**
 * Pick the best matching article from available articles
 */
export function pickRecommendedArticle(
  articles: ArticleListItem[],
  recentAttempts: Attempt[]
): RecommendationResult {
  const adaptive = getAdaptiveDifficulty(recentAttempts);
  const attemptedIds = new Set(recentAttempts.map((a) => a.articleId));

  // Find unattempted articles in the target range
  const unattempted = articles.filter((a) => !attemptedIds.has(a.id));
  const pool = unattempted.length > 0 ? unattempted : articles;

  const inRange = pool.filter(
    (a) => a.wordCount >= adaptive.minWords && a.wordCount <= adaptive.maxWords
  );

  const chosen = inRange[0] || pool[0];

  return {
    ...adaptive,
    recommendedArticle: chosen,
  };
}

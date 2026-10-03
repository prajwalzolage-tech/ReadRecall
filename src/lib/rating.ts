// src/lib/rating.ts
// Pure rating calculation, safety guards, gibberish detection, and improvement delta

import { computeCopyRatio, tokenizeWords } from './copy-detection';
import { defaultRatingConfig, RatingConfig } from './rating.config';
import type { DimensionScores, Guards, Flags, RatingResult, Attempt } from '@/types';

export interface JevOutputItem {
  type?: 'noul' | 'score' | 'choice';
  probability?: number;
  value?: number | string;
  confidence?: number;
}

export type JevEvaluationOutput = Record<string, JevOutputItem | any>;

/**
 * Check if the summary is gibberish or spam (e.g. repeated words, < 3 unique words).
 */
export function isGibberish(summary: string): boolean {
  const tokens = tokenizeWords(summary);
  if (tokens.length < 3) return true;

  const unique = new Set(tokens);
  // If fewer than 3 unique words or extremely repetitive ratio
  if (unique.size < 3) return true;
  if (tokens.length >= 8 && unique.size / tokens.length < 0.25) return true;

  return false;
}

/**
 * Extract normalized score (0 to 1) from Jev question output.
 */
function extractScoreValue(item: any, fallback = 0.5): { score: number; confidence: number } {
  if (!item) return { score: fallback, confidence: 1 };

  if (typeof item === 'number') {
    return { score: Math.min(1, Math.max(0, item)), confidence: 1 };
  }

  // Jev noul returns probability (0 to 1)
  if (typeof item.probability === 'number') {
    return {
      score: Math.min(1, Math.max(0, item.probability)),
      confidence: typeof item.confidence === 'number' ? item.confidence : 1,
    };
  }

  // Jev Score or value
  if (typeof item.value === 'number') {
    return {
      score: Math.min(1, Math.max(0, item.value)),
      confidence: typeof item.confidence === 'number' ? item.confidence : 1,
    };
  }

  return { score: fallback, confidence: 0.5 };
}

/**
 * Calculate the 1–10 rating and apply all safety and quality guards.
 */
export function calculateRating(
  jevResults: JevEvaluationOutput,
  article: string,
  summary: string,
  config: RatingConfig = defaultRatingConfig
): RatingResult {
  const { weights, thresholds } = config;

  // 1. Calculate Coverage from key points (kp_0..kp_n)
  const kpKeys = Object.keys(jevResults).filter((k) => k.startsWith('kp_'));
  let coverage = 0.5;
  let coverageConfidence = 1;

  if (kpKeys.length > 0) {
    let sum = 0;
    let confSum = 0;
    for (const key of kpKeys) {
      const { score, confidence } = extractScoreValue(jevResults[key], 0);
      sum += score;
      confSum += confidence;
    }
    coverage = sum / kpKeys.length;
    coverageConfidence = confSum / kpKeys.length;
  }

  // 2. Extract dimension scores
  const mainIdeaRes = extractScoreValue(jevResults.main_idea, 0.5);
  const faithRes = extractScoreValue(jevResults.faithfulness, 0.5);
  const clarityRes = extractScoreValue(jevResults.clarity, 0.5);
  const purposeRes = extractScoreValue(jevResults.applied_purpose, 0.5);

  const dimensionScores: DimensionScores = {
    coverage: Number(coverage.toFixed(3)),
    mainIdea: Number(mainIdeaRes.score.toFixed(3)),
    faithfulness: Number(faithRes.score.toFixed(3)),
    clarity: Number(clarityRes.score.toFixed(3)),
    appliedPurpose: Number(purposeRes.score.toFixed(3)),
  };

  // 3. Compute weighted raw score (0 to 1)
  const rawScore =
    weights.coverage * dimensionScores.coverage +
    weights.mainIdea * dimensionScores.mainIdea +
    weights.faithfulness * dimensionScores.faithfulness +
    weights.clarity * dimensionScores.clarity +
    weights.purpose * dimensionScores.appliedPurpose;

  // Initial 1-10 mapping: 1 + Math.round(rawScore * 9)
  let rating = Math.min(10, Math.max(1, Math.round(rawScore * 9) + 1));

  // 4. Copy ratio
  const copyRatio = computeCopyRatio(article, summary);

  // 5. Evaluate guards
  const words = tokenizeWords(summary);
  const wordCount = words.length;

  const wordCountGuard = wordCount < thresholds.minWords;
  const copyGuard = copyRatio >= thresholds.copyRatioCap.ratio;

  const contradictionProb = extractScoreValue(jevResults.contradiction, 0).score;
  const contradictionGuard = contradictionProb >= thresholds.contradictionCap.threshold;

  const offTopicProb = extractScoreValue(jevResults.off_topic, 0).score;
  const offTopicGuard = offTopicProb >= thresholds.offTopicCap.threshold;

  const injectionProb = extractScoreValue(jevResults.injection, 0).score;
  const injectionGuard = injectionProb >= thresholds.injectionThreshold;

  const gibberish = isGibberish(summary);

  // 6. Apply guard caps (in priority order)
  if (injectionGuard) {
    rating = 1;
  } else if (wordCountGuard || gibberish) {
    rating = 1;
  } else {
    if (offTopicGuard) {
      rating = Math.min(rating, thresholds.offTopicCap.maxRating);
    }
    if (copyGuard) {
      rating = Math.min(rating, thresholds.copyRatioCap.maxRating);
    }
    if (contradictionGuard) {
      rating = Math.min(rating, thresholds.contradictionCap.maxRating);
    }
  }

  // 7. Check confidence flags
  const minConfidence = Math.min(
    coverageConfidence,
    mainIdeaRes.confidence,
    faithRes.confidence,
    clarityRes.confidence
  );
  const lowConfidence = minConfidence < thresholds.lowConfidence;

  // Primary gap extraction
  let primaryGap = 'None';
  if (jevResults.primary_gap) {
    primaryGap =
      typeof jevResults.primary_gap === 'string'
        ? jevResults.primary_gap
        : jevResults.primary_gap.value ?? 'Key details missed';
  } else if (dimensionScores.coverage < 0.5) {
    primaryGap = 'Missed critical key points';
  } else if (dimensionScores.faithfulness < 0.5) {
    primaryGap = 'Inaccurate or unsupported statements';
  } else if (dimensionScores.mainIdea < 0.5) {
    primaryGap = 'Central thesis was unclear or incomplete';
  }

  const guards: Guards = {
    wordCountGuard,
    copyGuard,
    contradictionGuard,
    offTopicGuard,
    injectionGuard,
  };

  const flags: Flags = {
    lowConfidence,
    copyRatio,
    primaryGap: String(primaryGap),
  };

  return {
    rawScore: Number(rawScore.toFixed(3)),
    rating,
    dimensionScores,
    guards,
    flags,
  };
}

/**
 * Compute progress improvement delta between an original attempt and a retry.
 */
export function computeDelta(
  original: Pick<Attempt, 'rating' | 'dimensionScores'>,
  retry: Pick<Attempt, 'rating' | 'dimensionScores'>
) {
  const ratingDelta = retry.rating - original.rating;
  const dimensionDeltas: Record<keyof DimensionScores, number> = {
    coverage: Number((retry.dimensionScores.coverage - original.dimensionScores.coverage).toFixed(2)),
    mainIdea: Number((retry.dimensionScores.mainIdea - original.dimensionScores.mainIdea).toFixed(2)),
    faithfulness: Number(
      (retry.dimensionScores.faithfulness - original.dimensionScores.faithfulness).toFixed(2)
    ),
    clarity: Number((retry.dimensionScores.clarity - original.dimensionScores.clarity).toFixed(2)),
    appliedPurpose: Number(
      (retry.dimensionScores.appliedPurpose - original.dimensionScores.appliedPurpose).toFixed(2)
    ),
  };

  return {
    ratingDelta,
    dimensionDeltas,
  };
}

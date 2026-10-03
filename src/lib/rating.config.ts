// src/lib/rating.config.ts
// Weights, caps, and threshold configuration for ReadRecall rating engine

export interface RatingConfig {
  weights: {
    coverage: number;
    mainIdea: number;
    faithfulness: number;
    clarity: number;
    purpose: number;
  };
  thresholds: {
    minWords: number;
    copyRatioCap: {
      ratio: number;
      maxRating: number;
    };
    contradictionCap: {
      threshold: number;
      maxRating: number;
    };
    offTopicCap: {
      threshold: number;
      maxRating: number;
    };
    injectionThreshold: number;
    lowConfidence: number;
  };
}

export const defaultRatingConfig: RatingConfig = {
  weights: {
    coverage: 0.35,
    mainIdea: 0.25,
    faithfulness: 0.25,
    clarity: 0.10,
    purpose: 0.05,
  },
  thresholds: {
    minWords: 15,
    copyRatioCap: {
      ratio: 0.6,
      maxRating: 4,
    },
    contradictionCap: {
      threshold: 0.7,
      maxRating: 5,
    },
    offTopicCap: {
      threshold: 0.7,
      maxRating: 2,
    },
    injectionThreshold: 0.7,
    lowConfidence: 0.5,
  },
};

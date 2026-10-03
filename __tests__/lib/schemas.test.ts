import { describe, it, expect } from 'vitest';
import { ArticleSchema, AttemptSchema } from '@/lib/schemas';

describe('Zod Schemas', () => {
  it('validates a correct article object', () => {
    const validArticle = {
      id: 'art-1',
      title: 'Proof of Stake Explained',
      source: 'curated' as const,
      text: 'Proof of stake is a consensus mechanism used by blockchains...',
      wordCount: 350,
      status: 'ready' as const,
      mainIdea: 'Proof of Stake provides energy-efficient consensus.',
      keyPoints: [
        { text: 'Validators stake capital to propose blocks', verified: true, confidence: 0.95 },
      ],
      keyPointSource: 'human' as const,
      contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
    };

    const parsed = ArticleSchema.safeParse(validArticle);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid article without title', () => {
    const invalidArticle = {
      source: 'curated',
      text: 'Missing title',
    };

    const parsed = ArticleSchema.safeParse(invalidArticle);
    expect(parsed.success).toBe(false);
  });

  it('validates attempt schema with dimension scores', () => {
    const validAttempt = {
      id: 'att-1',
      userId: 'user-123',
      articleId: 'art-1',
      summary: 'This article discusses proof of stake consensus...',
      dimensionScores: {
        coverage: 0.8,
        mainIdea: 0.9,
        faithfulness: 0.85,
        clarity: 0.75,
        appliedPurpose: 0.7,
      },
      rating: 8,
      guards: {
        wordCountGuard: false,
        copyGuard: false,
        contradictionGuard: false,
        offTopicGuard: false,
        injectionGuard: false,
      },
      flags: {
        lowConfidence: false,
        copyRatio: 0.1,
        primaryGap: 'Missing validator slashing details',
      },
      jevModel: 'typesafe-v1',
      latency: 420,
      createdAt: new Date().toISOString(),
    };

    const parsed = AttemptSchema.safeParse(validAttempt);
    expect(parsed.success).toBe(true);
  });
});

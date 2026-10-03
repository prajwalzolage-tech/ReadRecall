// __tests__/api/evaluate.test.ts

import { describe, it, expect } from 'vitest';
import { evaluateRequestSchema } from '@/lib/schemas';
import { calculateRating } from '@/lib/rating';

describe('evaluate-integration', () => {
  it('validates evaluate request body with Zod schema', () => {
    const valid = evaluateRequestSchema.safeParse({
      articleId: 'art_123',
      summary: 'This is a valid summary with sufficient length and content.',
    });
    expect(valid.success).toBe(true);

    const invalid = evaluateRequestSchema.safeParse({
      articleId: '',
      summary: '',
    });
    expect(invalid.success).toBe(false);
  });

  it('runs end-to-end rating computation with mocked Jev outputs', () => {
    const mockJev = {
      kp_0: { probability: 0.9 },
      kp_1: { probability: 0.85 },
      main_idea: { value: 0.9 },
      faithfulness: { value: 0.95 },
      clarity: { value: 0.8 },
      applied_purpose: { probability: 0.75 },
      contradiction: { probability: 0.02 },
      off_topic: { probability: 0.01 },
      injection: { probability: 0.01 },
      primary_gap: { value: 'none' },
    };

    const articleText =
      'Consensus algorithms enable network nodes to maintain a Byzantine fault tolerant replicated state machine without centralized coordination.';
    const summary =
      'The article discusses how consensus algorithms allow distributed network nodes to securely maintain a replicated state machine without a central coordinator.';

    const result = calculateRating(mockJev, articleText, summary);

    expect(result.rating).toBeGreaterThanOrEqual(7);
    expect(result.dimensionScores.coverage).toBeGreaterThan(0.8);
    expect(result.guards.wordCountGuard).toBe(false);
    expect(result.guards.copyGuard).toBe(false);
    expect(result.guards.injectionGuard).toBe(false);
  });
});

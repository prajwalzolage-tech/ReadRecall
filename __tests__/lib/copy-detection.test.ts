// __tests__/lib/copy-detection.test.ts

import { describe, it, expect } from 'vitest';
import {
  computeCopyRatio,
  tokenizeWords,
  extractNgrams,
} from '@/lib/copy-detection';

describe('copy-detection', () => {
  it('tokenizes words properly stripping punctuation and lowercasing', () => {
    const text = 'Hello, World! This is a test... with "quotes" & dashes-here.';
    const tokens = tokenizeWords(text);
    expect(tokens).toEqual([
      'hello',
      'world',
      'this',
      'is',
      'a',
      'test',
      'with',
      'quotes',
      'dashes',
      'here',
    ]);
  });

  it('extracts n-grams correctly', () => {
    const tokens = ['alpha', 'beta', 'gamma', 'delta'];
    const ngrams = extractNgrams(tokens, 3);
    expect(ngrams).toEqual(['alpha beta gamma', 'beta gamma delta']);
  });

  it('returns 0 for empty or disjoint texts', () => {
    expect(computeCopyRatio('', '')).toBe(0);
    expect(
      computeCopyRatio(
        'The blockchain uses proof of work consensus.',
        'Cooking spaghetti with tomato sauce and basil leaves.'
      )
    ).toBe(0);
  });

  it('returns 1.0 for completely verbatim copied text', () => {
    const article =
      'Zero knowledge proofs allow a prover to demonstrate truth of a statement without revealing secret data.';
    const summary =
      'Zero knowledge proofs allow a prover to demonstrate truth of a statement without revealing secret data.';
    const ratio = computeCopyRatio(article, summary);
    expect(ratio).toBe(1.0);
  });

  it('detects partial verbatim copying accurately', () => {
    const article =
      'Smart contracts execute deterministic logic on decentralized state machines and enforce programmatic agreements.';
    const summary =
      'In our class we learned smart contracts execute deterministic logic on decentralized state machines and solve many problems.';
    const ratio = computeCopyRatio(article, summary, 4);
    expect(ratio).toBeGreaterThan(0.3);
    expect(ratio).toBeLessThan(1.0);
  });

  it('handles unicode characters and non-English text gracefully', () => {
    const article = 'Les réseaux distribués utilisent des protocoles de consensus.';
    const summary = 'Les réseaux distribués utilisent des protocoles pour la sécurité.';
    const ratio = computeCopyRatio(article, summary, 3);
    expect(ratio).toBeGreaterThan(0);
  });
});

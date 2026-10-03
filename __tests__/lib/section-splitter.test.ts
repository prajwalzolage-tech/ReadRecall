// __tests__/lib/section-splitter.test.ts

import { describe, it, expect } from 'vitest';
import { splitSections } from '@/lib/section-splitter';

describe('section-splitter', () => {
  it('returns a single section for short articles under 800 words', () => {
    const text = 'This is a short article about active recall. It has only a few words.';
    const sections = splitSections(text, 800);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Full Article');
    expect(sections[0].isDefault).toBe(true);
  });

  it('splits by markdown headings when present in long texts', () => {
    const paragraph =
      'Distributed systems face trade-offs between consistency, availability, and partition tolerance. Under the CAP theorem, networks must choose two in the presence of partitions. ';
    const longContent = paragraph.repeat(15);

    const markdownDoc = `# Introduction\n${longContent}\n\n# Architecture\n${longContent}\n\n# Security Considerations\n${longContent}`;

    const sections = splitSections(markdownDoc, 200);
    expect(sections.length).toBeGreaterThanOrEqual(3);
    expect(sections[0].title).toContain('Introduction');
    expect(sections[1].title).toContain('Architecture');
    expect(sections[2].title).toContain('Security Considerations');
    expect(sections[0].isDefault).toBe(true);
  });

  it('splits long text without headings into ~500 word sentence chunks', () => {
    const sentence =
      'Smart contract auditing identifies common reentrancy and arithmetic overflow patterns before on-chain deployment. ';
    const textWithoutHeadings = sentence.repeat(50); // ~750 words

    const sections = splitSections(textWithoutHeadings, 400);
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[0].title).toBe('Part 1');
    expect(sections[1].title).toBe('Part 2');
    expect(sections[0].isDefault).toBe(true);
  });
});

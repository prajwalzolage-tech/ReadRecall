// src/lib/schemas.ts
// Zod validation schemas for all inputs/outputs

import { z } from 'zod';

// ─── Article schemas ───

export const keyPointSchema = z.object({
  text: z.string().min(5).max(500),
  verified: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
});

export const sectionSchema = z.object({
  title: z.string(),
  text: z.string(),
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
  wordCount: z.number().int().min(0),
  isDefault: z.boolean(),
});

export const articleSchema = z.object({
  title: z.string().min(1).max(500),
  source: z.enum(['curated', 'uploaded', 'search', 'pasted', 'url']),
  link: z.string().url().optional(),
  authors: z.array(z.string()).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  cloudinaryId: z.string().optional(),
  contentHash: z.string().length(64),
  text: z.string().min(50).max(100000),
  wordCount: z.number().int().min(10),
  status: z.enum(['ready', 'processing', 'error']),
  mainIdea: z.string().min(10).max(500),
  keyPoints: z.array(keyPointSchema).min(1).max(10),
  appliedPurpose: z.string().max(500).optional(),
  keyPointSource: z.enum(['human', 'ai']),
  sections: z.array(sectionSchema).optional(),
  createdAt: z.string(),
  createdBy: z.string(),
});

// ─── User schemas ───

export const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().url().optional(),
  privacySummary: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Attempt schemas ───

export const dimensionScoresSchema = z.object({
  coverage: z.number().min(0).max(1),
  mainIdea: z.number().min(0).max(1),
  faithfulness: z.number().min(0).max(1),
  clarity: z.number().min(0).max(1),
  appliedPurpose: z.number().min(0).max(1),
});

export const guardsSchema = z.object({
  wordCountGuard: z.boolean(),
  copyGuard: z.boolean(),
  contradictionGuard: z.boolean(),
  offTopicGuard: z.boolean(),
  injectionGuard: z.boolean(),
});

export const flagsSchema = z.object({
  lowConfidence: z.boolean(),
  copyRatio: z.number().min(0).max(1),
  primaryGap: z.string(),
});

export const attemptSchema = z.object({
  userId: z.string(),
  articleId: z.string(),
  section: z.string().optional(),
  summary: z.string().optional(),
  dimensionScores: dimensionScoresSchema,
  rating: z.number().int().min(1).max(10),
  guards: guardsSchema,
  flags: flagsSchema,
  jevModel: z.string(),
  latency: z.number().min(0),
  retryOf: z.string().optional(),
  createdAt: z.string(),
});

// ─── API request schemas ───

export const evaluateRequestSchema = z.object({
  articleId: z.string().min(1),
  summary: z.string().min(1).max(5000),
  section: z.string().optional(),
});

export const feedbackRequestSchema = z.object({
  articleId: z.string().min(1),
  summary: z.string().min(1).max(5000),
  jevResults: z.record(z.string(), z.unknown()),
  rating: z.number().int().min(1).max(10),
});

export const uploadProcessRequestSchema = z.object({
  cloudinaryId: z.string().min(1),
  originalFilename: z.string().min(1),
  mimeType: z.string().min(1),
});

export const searchQuerySchema = z.object({
  q: z.string().min(2).max(200),
});

export const fetchFullTextRequestSchema = z.object({
  pdfUrl: z.string().url(),
  title: z.string(),
  authors: z.array(z.string()).optional(),
  year: z.number().optional(),
  doi: z.string().optional(),
});

// ─── LLM key point generation output schema ───

export const generatedKeyPointsSchema = z.object({
  mainIdea: z.string().min(10).max(500),
  keyPoints: z.array(z.string().min(5).max(500)).min(4).max(6),
  appliedPurpose: z.string().min(10).max(500),
});

// PascalCase aliases
export const KeyPointSchema = keyPointSchema;
export const SectionSchema = sectionSchema;
export const ArticleSchema = articleSchema;
export const UserSchema = userSchema;
export const AttemptSchema = attemptSchema;


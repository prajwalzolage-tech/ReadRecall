// src/types/index.ts
// Shared TypeScript types for ReadRecall

export interface Article {
  id: string;
  title: string;
  source: 'curated' | 'uploaded' | 'search' | 'pasted' | 'url';
  link?: string;
  authors?: string[];
  year?: number;
  cloudinaryId?: string;
  contentHash: string;
  text: string;
  wordCount: number;
  status: 'ready' | 'processing' | 'error';
  mainIdea: string;
  keyPoints: KeyPoint[];
  appliedPurpose?: string;
  keyPointSource: 'human' | 'ai';
  sections?: Section[];
  createdAt: string;
  createdBy: string;
}

export interface KeyPoint {
  text: string;
  verified: boolean;
  confidence?: number;
}

export interface Section {
  title: string;
  text: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  isDefault: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  privacySummary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attempt {
  id: string;
  userId: string;
  articleId: string;
  section?: string;
  summary?: string;
  dimensionScores: DimensionScores;
  rating: number;
  guards: Guards;
  flags: Flags;
  jevModel: string;
  latency: number;
  retryOf?: string;
  createdAt: string;
  jevResults?: Record<string, any>;
}

export interface DimensionScores {
  coverage: number;
  mainIdea: number;
  faithfulness: number;
  clarity: number;
  appliedPurpose: number;
}

export interface Guards {
  wordCountGuard: boolean;
  copyGuard: boolean;
  contradictionGuard: boolean;
  offTopicGuard: boolean;
  injectionGuard: boolean;
}

export interface Flags {
  lowConfidence: boolean;
  copyRatio: number;
  primaryGap: string;
}

export interface RatingResult {
  rawScore: number;
  rating: number;
  dimensionScores: DimensionScores;
  guards: Guards;
  flags: Flags;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  doi?: string;
  pdfUrl?: string;
  source: 'arxiv' | 'openalex';
  fullTextAvailable: boolean;
}

export interface MergedSearchResult extends SearchResult {
  sources: ('arxiv' | 'openalex')[];
}

// API request/response types

export interface EvaluateRequest {
  articleId: string;
  summary: string;
  section?: string;
}

export interface EvaluateResponse {
  rating: number;
  dimensionScores: DimensionScores;
  guards: Guards;
  flags: Flags;
  jevModel: string;
  latency: number;
  attemptId: string;
}

export interface FeedbackRequest {
  articleId: string;
  summary: string;
  jevResults: Record<string, unknown>;
  rating: number;
}

export interface UploadSignResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export interface UploadProcessRequest {
  cloudinaryId: string;
  originalFilename: string;
  mimeType: string;
}

export interface UploadProcessResponse {
  articleId: string;
  wordCount: number;
  sections?: Section[];
  keyPointSource: 'ai';
}

export interface ArticleListItem {
  id: string;
  title: string;
  wordCount: number;
  source: Article['source'];
  keyPointSource: Article['keyPointSource'];
  mainIdea?: string;
}

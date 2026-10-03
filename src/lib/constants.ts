// src/lib/constants.ts
// Shared constants for ReadRecall

export const APP_NAME = 'ReadRecall';

// Reading timer
export const WORDS_PER_MINUTE = 200;
export const TIMER_BUFFER_SECONDS = 15;

// Summary constraints
export const SUMMARY_MIN_WORDS = 15;
export const SUMMARY_SUGGESTED_MIN = 40;
export const SUMMARY_SUGGESTED_MAX = 120;
export const SUMMARY_MAX_CHARS = 5000;

// Article constraints
export const ARTICLE_MIN_WORDS = 100;
export const ARTICLE_MAX_WORDS = 5000;
export const SECTION_MAX_WORDS = 800;
export const SECTION_TARGET_WORDS = 500;

// Upload constraints
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

// Rate limits (per user, per minute)
export const RATE_LIMIT_EVALUATE = 10;
export const RATE_LIMIT_UPLOAD = 5;
export const RATE_LIMIT_SEARCH = 5;

// Search
export const SEARCH_MAX_RESULTS = 10;
export const FETCH_TIMEOUT_MS = 30000;
export const FETCH_MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Word count badges
export const WORD_COUNT_GOOD_MIN = 250;
export const WORD_COUNT_GOOD_MAX = 500;
export const WORD_COUNT_LONG_MAX = 800;

// src/lib/data-store.ts
// Resilient data access layer for ReadRecall
// Seamlessly uses Firestore when credentials are fully configured,
// and gracefully falls back to curated articles & in-memory persistence.

import app from '@/lib/firebase/client';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, query, where, limit } from 'firebase/firestore';

const db = getFirestore(app);

export function isFirestoreConfigured(): boolean {
  // Relying entirely on client credentials now
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}
import { CURATED_ARTICLES, getCuratedArticleById } from '@/lib/curated-articles';
import type { Article, Attempt, ArticleListItem } from '@/types';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '.readrecall-data.json');

function loadLocalData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('[DataStore] Failed to load local data', e);
  }
  return null;
}

// Global cache to persist state across Next.js Turbopack / HMR module reloads
const globalStore = globalThis as unknown as {
  __readrecall_articles?: Map<string, Article>;
  __readrecall_attempts?: Map<string, Attempt>;
  __readrecall_users?: Map<string, Record<string, any>>;
};

if (!globalStore.__readrecall_articles) {
  globalStore.__readrecall_articles = new Map();
  globalStore.__readrecall_attempts = new Map();
  globalStore.__readrecall_users = new Map();

  for (const art of CURATED_ARTICLES) {
    globalStore.__readrecall_articles.set(art.id, art);
  }

  const localData = loadLocalData();
  if (localData) {
    if (localData.articles) {
      for (const [k, v] of localData.articles) {
        globalStore.__readrecall_articles.set(k, v);
      }
    }
    if (localData.attempts) {
      for (const [k, v] of localData.attempts) {
        globalStore.__readrecall_attempts.set(k, v);
      }
    }
    if (localData.users) {
      for (const [k, v] of localData.users) {
        globalStore.__readrecall_users.set(k, v);
      }
    }
  }
}

const memoryArticles = globalStore.__readrecall_articles!;
const memoryAttempts = globalStore.__readrecall_attempts!;
const memoryUsers = globalStore.__readrecall_users!;

function saveLocalData() {
  if (isFirestoreConfigured()) return; // Don't bother saving to local JSON if using Firestore
  try {
    const data = {
      articles: Array.from(memoryArticles.entries()),
      attempts: Array.from(memoryAttempts.entries()),
      users: Array.from(memoryUsers.entries()),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[DataStore] Failed to save local data', e);
  }
}

/**
 * List articles for the home feed / selection view
 */
export async function getArticles(filter?: {
  source?: string | null;
}): Promise<ArticleListItem[]> {
  // If Firestore is properly configured, attempt to fetch from Firestore
  if (isFirestoreConfigured()) {
    try {
      const articlesRef = collection(db, 'articles');
      const q = query(articlesRef, where('status', '==', 'ready'), limit(50));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        let items: ArticleListItem[] = snapshot.docs.map((document) => {
          const d = document.data();
          return {
            id: document.id,
            title: d.title,
            wordCount: d.wordCount,
            source: d.source,
            keyPointSource: d.keyPointSource,
            authors: d.authors,
            year: d.year,
            mainIdea: d.mainIdea,
          };
        });

        if (filter?.source) {
          items = items.filter((a) => a.source === filter.source);
        }

        if (items.length > 0) {
          return items;
        }
      }
    } catch (err) {
      console.warn(
        '[DataStore] Firestore fetch failed or unindexed, using curated articles:',
        err instanceof Error ? err.message : err
      );
    }
  }

  // Graceful fallback to memory & curated articles
  const allArticles = Array.from(memoryArticles.values()).filter(
    (a) => a.status === 'ready'
  );

  let filtered = allArticles;
  if (filter?.source) {
    filtered = filtered.filter((a) => a.source === filter.source);
  }

  // Sort by createdAt descending
  filtered.sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return filtered.map((a) => ({
    id: a.id,
    title: a.title,
    wordCount: a.wordCount,
    source: a.source,
    keyPointSource: a.keyPointSource,
    authors: a.authors,
    year: a.year,
    mainIdea: a.mainIdea,
  }));
}

/**
 * Fetch a single article by ID
 */
export async function getArticleById(id: string): Promise<Article | null> {
  // 1. Direct curated match
  const curated = getCuratedArticleById(id);
  if (curated) return curated;

  // 2. Memory store match
  if (memoryArticles.has(id)) {
    return memoryArticles.get(id)!;
  }

  if (isFirestoreConfigured()) {
    try {
      const docRef = doc(db, 'articles', id);
      const document = await getDoc(docRef);
      if (document.exists()) {
        const article = { id: document.id, ...document.data() } as Article;
        memoryArticles.set(document.id, article);
        return article;
      }
    } catch (err) {
      console.warn(
        `[DataStore] Firestore article lookup for ${id} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return null;
}

/**
 * Create or save an article
 */
export async function saveArticle(
  articleData: Partial<Article> & { title: string; text: string }
): Promise<Article> {
  const id =
    articleData.id ||
    `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const fullArticle: Article = {
    id,
    title: articleData.title,
    text: articleData.text,
    source: articleData.source || 'uploaded',
    status: articleData.status || 'ready',
    wordCount: articleData.wordCount || articleData.text.trim().split(/\s+/).length,
    contentHash: articleData.contentHash || id,
    mainIdea: articleData.mainIdea || '',
    keyPoints: articleData.keyPoints || [],
    keyPointSource: articleData.keyPointSource || 'ai',
    appliedPurpose: articleData.appliedPurpose,
    authors: articleData.authors,
    year: articleData.year,
    sections: articleData.sections,
    createdAt: articleData.createdAt || new Date().toISOString(),
    createdBy: articleData.createdBy || 'user',
  };

  // Cache in memory
  memoryArticles.set(id, fullArticle);
  saveLocalData();

  if (isFirestoreConfigured()) {
    try {
      await setDoc(doc(db, 'articles', id), fullArticle);
    } catch (err) {
      console.warn(
        '[DataStore] Could not persist article to Firestore:',
        err instanceof Error ? err.message : err
      );
    }
  }

  return fullArticle;
}

/**
 * Save an evaluation attempt
 */
export async function saveAttempt(
  attemptData: Omit<Attempt, 'id'> & { id?: string }
): Promise<Attempt> {
  const id =
    attemptData.id ||
    `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const fullAttempt: Attempt = {
    ...attemptData,
    id,
    createdAt: attemptData.createdAt || new Date().toISOString(),
  };

  // Cache in memory
  memoryAttempts.set(id, fullAttempt);
  saveLocalData();

  if (isFirestoreConfigured()) {
    try {
      const docRef = await addDoc(collection(db, 'attempts'), attemptData);
      fullAttempt.id = docRef.id;
      memoryAttempts.set(docRef.id, fullAttempt);
    } catch (err) {
      console.warn(
        '[DataStore] Could not persist attempt to Firestore:',
        err instanceof Error ? err.message : err
      );
    }
  }

  return fullAttempt;
}

/**
 * Fetch a single attempt by ID
 */
export async function getAttemptById(id: string): Promise<Attempt | null> {
  // Check memory store
  if (memoryAttempts.has(id)) {
    return memoryAttempts.get(id)!;
  }

  if (isFirestoreConfigured()) {
    try {
      const document = await getDoc(doc(db, 'attempts', id));
      if (document.exists()) {
        const attempt = { id: document.id, ...document.data() } as Attempt;
        memoryAttempts.set(document.id, attempt);
        return attempt;
      }
    } catch (err) {
      console.warn(
        `[DataStore] Firestore attempt lookup for ${id} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return null;
}

/**
 * List attempts for a specific user
 */
export async function getAttemptsByUserId(
  userId: string,
  articleId?: string | null
): Promise<Attempt[]> {
  if (isFirestoreConfigured()) {
    try {
      let q = query(collection(db, 'attempts'), where('userId', '==', userId));

      if (articleId) {
        q = query(q, where('articleId', '==', articleId));
      }

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const attempts = snapshot.docs.map(
          (document: any) => ({ id: document.id, ...document.data() } as Attempt)
        );
        attempts.sort(
          (a: Attempt, b: Attempt) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        for (const att of attempts) {
          memoryAttempts.set(att.id, att);
        }
        return attempts;
      }
    } catch (err) {
      console.warn(
        '[DataStore] Firestore query attempts failed:',
        err instanceof Error ? err.message : err
      );
    }
  }

  // Fallback to memory
  let userAttempts = Array.from(memoryAttempts.values()).filter(
    (a) => a.userId === userId
  );

  if (articleId) {
    userAttempts = userAttempts.filter((a) => a.articleId === articleId);
  }

  userAttempts.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return userAttempts;
}

/**
 * Get user profile and preferences
 */
export async function getUserProfile(uid: string, email: string) {
  if (isFirestoreConfigured()) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid,
          email,
          privacySummary: data?.privacySummary ?? false,
          displayName: data?.displayName ?? email.split('@')[0],
          createdAt: data?.createdAt ?? new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn(
        `[DataStore] Firestore profile lookup for ${uid} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  const cached = memoryUsers.get(uid);
  return {
    uid,
    email,
    privacySummary: cached?.privacySummary ?? false,
    displayName: cached?.displayName ?? email.split('@')[0],
    createdAt: cached?.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Update user profile preferences
 */
export async function updateUserProfile(
  uid: string,
  updates: Record<string, any>
) {
  const current = memoryUsers.get(uid) || {};
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  memoryUsers.set(uid, updated);
  saveLocalData();

  if (isFirestoreConfigured()) {
    try {
      await setDoc(doc(db, 'users', uid), updated, { merge: true });
    } catch (err) {
      console.warn(
        `[DataStore] Firestore profile update for ${uid} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return updated;
}

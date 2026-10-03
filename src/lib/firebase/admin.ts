// src/lib/firebase/admin.ts
// Firebase Admin SDK - server-side only
// Used in API route handlers and server actions for Firestore reads/writes and auth verification
// NEVER import this file in client components

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Graceful fallback for build-time analysis or local dev without configured credentials
  return initializeApp({
    projectId: projectId || 'demo-readrecall',
  });
}

export function isFirestoreConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

const adminApp = getAdminApp();

export const db = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);


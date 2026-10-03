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

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'readercall-8e3f0';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Graceful fallback for server-side auth verification and local dev
  return initializeApp({
    projectId,
  });
}

export function isFirestoreConfigured(): boolean {
  if (process.env.FIREBASE_USE_ADC === 'true') {
    return true; // Allow Application Default Credentials (e.g. gcloud auth)
  }
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

const adminApp = getAdminApp();

export const db = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);


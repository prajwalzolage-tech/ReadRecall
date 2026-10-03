// src/lib/firebase/client.ts
// Firebase Client SDK - used ONLY for authentication in the browser
// All data reads/writes go through Firebase Admin on the server side

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDutcScQJ5U0UV6bqjH1mmki7yGuwVaVKc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'readercall-8e3f0.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'readercall-8e3f0',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'readercall-8e3f0.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '466796395460',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:466796395460:web:ed7513b6755a63b0dd0291',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-ZX8QH54Y09',
};

// Singleton: reuse existing app if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;

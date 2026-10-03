'use client';

// src/app/login/page.tsx
// Login page with Google Sign-In and email/password authentication

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [loading, user, router]);

  if (!loading && user) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Tagline */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
            <span className="text-base font-bold text-white">R</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Read<span className="text-indigo-600">Recall</span>
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Active recall reading comprehension and coaching
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-10 shadow-sm">
          <h2 className="mb-6 text-center text-lg font-bold text-slate-900 tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>

          {/* Google */}
          <Button
            variant="outline"
            className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs font-semibold py-2.5 h-10"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">or</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Email/Password */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
            />
            <Input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
            />
            <Button
              type="submit"
              className="w-full bg-slate-900 text-white hover:bg-slate-800 shadow-sm font-semibold h-10"
              disabled={submitting}
            >
              {submitting
                ? 'Processing...'
                : isSignUp
                  ? 'Create Free Account'
                  : 'Sign In'}
            </Button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs text-rose-700 font-medium">
              {error}
            </p>
          )}

          {/* Toggle */}
          <p className="mt-6 text-center text-xs text-slate-500 font-medium">
            {isSignUp ? 'Already registered?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-slate-900 font-semibold underline underline-offset-4 hover:text-indigo-600"
            >
              {isSignUp ? 'Sign in' : 'Create account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

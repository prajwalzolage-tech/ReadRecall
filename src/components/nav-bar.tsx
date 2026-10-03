'use client';

// src/components/nav-bar.tsx
// Top navigation bar with logo, user avatar, and sign-out

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';

export function NavBar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 shadow-sm transition group-hover:bg-slate-800">
            <span className="text-sm font-bold text-white tracking-tight">R</span>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Read<span className="text-indigo-600">Recall</span>
          </span>
        </Link>

        {/* Right side navigation */}
        <div className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <>
              <Link
                href="/profile"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Profile
              </Link>
              <Link
                href="/upload"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Upload
              </Link>
              <Link
                href="/search"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Search Papers
              </Link>

              {/* Avatar & Sign out */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'User'}
                    className="h-8 w-8 rounded-full border border-slate-200 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-sm">
                    {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-medium shadow-sm"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

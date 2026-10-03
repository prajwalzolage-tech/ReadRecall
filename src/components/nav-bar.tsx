'use client';

// src/components/nav-bar.tsx
// Top navigation bar with logo, user avatar, and sign-out

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function NavBar() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 sm:gap-6">
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

        {/* Mobile Menu Toggle */}
        <div className="flex items-center md:hidden">
          {user && (
            <div className="flex items-center gap-2 mr-2">
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
            </div>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-slate-600 hover:text-slate-900"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 shadow-lg">
          {user ? (
            <div className="flex flex-col space-y-4">
              <Link
                href="/profile"
                className="text-base font-medium text-slate-700 hover:text-indigo-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/upload"
                className="text-base font-medium text-slate-700 hover:text-indigo-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Upload
              </Link>
              <Link
                href="/search"
                className="text-base font-medium text-slate-700 hover:text-indigo-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Search Papers
              </Link>
              <div className="pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-700 hover:text-rose-600 hover:bg-rose-50 -ml-2"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <Link
                href="/login"
                className="w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button className="w-full">Sign In</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

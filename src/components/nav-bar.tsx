'use client';

// src/components/nav-bar.tsx
// Responsive top navigation bar with mobile slide drawer, backdrop, and user controls

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  BookOpen,
  User as UserIcon,
  Upload,
  Search,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function NavBar() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Library', icon: BookOpen },
    { href: '/profile', label: 'Profile', icon: UserIcon },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/search', label: 'Search Papers', icon: Search },
  ];

  if (pathname === '/landing') {
    return null;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 shadow-sm transition group-hover:bg-slate-800 group-hover:scale-105">
              <span className="text-sm font-bold text-white tracking-tight">R</span>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              Read<span className="text-indigo-600">Recall</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {user ? (
              <>
                {navLinks.map((link) => {
                  const isActive =
                    link.href === '/'
                      ? pathname === '/'
                      : pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <link.icon className="h-4 w-4 text-slate-500" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {/* Avatar & Sign out */}
                <div className="flex items-center gap-3 pl-3 ml-2 border-l border-slate-200">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 group cursor-pointer"
                    title="View Profile"
                  >
                    {user.photoURL ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={user.photoURL}
                        alt={user.displayName ?? 'User'}
                        className="h-8 w-8 rounded-full border border-slate-200 object-cover shadow-xs group-hover:ring-2 group-hover:ring-indigo-400 transition"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-xs group-hover:bg-slate-800 transition">
                        {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-700 max-w-[100px] truncate hidden lg:inline">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-medium text-xs px-2.5 h-8"
                    onClick={signOut}
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-medium shadow-xs"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Right Controls: Avatar + Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <Link href="/profile" className="flex items-center">
                {user.photoURL ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'User'}
                    className="h-8 w-8 rounded-full border border-slate-200 object-cover shadow-xs"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white shadow-xs">
                    {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </div>
                )}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition active:scale-95"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-slate-900" />
              ) : (
                <Menu className="h-5 w-5 text-slate-900" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Mobile Menu Drawer (Slide down) */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 inset-x-0 z-50 border-b border-slate-200 bg-white px-5 py-6 shadow-xl md:hidden animate-in slide-in-from-top-4 duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {user ? (
            <div className="flex flex-col space-y-4">
              {/* User profile card inside mobile menu */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-2">
                {user.photoURL ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.photoURL}
                    alt={user.displayName ?? 'User'}
                    className="h-11 w-11 rounded-full border border-slate-200 object-cover shadow-xs shrink-0"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-xs shrink-0">
                    {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user.displayName || 'Learner'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              {/* Navigation links */}
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === '/'
                      ? pathname === '/'
                      : pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <link.icon
                        className={`h-5 w-5 ${
                          isActive ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Sign out */}
              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-11 px-4 text-sm font-semibold rounded-xl"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2.5 text-rose-500" />
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              <p className="text-xs text-slate-500 text-center mb-1">
                Sign in to save your recall history and track comprehension.
              </p>
              <Link
                href="/login"
                className="w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button className="w-full h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In / Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

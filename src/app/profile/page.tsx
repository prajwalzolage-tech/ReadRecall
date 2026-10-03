// src/app/profile/page.tsx
// User learning profile: comprehension radar chart, rating trend, stats, and privacy settings

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { RadarChart } from '@/components/radar-chart';
import { TrendChart } from '@/components/trend-chart';
import {
  User,
  Shield,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import type { Attempt, DimensionScores } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, idToken } = useAuth();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [privacySummary, setPrivacySummary] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!idToken) return;

    const loadProfileData = async () => {
      setFetching(true);
      try {
        const [attemptsRes, profileRes] = await Promise.all([
          fetch('/api/attempts', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
          fetch('/api/user/profile', {
            headers: { Authorization: `Bearer ${idToken}` },
          }),
        ]);

        if (attemptsRes.ok) {
          const data = await attemptsRes.json();
          let allAttempts: Attempt[] = data.attempts || [];
          try {
            const local = JSON.parse(
              localStorage.getItem('readrecall_user_attempts') || '[]'
            );
            const ids = new Set(allAttempts.map((a) => a.id));
            for (const item of local) {
              if (item.id && !ids.has(item.id)) {
                allAttempts.push(item);
                ids.add(item.id);
              }
            }
          } catch {
            // ignore
          }
          // Sort by createdAt descending
          allAttempts.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );
          setAttempts(allAttempts);
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setPrivacySummary(profileData.privacySummary ?? false);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setFetching(false);
      }
    };

    loadProfileData();
  }, [idToken]);

  const handleTogglePrivacy = async (checked: boolean) => {
    if (!idToken) return;
    setSavingPrivacy(true);
    setPrivacySummary(checked);
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ privacySummary: checked }),
      });
    } catch (err) {
      console.error('Failed to update privacy setting:', err);
    } finally {
      setSavingPrivacy(false);
    }
  };

  // Compute stats
  const totalAttempts = attempts.length;
  const avgRating =
    totalAttempts > 0
      ? (attempts.reduce((sum, a) => sum + a.rating, 0) / totalAttempts).toFixed(1)
      : '—';
  const highestRating =
    totalAttempts > 0 ? Math.max(...attempts.map((a) => a.rating)) : '—';

  // Compute average dimensions over last 10 attempts
  const recentAttempts = attempts.slice(0, 10);
  const avgScores: DimensionScores = recentAttempts.length > 0
    ? {
        coverage:
          recentAttempts.reduce((s, a) => s + (a.dimensionScores?.coverage || 0), 0) /
          recentAttempts.length,
        mainIdea:
          recentAttempts.reduce((s, a) => s + (a.dimensionScores?.mainIdea || 0), 0) /
          recentAttempts.length,
        faithfulness:
          recentAttempts.reduce((s, a) => s + (a.dimensionScores?.faithfulness || 0), 0) /
          recentAttempts.length,
        clarity:
          recentAttempts.reduce((s, a) => s + (a.dimensionScores?.clarity || 0), 0) /
          recentAttempts.length,
        appliedPurpose:
          recentAttempts.reduce((s, a) => s + (a.dimensionScores?.appliedPurpose || 0), 0) /
          recentAttempts.length,
      }
    : {
        coverage: 0,
        mainIdea: 0,
        faithfulness: 0,
        clarity: 0,
        appliedPurpose: 0,
      };

  // Trend data in chronological order
  const trendData = [...attempts]
    .reverse()
    .map((a, i) => ({
      date: a.createdAt,
      rating: a.rating,
      label: `#${i + 1}`,
    }));

  if (loading || fetching) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-900 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading learning profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {user?.displayName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        {/* Privacy Toggle Card */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Shield className="h-4 w-4 text-slate-600" />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 block">Strict Privacy Mode</span>
            <span className="text-slate-500">Store comprehension analytics only (omit raw summary text)</span>
          </div>
          <input
            type="checkbox"
            checked={privacySummary}
            onChange={(e) => handleTogglePrivacy(e.target.checked)}
            disabled={savingPrivacy}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Recalls</span>
            <BookOpen className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 text-3xl font-mono font-bold text-slate-900">
            {totalAttempts}
          </div>
          <p className="mt-1 text-xs text-slate-500">Completed reading sessions</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Rating</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-mono font-bold text-emerald-700">
            {avgRating} <span className="text-sm font-normal text-slate-400">/ 10</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Overall comprehension accuracy</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Personal Best</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 text-3xl font-mono font-bold text-amber-700">
            {highestRating} <span className="text-sm font-normal text-slate-400">/ 10</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Highest single attempt score</p>
        </div>
      </div>

      {/* Visual Analytics Grid: Radar + Trend */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar Chart */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Comprehension Profile</h2>
            <p className="text-xs text-slate-500">
              Averaged multidimensional radar across last 10 sessions
            </p>
          </div>
          <RadarChart scores={avgScores} />
        </div>

        {/* Trend Chart */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Progress Trajectory</h2>
            <p className="text-xs text-slate-500">
              Chronological 1–10 comprehension rating improvement
            </p>
          </div>
          <TrendChart data={trendData} />
        </div>
      </div>

      {/* Attempt History List */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Attempt History</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            No completed attempts yet. Start by selecting an article from the library.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {attempts.map((att) => {
              const formattedDate = new Date(att.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={att.id}
                  onClick={() => router.push(`/results/${att.id}`)}
                  className="flex items-center justify-between py-3.5 px-3 hover:bg-slate-50 rounded-xl cursor-pointer transition"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold border ${
                        att.rating >= 8
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : att.rating >= 5
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {att.rating}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Article: {att.articleId}
                        {att.section && (
                          <span className="ml-2 text-xs text-indigo-600 font-medium">({att.section})</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {formattedDate}
                        {att.retryOf && (
                          <span className="text-amber-700 ml-1">• Revision</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

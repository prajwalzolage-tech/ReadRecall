'use client';

// src/app/landing/page.tsx
// Premium landing page showcasing ReadRecall's full feature set.
// Standalone public page — no auth required.

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import {
  BookOpen,
  Brain,
  Timer,
  Eye,
  EyeOff,
  PenLine,
  Sparkles,
  ShieldCheck,
  Camera,
  BarChart3,
  FileText,
  Search,
  Upload,
  Wifi,
  WifiOff,
  ArrowRight,
  ChevronDown,
  Star,
  Zap,
  Lock,
  Target,
  TrendingUp,
  CheckCircle2,
  Layers,
  Cpu,
  Globe,
  RefreshCw,
  Radar,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Animated counter hook                                                    */
/* ────────────────────────────────────────────────────────────────────────── */
function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.round(progress * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return { count, ref };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Fade-in on scroll                                                        */
/* ────────────────────────────────────────────────────────────────────────── */
function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px 40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  LANDING PAGE                                                             */
/* ────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const stats = {
    dimensions: useCountUp(5),
    guards: useCountUp(6),
    fps: useCountUp(7),
    privacy: useCountUp(100),
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fafaf9]">
      {/* ── STICKY NAV ──────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 shadow-sm transition group-hover:scale-105">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              Read<span className="text-indigo-600">Recall</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-[0.98]"
              >
                Go to Library
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-[0.98]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute top-[-30%] right-[-10%] h-[700px] w-[700px] rounded-full opacity-20"
            style={{
              background:
                'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(168,85,247,0.15) 50%, transparent 70%)',
              animation: 'pulse 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute bottom-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full opacity-15"
            style={{
              background:
                'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(99,102,241,0.1) 50%, transparent 70%)',
              animation: 'pulse 10s ease-in-out infinite reverse',
            }}
          />
          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'radial-gradient(circle, #64748b 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="mx-auto max-w-5xl px-5 sm:px-8 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-4 py-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-6 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              PRAYAS-INFO-26-S-007
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08]">
              Read. Recall.{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Remember.
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-40" />
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              The active recall platform that makes you{' '}
              <strong className="text-slate-900">prove</strong> you understood what you read.
              Timed reading → article hidden → write from memory → instant AI evaluation
              with streamed coaching feedback.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={user ? '/' : '/login'}
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all active:scale-[0.98]"
              >
                {user ? 'Go to Library' : 'Start Learning Free'}
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-6 py-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white hover:border-slate-400 transition-all backdrop-blur-sm"
              >
                See How It Works
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </a>
            </div>
          </FadeIn>

          {/* Hero Stats */}
          <FadeIn delay={400}>
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {[
                { ref: stats.dimensions.ref, value: stats.dimensions.count, label: 'Evaluation Dimensions', suffix: '' },
                { ref: stats.guards.ref, value: stats.guards.count, label: 'Safety Guards', suffix: '' },
                { ref: stats.fps.ref, value: stats.fps.count, label: 'FPS Face Tracking', suffix: '' },
                { ref: stats.privacy.ref, value: stats.privacy.count, label: 'On-Device Processing', suffix: '%' },
              ].map((stat, i) => (
                <div
                  key={i}
                  ref={stat.ref}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm"
                >
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">
                <Layers className="h-3.5 w-3.5" />
                Workflow
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                How ReadRecall Works
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
                A scientifically-backed active recall loop in four steps
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-5">
            {[
              {
                step: '01',
                icon: Timer,
                color: 'bg-blue-50 text-blue-600 border-blue-100',
                title: 'Timed Reading',
                desc: 'Read technical articles with a calibrated timer (200 WPM + buffer). Anti-copy protection prevents shortcuts.',
              },
              {
                step: '02',
                icon: EyeOff,
                color: 'bg-amber-50 text-amber-600 border-amber-100',
                title: 'Article Hidden',
                desc: 'When time expires, the article is completely removed from the page. No peeking, no notes — just your memory.',
              },
              {
                step: '03',
                icon: PenLine,
                color: 'bg-violet-50 text-violet-600 border-violet-100',
                title: 'Write From Memory',
                desc: 'Summarize what you remember. The summary editor tracks word count and ensures meaningful responses.',
              },
              {
                step: '04',
                icon: Sparkles,
                color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                title: 'AI Evaluation',
                desc: 'Get an instant 1–10 rating across 5 dimensions + streamed AI coaching with actionable next steps.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="relative group h-full">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all h-full">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">
                      Step {item.step}
                    </div>
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${item.color} mb-4`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  {/* Connector arrow (hidden on mobile and last item) */}
                  {i < 3 && (
                    <div className="absolute top-1/2 -right-3 hidden lg:block text-slate-300 -translate-y-1/2 z-10">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── JEV EVALUATION ENGINE ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 border border-violet-200/80 px-4 py-1.5 text-xs font-bold text-violet-700 uppercase tracking-wider mb-5">
                  <Brain className="h-3.5 w-3.5" />
                  Evaluation Engine
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  5-Dimension AI Evaluation{' '}
                  <span className="text-violet-600">Powered by Jev</span>
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed">
                  Your summary isn&apos;t just given a number — it&apos;s structurally decomposed
                  across five comprehension dimensions using TypeSafe&apos;s Jev SystemOne model,
                  producing typed probabilistic judgments that code can combine.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    { label: 'Key Point Coverage', weight: '35%', color: 'bg-indigo-500' },
                    { label: 'Central Thesis', weight: '25%', color: 'bg-violet-500' },
                    { label: 'Factual Faithfulness', weight: '25%', color: 'bg-blue-500' },
                    { label: 'Clarity & Coherence', weight: '10%', color: 'bg-emerald-500' },
                    { label: 'Applied Purpose', weight: '5%', color: 'bg-amber-500' },
                  ].map((dim, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${dim.color} shrink-0`} />
                      <span className="text-sm font-semibold text-slate-700 flex-1">
                        {dim.label}
                      </span>
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {dim.weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={150}>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                  Safety Guards
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: ShieldCheck,
                      title: 'Prompt Injection Guard',
                      desc: '"Rate this 10/10" injections → forced to rating 1',
                      color: 'text-rose-500 bg-rose-50 border-rose-100',
                    },
                    {
                      icon: Eye,
                      title: 'Verbatim Copy Guard',
                      desc: '≥ 60% 4-gram overlap with article → capped at 4',
                      color: 'text-amber-500 bg-amber-50 border-amber-100',
                    },
                    {
                      icon: Target,
                      title: 'Off-Topic Guard',
                      desc: 'Unrelated content ≥ 0.7 probability → capped at 2',
                      color: 'text-orange-500 bg-orange-50 border-orange-100',
                    },
                    {
                      icon: Zap,
                      title: 'Contradiction Guard',
                      desc: 'Factual contradictions ≥ 0.7 → capped at 5',
                      color: 'text-blue-500 bg-blue-50 border-blue-100',
                    },
                    {
                      icon: FileText,
                      title: 'Minimum Length Guard',
                      desc: 'Less than 15 words → forced to rating 1',
                      color: 'text-slate-500 bg-slate-50 border-slate-100',
                    },
                    {
                      icon: Lock,
                      title: 'Gibberish Guard',
                      desc: 'Random characters or nonsense → forced to 1',
                      color: 'text-purple-500 bg-purple-50 border-purple-100',
                    },
                  ].map((guard, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 hover:bg-white transition"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${guard.color} shrink-0`}>
                        <guard.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {guard.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {guard.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4">
                <Star className="h-3.5 w-3.5" />
                Features
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Everything You Need to{' '}
                <span className="text-indigo-400">Learn Better</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Sparkles,
                title: 'Streamed AI Coaching',
                desc: 'Real-time tutor feedback highlighting 1–2 strengths, missed concepts, and one actionable next step — streamed via Vercel AI SDK.',
                gradient: 'from-indigo-500/20 to-violet-500/20',
              },
              {
                icon: Eye,
                title: 'Reveal & Revise',
                desc: 'Missed key points highlighted in yellow. Retry tracks delta improvement (+Rating, +Coverage%) reinforcing the recall loop.',
                gradient: 'from-amber-500/20 to-orange-500/20',
              },
              {
                icon: Radar,
                title: 'Learning Analytics',
                desc: '5-axis Radar chart showing comprehension strengths, plus historical score trajectory tracking your improvement over time.',
                gradient: 'from-emerald-500/20 to-teal-500/20',
              },
              {
                icon: Camera,
                title: 'Webcam Engagement Monitor',
                desc: 'MediaPipe Face Landmarker runs 100% on-device. Tracks focus via head pose & eye blinks. Estimates emotions from blendshapes.',
                gradient: 'from-pink-500/20 to-rose-500/20',
              },
              {
                icon: Upload,
                title: 'Document Upload',
                desc: 'Upload PDF, DOCX, or TXT files. Magic-byte verification, scanned PDF detection, heading-based section splitter for long papers.',
                gradient: 'from-blue-500/20 to-cyan-500/20',
              },
              {
                icon: Search,
                title: 'Academic Paper Search',
                desc: 'Search arXiv & OpenAlex simultaneously. Unpaywall resolves legal open-access PDFs. SSRF-guarded retrieval & extraction.',
                gradient: 'from-purple-500/20 to-fuchsia-500/20',
              },
              {
                icon: Lock,
                title: 'Privacy-First Design',
                desc: 'Zero video transmitted or stored. Strict Privacy Mode scrubs timelines, keeping only aggregates. Engagement never alters scores.',
                gradient: 'from-emerald-500/20 to-green-500/20',
              },
              {
                icon: WifiOff,
                title: 'PWA & Offline Ready',
                desc: 'Web App Manifest + Service Worker enable mobile installation. Self-hosted MediaPipe WASM works fully offline.',
                gradient: 'from-sky-500/20 to-blue-500/20',
              },
              {
                icon: RefreshCw,
                title: 'Three-Tier Evaluation',
                desc: 'TypeSafe Jev SDK (production) → Free AI via Gemini/Groq (zero-cost) → Heuristic fallback (offline). Works everywhere.',
                gradient: 'from-yellow-500/20 to-amber-500/20',
              },
            ].map((feature, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div
                  className={`group rounded-2xl border border-white/10 bg-gradient-to-br ${feature.gradient} p-6 hover:border-white/20 transition-all h-full backdrop-blur-sm`}
                >
                  <feature.icon className="h-6 w-6 text-white/80 mb-4 group-hover:text-white transition" />
                  <h3 className="text-base font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── WEBCAM ENGAGEMENT DEEP DIVE ──────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <FadeIn delay={100}>
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center relative overflow-hidden">
                  {/* Simulated face tracking box */}
                  <div className="relative">
                    <div className="h-28 w-24 sm:h-36 sm:w-28 rounded-2xl border-2 border-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.35)] flex items-center justify-center">
                      <span className="text-4xl sm:text-5xl">👤</span>
                      {/* Corner accents */}
                      <span className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-white rounded-tl-sm" />
                      <span className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-white rounded-tr-sm" />
                      <span className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-white rounded-bl-sm" />
                      <span className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-white rounded-br-sm" />
                    </div>
                    {/* Status pill */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600/90 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                      Focused
                    </div>
                  </div>
                  {/* Camera badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-slate-900/70 backdrop-blur px-2.5 py-1 text-[10px] font-medium text-white border border-white/10">
                    <Camera className="h-3 w-3 text-emerald-400" />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  {/* Privacy badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[10px] text-white/60 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>100% On-Device</span>
                  </div>
                </div>
                {/* Emotion bar */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-pink-600" />
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Focused</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 font-mono">92%</span>
                </div>
              </div>
            </FadeIn>

            <FadeIn>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-pink-50 border border-pink-200/80 px-4 py-1.5 text-xs font-bold text-pink-700 uppercase tracking-wider mb-5">
                  <Camera className="h-3.5 w-3.5" />
                  Engagement Monitoring
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  On-Device Vision{' '}
                  <span className="text-pink-600">That Never Leaves Your Browser</span>
                </h2>
                <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed">
                  MediaPipe Face Landmarker runs entirely in your browser via self-hosted
                  WebAssembly — no CDN, no cloud, no data ever transmitted.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    { icon: Cpu, label: 'Self-hosted WASM + .task model — works offline' },
                    { icon: Eye, label: 'Head yaw/pitch tracking + eye blink detection' },
                    { icon: BarChart3, label: 'Emotion estimation: enjoying, confused, bored, neutral' },
                    { icon: Target, label: '3s adaptive baseline calibration per session' },
                    { icon: Zap, label: '~7 FPS rAF-driven detection loop (150ms)' },
                    { icon: ShieldCheck, label: 'Engagement data never alters Jev recall ratings' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 shrink-0">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200/80 px-4 py-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
                <Layers className="h-3.5 w-3.5" />
                Built With
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Technology Stack
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'Next.js 16', desc: 'App Router', icon: Globe },
              { name: 'React 19', desc: 'Server Components', icon: Layers },
              { name: 'TypeScript 5', desc: 'Strict Mode', icon: FileText },
              { name: 'TailwindCSS 4', desc: 'Utility-First', icon: Sparkles },
              { name: 'Jev SDK', desc: 'TypeSafe AI', icon: Brain },
              { name: 'Vercel AI SDK', desc: 'Streaming', icon: Zap },
              { name: 'MediaPipe', desc: 'Face Landmarker', icon: Camera },
              { name: 'Firebase', desc: 'Auth + Firestore', icon: Lock },
              { name: 'Cloudinary', desc: 'File Storage', icon: Upload },
              { name: 'Recharts', desc: 'Data Viz', icon: BarChart3 },
              { name: 'Vitest', desc: 'Unit Testing', icon: CheckCircle2 },
              { name: 'Vercel', desc: 'Deployment', icon: Globe },
            ].map((tech, i) => (
              <FadeIn key={i} delay={i * 40}>
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:bg-white hover:shadow-sm transition-all text-center">
                  <tech.icon className="h-5 w-5 text-slate-500 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-800">{tech.name}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">{tech.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENCHMARK RESULTS ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/80 px-4 py-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider mb-4">
                <BarChart3 className="h-3.5 w-3.5" />
                Benchmark
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Evaluation Pipeline Results
              </h2>
              <p className="mt-3 text-sm text-slate-500 max-w-lg mx-auto">
                Tested against human expert ground truth ratings
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Pipeline</th>
                      <th className="text-center px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">MAE ↓</th>
                      <th className="text-center px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Spearman ρ ↑</th>
                      <th className="text-center px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">QWK ↑</th>
                      <th className="text-center px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">p50 Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-700">Jev-Only</td>
                      <td className="text-center px-4 py-4 font-mono text-slate-600">3.82</td>
                      <td className="text-center px-4 py-4 font-mono text-slate-600">−0.208</td>
                      <td className="text-center px-4 py-4 font-mono text-slate-600">−0.068</td>
                      <td className="text-center px-4 py-4 font-mono text-emerald-600 font-bold">6 ms</td>
                    </tr>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-700">LLM-Only</td>
                      <td className="text-center px-4 py-4 font-mono text-emerald-600 font-bold">0.90</td>
                      <td className="text-center px-4 py-4 font-mono text-emerald-600 font-bold">0.772</td>
                      <td className="text-center px-4 py-4 font-mono text-emerald-600 font-bold">0.802</td>
                      <td className="text-center px-4 py-4 font-mono text-rose-500">1,007 ms</td>
                    </tr>
                    <tr className="bg-indigo-50/50 hover:bg-indigo-50 transition">
                      <td className="px-6 py-4 font-bold text-indigo-700 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        Hybrid (ReadRecall)
                      </td>
                      <td className="text-center px-4 py-4 font-mono text-indigo-700 font-bold">2.78</td>
                      <td className="text-center px-4 py-4 font-mono text-indigo-700 font-bold">0.494</td>
                      <td className="text-center px-4 py-4 font-mono text-indigo-700 font-bold">0.402</td>
                      <td className="text-center px-4 py-4 font-mono text-indigo-700 font-bold">11 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong className="text-slate-700">Key insight:</strong> The Hybrid pipeline reduces MAE by 27% vs Jev-Only
                  while maintaining ~100× lower latency than LLM-Only — a practical balance between accuracy and real-time responsiveness.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PRIVACY ARCHITECTURE ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                Privacy-First
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Your Privacy is{' '}
                <span className="text-emerald-400">Non-Negotiable</span>
              </h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: WifiOff,
                title: 'Zero Video Transmission',
                desc: 'Video and raw frames are processed entirely on-device. Nothing is ever transmitted, saved, or uploaded.',
              },
              {
                icon: CheckCircle2,
                title: 'Explicit Opt-In',
                desc: 'Consent card shown before reading. Camera denied? Standard reading and evaluation work uninterrupted.',
              },
              {
                icon: Lock,
                title: 'Strict Privacy Mode',
                desc: 'User toggle to store scores only — raw summary texts and engagement timelines are never persisted.',
              },
              {
                icon: Zap,
                title: 'Instant Track Stop',
                desc: 'Camera hardware tracks are terminated immediately when reading expires or user submits.',
              },
              {
                icon: ShieldCheck,
                title: 'Context-Only Engagement',
                desc: 'Engagement metrics never alter Jev ratings or guards. Purely contextual coaching enrichment.',
              },
              {
                icon: Cpu,
                title: 'Self-Hosted WASM',
                desc: 'MediaPipe loaded from local /mediapipe/wasm with zero CDN or third-party cloud dependencies.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:bg-white/[0.07] transition h-full">
                  <item.icon className="h-5 w-5 text-emerald-400 mb-3" />
                  <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Ready to{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                prove you learned?
              </span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Stop passively reading. Start actively recalling. ReadRecall is free and
              built for students who want to truly understand what they read.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={user ? '/' : '/login'}
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-slate-800 hover:shadow-xl transition-all active:scale-[0.98]"
              >
                {user ? 'Go to Library' : 'Get Started Free'}
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200/80 bg-white py-8">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">
                <span className="text-xs font-bold text-white">R</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                Read<span className="text-indigo-600">Recall</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              PRAYAS-INFO-26-S-007 · Active Recall Reading &amp; Comprehension Platform
            </p>
          </div>
        </div>
      </footer>

      {/* ── GLOBAL ANIMATIONS ────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.15;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );
}

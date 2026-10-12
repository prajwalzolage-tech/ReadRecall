// src/components/webcam-engagement-monitor.tsx
// Displays a real-time webcam feed with face detection bounding box,
// live engagement progress bar, and session controls.
// Fully on-device: zero video or frames ever uploaded or saved.
// The monitor window is ALWAYS visible during reading — user can toggle camera on/off.

'use client';

import React, { useState } from 'react';
import {
  Brain,
  Camera,
  CameraOff,
  Minimize2,
  Maximize2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Video,
  VideoOff,
} from 'lucide-react';
import type { EngagementStatus, FaceBox } from '@/hooks/useEngagement';
import type { EmotionType } from '@/lib/engagement';

interface WebcamEngagementMonitorProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: EngagementStatus;
  current: {
    focused: boolean;
    emotion: EmotionType;
    faceBox?: FaceBox | null;
    focusScore?: number;
  };
  articleTitle?: string;
  category?: string;
  timeLeft: number;
  totalDuration: number;
  cameraOn: boolean;
  onToggleCamera: () => void;
  onFinishEarly?: () => void;
}

export function WebcamEngagementMonitor({
  videoRef,
  status,
  current,
  articleTitle = 'Reading Comprehension',
  category = 'ACTIVE RECALL SESSION',
  timeLeft,
  totalDuration,
  cameraOn,
  onToggleCamera,
  onFinishEarly,
}: WebcamEngagementMonitorProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Format timer MM:SS
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  const elapsed = totalDuration - timeLeft;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((elapsed / (totalDuration || 1)) * 100))
  );

  const focusScore = typeof current.focusScore === 'number' ? current.focusScore : (current.focused ? 92 : 25);

  const emotionLabels: Record<EmotionType, { label: string; icon: string }> = {
    enjoying: { label: 'Engaged & Smiling', icon: '😄' },
    confused: { label: 'Concentrating / Thinking', icon: '🤔' },
    bored: { label: 'Fatigued / Inactive', icon: '🥱' },
    neutral: { label: 'Calm & Attentive', icon: '😐' },
  };

  const currentEmotion = emotionLabels[current.emotion] || emotionLabels.neutral;

  // ── MINIMIZED VIEW ──────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-md backdrop-blur-md transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-600 border border-pink-100 shrink-0">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    !cameraOn
                      ? 'bg-slate-400'
                      : status === 'active'
                        ? current.focused
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-amber-500 animate-pulse'
                        : 'bg-slate-400'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {!cameraOn
                    ? 'Paused'
                    : status === 'active'
                      ? current.focused
                        ? 'Focused'
                        : 'Distracted'
                      : status}
                </span>
                {cameraOn && (
                  <span className="text-xs text-slate-400">• {focusScore}%</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {timeFormatted} remaining
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleCamera}
              className={`rounded-lg p-1.5 transition ${
                cameraOn
                  ? 'text-slate-400 hover:bg-slate-100 hover:text-rose-600'
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
              title={cameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {cameraOn ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Expand Camera View"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FULL EXPANDED VIEW ──────────────────────────────────────────────
  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm transition-all space-y-4">
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate">
            {articleTitle}
          </h2>
          <p className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase mt-0.5">
            {category}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="Minimize to Compact Bar"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Video Feed / Camera Paused Placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-200/80 shadow-inner group">
        {cameraOn ? (
          <>
            {/* Mirrored live video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover transform -scale-x-100"
            />

            {/* Real-time Face Tracking Box (Mirrored with video container) */}
            {status === 'active' && current.faceBox && (
              <div className="absolute inset-0 pointer-events-none transform -scale-x-100">
                <div
                  className={`absolute rounded-2xl border-2 transition-all duration-100 ease-out ${
                    current.focused
                      ? 'border-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.45)]'
                      : 'border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.45)]'
                  }`}
                  style={{
                    left: `${current.faceBox.x * 100}%`,
                    top: `${current.faceBox.y * 100}%`,
                    width: `${current.faceBox.width * 100}%`,
                    height: `${current.faceBox.height * 100}%`,
                  }}
                >
                  {/* Corner AI Reticle Accents */}
                  <span className="absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-white rounded-tl-sm" />
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-white rounded-tr-sm" />
                  <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-white rounded-bl-sm" />
                  <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-white rounded-br-sm" />

                  {/* Status pill on face box */}
                  <div
                    className={`absolute -top-6 left-1/2 -translate-x-1/2 transform rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase text-white shadow-xs backdrop-blur-md ${
                      current.focused ? 'bg-emerald-600/90' : 'bg-amber-600/90'
                    }`}
                  >
                    {current.focused ? 'Focused' : 'Distracted'}
                  </div>
                </div>
              </div>
            )}

            {/* Camera Badge in Top-Right Corner */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-slate-900/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white border border-white/15 shadow-sm">
              <Camera className="h-3 w-3 text-emerald-400" />
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>

            {/* Loading Overlay */}
            {status === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xs text-white p-4 text-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent mb-2" />
                <p className="text-xs font-medium">Starting MediaPipe Camera…</p>
                <p className="text-[10px] text-slate-400 mt-1">Calibrating on-device vision</p>
              </div>
            )}

            {/* No Face Warning Overlay */}
            {status === 'no-face' && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-xl bg-amber-950/80 border border-amber-500/40 p-2.5 backdrop-blur-md text-amber-200 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="text-[11px] leading-tight">
                  Face not detected. Center your face in camera view.
                </span>
              </div>
            )}

            {/* Camera Denied Overlay */}
            {status === 'denied' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-4 text-center">
                <CameraOff className="h-6 w-6 text-rose-400 mb-2" />
                <p className="text-xs font-semibold">Camera Access Blocked</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enable camera permissions in browser settings to track focus.
                </p>
              </div>
            )}
          </>
        ) : (
          /* ── CAMERA OFF PLACEHOLDER ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-700/60 border border-slate-600/40 mb-4">
              <CameraOff className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300">Camera Paused</p>
            <p className="text-[11px] text-slate-500 mt-1.5 max-w-[200px] leading-relaxed">
              Focus tracking is paused. Turn on the camera to resume monitoring.
            </p>
            <button
              onClick={onToggleCamera}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition active:scale-[0.98]"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Turn On Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Camera On/Off Toggle Button */}
      <button
        onClick={onToggleCamera}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 px-4 text-xs font-bold transition active:scale-[0.99] ${
          cameraOn
            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
        }`}
      >
        {cameraOn ? (
          <>
            <VideoOff className="h-3.5 w-3.5" />
            <span>Turn Off Camera</span>
          </>
        ) : (
          <>
            <Video className="h-3.5 w-3.5" />
            <span>Turn On Camera</span>
          </>
        )}
      </button>

      {/* Engagement Status Bar (only meaningful when camera is on) */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-100/80 text-pink-600 shrink-0">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <span
              className={`text-xs font-black uppercase tracking-wider ${
                !cameraOn
                  ? 'text-slate-400'
                  : current.focused
                    ? 'text-emerald-700'
                    : 'text-amber-700'
              }`}
            >
              {!cameraOn
                ? 'PAUSED'
                : status === 'active'
                  ? current.focused
                    ? 'FOCUSED'
                    : 'DISTRACTED'
                  : status === 'loading'
                    ? 'CONNECTING'
                    : status === 'no-face'
                      ? 'SEARCHING'
                      : 'STANDBY'}
            </span>
          </div>

          <span className="font-mono text-xs font-bold text-slate-700">
            {cameraOn ? `${focusScore}%` : '—'}
          </span>
        </div>

        {/* Focus Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-200/90 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              !cameraOn
                ? 'bg-slate-300'
                : current.focused
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-400 to-orange-400'
            }`}
            style={{ width: cameraOn ? `${Math.max(5, focusScore)}%` : '0%' }}
          />
        </div>

        {/* Live emotion estimate & privacy badge */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span className="flex items-center gap-1 font-medium">
            {cameraOn ? (
              <>
                <span>{currentEmotion.icon}</span>
                <span className="truncate max-w-[130px]">{currentEmotion.label}</span>
              </>
            ) : (
              <span className="text-slate-400">Camera off</span>
            )}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>On-Device</span>
          </span>
        </div>
      </div>

      {/* Timer & Session Control Widget */}
      <div className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-indigo-600" />
            <span>Reading Timer</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-900">
            {timeFormatted}
          </span>
        </div>

        {/* Timer Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {onFinishEarly && (
          <button
            onClick={onFinishEarly}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-[0.99]"
          >
            <span>Finish Reading & Summarize</span>
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
          </button>
        )}
      </div>

      {/* Active Recall Reminder */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5 text-[11px] text-indigo-900 flex items-start gap-2 leading-relaxed">
        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">Memory Challenge:</span> Text will disappear when time expires. Read deeply without taking notes.
        </div>
      </div>
    </div>
  );
}

// src/hooks/useEngagement.ts
// React hook for client-side webcam engagement monitoring using MediaPipe Face Landmarker.
// Zero external API calls, zero server telemetry, fully privacy-preserving on-device processing.

'use client';

// Suppress benign TensorFlow Lite / XNNPACK / MediaPipe C++ info messages routed to console.error
if (typeof window !== 'undefined' && !(window as any).__tflite_log_filter_installed) {
  (window as any).__tflite_log_filter_installed = true;
  const originalError = console.error;
  console.error = function (...args: any[]) {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('XNNPACK') ||
      msg.startsWith('INFO:') ||
      msg.includes('Created TensorFlow Lite') ||
      msg.includes('TensorFlow Lite delegate')
    ) {
      // Re-route informational C++ runtime logs to console.info to prevent Next.js dev error overlay
      console.info(...args);
      return;
    }
    originalError.apply(console, args);
  };
}

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  classifyFrame,
  computeBaseline,
  computeEngagementSummary,
  extractBlendshapes,
  extractHeadPoseFromMatrix,
  extractHeadPoseFromLandmarks,
  EngagementSmoother,
  DEFAULT_ENGAGEMENT_THRESHOLDS,
  type EmotionType,
  type EngagementBaseline,
  type EngagementFrameInput,
  type EngagementSummary,
  type ClassifiedFrame,
} from '@/lib/engagement';

export type EngagementStatus =
  | 'idle'
  | 'loading'
  | 'active'
  | 'denied'
  | 'no-face'
  | 'unsupported';

export interface FaceBox {
  x: number;      // normalized 0..1 (left in raw camera frame)
  y: number;      // normalized 0..1 (top in raw camera frame)
  width: number;  // normalized 0..1
  height: number; // normalized 0..1
}

export interface UseEngagementReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: EngagementStatus;
  current: {
    focused: boolean;
    emotion: EmotionType;
    faceBox?: FaceBox | null;
    focusScore?: number;
  };
  getSummary: () => EngagementSummary;
}

export function useEngagement(active: boolean): UseEngagementReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastDetectTimeRef = useRef<number>(0);

  const [internalStatus, setInternalStatus] = useState<EngagementStatus>('idle');
  const status: EngagementStatus = active ? internalStatus : 'idle';
  const [current, setCurrent] = useState<{
    focused: boolean;
    emotion: EmotionType;
    faceBox?: FaceBox | null;
    focusScore?: number;
  }>({
    focused: true,
    emotion: 'neutral',
    faceBox: null,
    focusScore: 90,
  });

  const startTimeRef = useRef<number>(0);
  const baselineSamplesRef = useRef<EngagementFrameInput[]>([]);
  const baselineRef = useRef<EngagementBaseline | null>(null);
  const smootherRef = useRef<EngagementSmoother>(new EngagementSmoother());
  const smoothedFramesRef = useRef<ClassifiedFrame[]>([]);
  const consecutiveNoFaceRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (landmarkerRef.current) {
      try {
        landmarkerRef.current.close();
      } catch {
        // ignore
      }
      landmarkerRef.current = null;
    }
  }, []);

  const getSummary = useCallback((): EngagementSummary => {
    const elapsedSec = startTimeRef.current > 0
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      : 0;

    return computeEngagementSummary(smoothedFramesRef.current, elapsedSec);
  }, []);

  useEffect(() => {
    if (!active) {
      stopCamera();
      return;
    }

    let isCancelled = false;

    const startMonitoring = async () => {
      // 1. Verify getUserMedia support
      if (
        typeof window === 'undefined' ||
        !navigator?.mediaDevices?.getUserMedia
      ) {
        setInternalStatus('unsupported');
        return;
      }

      setInternalStatus('loading');

      try {
        // 2. Request user webcam (front camera)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Attach to hidden video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => {});
        }

        // 3. Dynamically import and initialize MediaPipe FilesetResolver & FaceLandmarker
        // Offline-ready: points to local public/mediapipe/wasm and public/models/face_landmarker.task
        const { FilesetResolver, FaceLandmarker } = await import(
          '@mediapipe/tasks-vision'
        );

        const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm');

        let landmarker: any;
        try {
          landmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: '/models/face_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
          });
        } catch (gpuErr) {
          console.warn('[useEngagement] GPU delegate failed, falling back to CPU:', gpuErr);
          landmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: '/models/face_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
          });
        }

        if (isCancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        startTimeRef.current = Date.now();
        baselineSamplesRef.current = [];
        baselineRef.current = null;
        smoothedFramesRef.current = [];
        smootherRef.current.reset();
        consecutiveNoFaceRef.current = 0;
        lastTimestampRef.current = 0;

        setInternalStatus('active');

        // 4. Detection loop via requestAnimationFrame with time-based throttling.
        //    Unlike setInterval, rAF never stacks: the next detection only runs
        //    AFTER the previous one finishes AND enough time has elapsed.
        const minIntervalMs = DEFAULT_ENGAGEMENT_THRESHOLDS.fpsIntervalMs;
        lastDetectTimeRef.current = 0;

        const detectFrame = () => {
          const video = videoRef.current;
          if (!video || !landmarkerRef.current || isCancelled) return;

          // Throttle: skip this frame if not enough time has passed
          const now = performance.now();
          if (now - lastDetectTimeRef.current < minIntervalMs) {
            rafIdRef.current = requestAnimationFrame(detectFrame);
            return;
          }

          if (
            video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
            video.paused ||
            video.videoWidth === 0 ||
            video.videoHeight === 0
          ) {
            rafIdRef.current = requestAnimationFrame(detectFrame);
            return;
          }

          lastDetectTimeRef.current = now;

          const nowMs = Date.now();
          const sessionElapsedMs = nowMs - startTimeRef.current;

          // MediaPipe requires strictly monotonically increasing integer timestamps
          let timestamp = Math.round(now);
          if (timestamp <= lastTimestampRef.current) {
            timestamp = lastTimestampRef.current + 1;
          }
          lastTimestampRef.current = timestamp;

          let results: any;
          try {
            results = landmarkerRef.current.detectForVideo(video, timestamp);
          } catch (detErr) {
            const errStr = String(detErr);
            // Suppress non-critical detection errors (e.g. XNNPACK delegate info logs)
            if (!errStr.includes('INFO:') && !errStr.includes('XNNPACK')) {
              console.warn('[useEngagement] Detection error:', detErr);
            }
            rafIdRef.current = requestAnimationFrame(detectFrame);
            return;
          }

          const hasFace = Boolean(
            results &&
            Array.isArray(results.faceLandmarks) &&
            results.faceLandmarks.length > 0
          );

          if (!hasFace) {
            consecutiveNoFaceRef.current++;
            if (consecutiveNoFaceRef.current >= 2) {
              setInternalStatus('no-face');
            }
          } else {
            consecutiveNoFaceRef.current = 0;
            setInternalStatus('active');
          }

          // Extract blendshapes
          const rawCategories = results?.faceBlendshapes?.[0]?.categories;
          const blendshapes = extractBlendshapes(rawCategories);

          // Extract head pose
          let headPose = extractHeadPoseFromMatrix(
            results?.facialTransformationMatrixes?.[0]
          );

          // Fallback to landmark-based pose estimation if matrix is missing
          if (hasFace && headPose.yaw === 0 && headPose.pitch === 0) {
            headPose = extractHeadPoseFromLandmarks(results.faceLandmarks[0]);
          }

          const frameInput: EngagementFrameInput = {
            hasFace,
            documentHidden: typeof document !== 'undefined' ? document.hidden : false,
            blendshapes,
            headPose,
            timestampMs: sessionElapsedMs,
          };

          // Baseline accumulation
          if (sessionElapsedMs < DEFAULT_ENGAGEMENT_THRESHOLDS.baselineDurationMs) {
            if (hasFace && !frameInput.documentHidden) {
              baselineSamplesRef.current.push(frameInput);
            }
          } else if (!baselineRef.current && baselineSamplesRef.current.length > 0) {
            baselineRef.current = computeBaseline(baselineSamplesRef.current);
          }

          // Per-frame classification against baseline
          const classified = classifyFrame(frameInput, baselineRef.current);

          // Smooth with sliding window & state hold
          const smoothed = smootherRef.current.addFrame(classified);

          // Extract bounding box from face landmarks for live camera UI
          let faceBox: FaceBox | null = null;
          if (hasFace && results.faceLandmarks?.[0]) {
            const landmarks = results.faceLandmarks[0];
            let minX = 1;
            let minY = 1;
            let maxX = 0;
            let maxY = 0;
            for (let i = 0; i < landmarks.length; i++) {
              const pt = landmarks[i];
              if (pt.x < minX) minX = pt.x;
              if (pt.x > maxX) maxX = pt.x;
              if (pt.y < minY) minY = pt.y;
              if (pt.y > maxY) maxY = pt.y;
            }
            // Add a 10% margin around face
            const padX = (maxX - minX) * 0.1;
            const padY = (maxY - minY) * 0.12;
            const bx = Math.max(0, minX - padX);
            const by = Math.max(0, minY - padY);
            const bw = Math.min(1 - bx, (maxX - minX) + padX * 2);
            const bh = Math.min(1 - by, (maxY - minY) + padY * 2);
            faceBox = { x: bx, y: by, width: bw, height: bh };
          }

          let focusScore = 0;
          if (hasFace) {
            if (smoothed.focused) {
              const headPenalty = (Math.abs(headPose.yaw) + Math.abs(headPose.pitch)) * 1.2;
              focusScore = Math.round(Math.min(100, Math.max(70, 98 - headPenalty)));
            } else {
              focusScore = Math.round(Math.max(20, 45 - Math.abs(headPose.yaw)));
            }
          }

          const smoothedFrame: ClassifiedFrame = {
            timestampMs: sessionElapsedMs,
            focused: smoothed.focused,
            emotion: smoothed.emotion,
            yaw: headPose.yaw,
            pitch: headPose.pitch,
          };

          smoothedFramesRef.current.push(smoothedFrame);
          setCurrent({
            focused: smoothed.focused,
            emotion: smoothed.emotion,
            faceBox,
            focusScore,
          });

          // Schedule next frame
          rafIdRef.current = requestAnimationFrame(detectFrame);
        };

        // Kick off the rAF detection loop
        rafIdRef.current = requestAnimationFrame(detectFrame);
      } catch (err: any) {
        if (isCancelled) return;
        const errName = err?.name || '';
        if (
          errName === 'NotAllowedError' ||
          errName === 'PermissionDeniedError' ||
          errName === 'SecurityError'
        ) {
          setInternalStatus('denied');
        } else {
          console.warn('[useEngagement] Initialization failed:', err);
          setInternalStatus('unsupported');
        }
      }
    };

    startMonitoring();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [active, stopCamera]);

  return {
    videoRef,
    status,
    current,
    getSummary,
  };
}

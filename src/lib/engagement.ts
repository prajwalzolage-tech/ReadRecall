// src/lib/engagement.ts
// Pure classification, smoothing, baseline calibration, and summary generation
// for MediaPipe Face Landmarker webcam engagement monitoring.
// Fully client-side; zero external APIs, zero server tracking.

export type EmotionType = 'enjoying' | 'confused' | 'bored' | 'neutral';

export interface EngagementThresholds {
  maxHeadYawDegrees: number;
  maxHeadPitchDegrees: number;
  eyeBlinkThreshold: number;
  enjoyingSmileThreshold: number;
  confusedBrowThreshold: number;
  boredJawThreshold: number;
  fpsIntervalMs: number;
  baselineDurationMs: number;
  smoothingWindowSec: number;
  stateHoldSec: number;
}

export const DEFAULT_ENGAGEMENT_THRESHOLDS: Readonly<EngagementThresholds> = Object.freeze({
  maxHeadYawDegrees: 25,
  maxHeadPitchDegrees: 25,
  eyeBlinkThreshold: 0.6,
  enjoyingSmileThreshold: 0.4,
  confusedBrowThreshold: 0.8,
  boredJawThreshold: 0.5,
  fpsIntervalMs: 150, // ~6-7 fps — faster response than 200ms
  baselineDurationMs: 3000, // 3 seconds — faster calibration startup
  smoothingWindowSec: 1.5, // 1.5-second sliding window — snappier transitions
  stateHoldSec: 0.8, // 0.8-second state hold — much faster UI feedback
});

export interface BlendshapeScores {
  eyeBlinkLeft?: number;
  eyeBlinkRight?: number;
  mouthSmileLeft?: number;
  mouthSmileRight?: number;
  browDownLeft?: number;
  browDownRight?: number;
  browInnerUp?: number;
  jawOpen?: number;
  [key: string]: number | undefined;
}

export interface HeadPose {
  yaw: number; // degrees (turning left/right)
  pitch: number; // degrees (nodding up/down)
  roll?: number; // degrees (tilting ear-to-shoulder)
}

export interface EngagementFrameInput {
  hasFace: boolean;
  documentHidden?: boolean;
  blendshapes?: BlendshapeScores;
  headPose?: HeadPose;
  timestampMs: number;
}

export interface EngagementBaseline {
  avgEyeBlink: number;
  avgSmile: number;
  avgBrowDown: number;
  avgBrowInnerUp: number;
  avgJawOpen: number;
  avgYaw: number;
  avgPitch: number;
  sampleCount: number;
}

export interface ClassifiedFrame {
  timestampMs: number;
  focused: boolean;
  emotion: EmotionType;
  yaw?: number;
  pitch?: number;
}

export interface EngagementTimelinePoint {
  tSec: number;
  focused: boolean;
  emotion: EmotionType;
}

export interface EngagementSummary {
  focusPercent: number;
  distractedSeconds: number;
  emotionPercent: {
    enjoying: number;
    confused: number;
    bored: number;
    neutral: number;
  };
  confusedMoments: number;
  boredMoments: number;
  timeline: EngagementTimelinePoint[];
}

/**
 * Extracts a flattened key-value map of blendshape scores from MediaPipe categories.
 */
export function extractBlendshapes(
  categories: Array<{ categoryName?: string; score?: number }> | undefined
): BlendshapeScores {
  const result: BlendshapeScores = {};
  if (!categories || !Array.isArray(categories)) return result;

  for (const cat of categories) {
    if (cat.categoryName && typeof cat.score === 'number') {
      result[cat.categoryName] = cat.score;
    }
  }
  return result;
}

/**
 * Extracts Euler angles (yaw, pitch, roll in degrees) from a 4x4 facial transformation matrix.
 * Supports MediaPipe column-major 16-element matrix format.
 */
export function extractHeadPoseFromMatrix(
  matrix?: { data?: number[] } | number[] | null
): HeadPose {
  if (!matrix) return { yaw: 0, pitch: 0, roll: 0 };
  const d = Array.isArray(matrix) ? matrix : matrix.data || [];
  if (d.length < 16) return { yaw: 0, pitch: 0, roll: 0 };

  // Column-major 4x4 rotation submatrix:
  // r00=d[0], r10=d[1], r20=d[2]
  // r01=d[4], r11=d[5], r21=d[6]
  // r02=d[8], r12=d[9], r22=d[10]
  const r02 = d[8];
  const r12 = d[9];
  const r22 = d[10];
  const r10 = d[1];
  const r11 = d[5];

  const pitchRad = Math.atan2(-r12, Math.sqrt(r02 * r02 + r22 * r22));
  const yawRad = Math.atan2(r02, r22);
  const rollRad = Math.atan2(r10, r11);

  const radToDeg = 180 / Math.PI;
  const pitchDeg = Math.round(pitchRad * radToDeg * 10) / 10;
  const yawDeg = Math.round(yawRad * radToDeg * 10) / 10;
  const rollDeg = Math.round(rollRad * radToDeg * 10) / 10;

  return {
    yaw: yawDeg === 0 ? 0 : yawDeg,
    pitch: pitchDeg === 0 ? 0 : pitchDeg,
    roll: rollDeg === 0 ? 0 : rollDeg,
  };
}

/**
 * Fallback: estimate yaw and pitch from key normalized facial landmarks (e.g. nose tip, eyes, chin).
 */
export function extractHeadPoseFromLandmarks(
  landmarks?: Array<{ x: number; y: number; z?: number }> | null
): HeadPose {
  if (!landmarks || landmarks.length < 468) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  // Key landmarks in MediaPipe Face Mesh:
  // 1: Nose tip
  // 33: Left eye outer corner
  // 263: Right eye outer corner
  // 10: Forehead top
  // 152: Chin bottom
  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const forehead = landmarks[10];
  const chin = landmarks[152];

  if (!nose || !leftEye || !rightEye || !forehead || !chin) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const eyeSpan = Math.abs(rightEye.x - leftEye.x);
  const faceHeight = Math.abs(chin.y - forehead.y);

  if (eyeSpan === 0 || faceHeight === 0) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const eyeCenter = (leftEye.x + rightEye.x) / 2;
  const noseOffsetX = (nose.x - eyeCenter) / eyeSpan;
  // Neutral nose offsetX is roughly 0. At 0.4 offset, angle is ~35 deg.
  const yaw = Math.round(noseOffsetX * 90 * 10) / 10;

  const verticalCenter = (forehead.y + chin.y) / 2;
  const noseOffsetY = (nose.y - verticalCenter) / faceHeight;
  // Neutral nose offsetY is roughly 0.
  const pitch = Math.round(noseOffsetY * 90 * 10) / 10;

  return { yaw, pitch, roll: 0 };
}

/**
 * Aggregates a sequence of baseline frames collected during the initial 5 seconds.
 */
export function computeBaseline(frames: EngagementFrameInput[]): EngagementBaseline | null {
  const valid = frames.filter((f) => f.hasFace && !f.documentHidden && f.blendshapes);
  if (valid.length === 0) return null;

  let sumEyeBlink = 0;
  let sumSmile = 0;
  let sumBrowDown = 0;
  let sumBrowInnerUp = 0;
  let sumJawOpen = 0;
  let sumYaw = 0;
  let sumPitch = 0;

  for (const f of valid) {
    const bs = f.blendshapes || {};
    const eyeBlink = ((bs.eyeBlinkLeft ?? 0) + (bs.eyeBlinkRight ?? 0)) / 2;
    const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
    const browDown = ((bs.browDownLeft ?? 0) + (bs.browDownRight ?? 0)) / 2;
    const browInnerUp = bs.browInnerUp ?? 0;
    const jawOpen = bs.jawOpen ?? 0;

    sumEyeBlink += eyeBlink;
    sumSmile += smile;
    sumBrowDown += browDown;
    sumBrowInnerUp += browInnerUp;
    sumJawOpen += jawOpen;
    sumYaw += f.headPose?.yaw ?? 0;
    sumPitch += f.headPose?.pitch ?? 0;
  }

  const n = valid.length;
  return {
    avgEyeBlink: sumEyeBlink / n,
    avgSmile: sumSmile / n,
    avgBrowDown: sumBrowDown / n,
    avgBrowInnerUp: sumBrowInnerUp / n,
    avgJawOpen: sumJawOpen / n,
    avgYaw: sumYaw / n,
    avgPitch: sumPitch / n,
    sampleCount: n,
  };
}

/**
 * Classifies a single video frame according to focus and emotion rules.
 * Pure function: compares blendshape scores against baseline and thresholds.
 */
export function classifyFrame(
  input: EngagementFrameInput,
  baseline?: EngagementBaseline | null,
  thresholdsConfig?: Partial<EngagementThresholds>
): ClassifiedFrame {
  const thresholds: EngagementThresholds = {
    ...DEFAULT_ENGAGEMENT_THRESHOLDS,
    ...thresholdsConfig,
  };

  const { timestampMs, hasFace, documentHidden, blendshapes, headPose } = input;

  // 1. Face presence and tab visibility guards
  if (!hasFace || documentHidden) {
    return {
      timestampMs,
      focused: false,
      emotion: 'neutral',
      yaw: headPose?.yaw ?? 0,
      pitch: headPose?.pitch ?? 0,
    };
  }

  const bs = blendshapes || {};
  const rawEyeBlink = ((bs.eyeBlinkLeft ?? 0) + (bs.eyeBlinkRight ?? 0)) / 2;
  const rawSmile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
  const rawBrowDown = ((bs.browDownLeft ?? 0) + (bs.browDownRight ?? 0)) / 2;
  const rawBrowInnerUp = bs.browInnerUp ?? 0;
  const rawJawOpen = bs.jawOpen ?? 0;

  const rawYaw = headPose?.yaw ?? 0;
  const rawPitch = headPose?.pitch ?? 0;

  // 2. Calibrated deltas against neutral baseline (if baseline is established)
  const baseYaw = baseline?.avgYaw ?? 0;
  const basePitch = baseline?.avgPitch ?? 0;
  const baseEyeBlink = baseline?.avgEyeBlink ?? 0;
  const baseSmile = baseline?.avgSmile ?? 0;
  const baseBrowDown = baseline?.avgBrowDown ?? 0;
  const baseBrowInnerUp = baseline?.avgBrowInnerUp ?? 0;
  const baseJawOpen = baseline?.avgJawOpen ?? 0;

  const effectiveYaw = Math.abs(rawYaw - baseYaw);
  const effectivePitch = Math.abs(rawPitch - basePitch);

  // For eye blink, if user naturally squints (baseline > 0.1), evaluate deviation above baseline
  const effectiveEyeBlink = baseline
    ? Math.max(0, rawEyeBlink - baseEyeBlink * 0.5)
    : rawEyeBlink;

  const effectiveSmile = baseline
    ? Math.max(0, rawSmile - baseSmile * 0.5)
    : rawSmile;

  const effectiveBrow = baseline
    ? Math.max(0, rawBrowDown - baseBrowDown * 0.5) +
      Math.max(0, rawBrowInnerUp - baseBrowInnerUp * 0.5)
    : rawBrowDown + rawBrowInnerUp;

  const effectiveJaw = baseline
    ? Math.max(0, rawJawOpen - baseJawOpen * 0.5)
    : rawJawOpen;

  // 3. Focus check:
  // Per-frame focused = false if: no face, document.hidden, yaw or pitch > 25 degrees, or eyes closed (avg eyeBlink > 0.6)
  const isHeadTurned =
    effectiveYaw > thresholds.maxHeadYawDegrees ||
    effectivePitch > thresholds.maxHeadPitchDegrees;

  const isEyesClosed = effectiveEyeBlink > thresholds.eyeBlinkThreshold;

  const focused = !isHeadTurned && !isEyesClosed;

  // 4. Emotion check:
  // "enjoying" if avg mouthSmile > 0.4
  // "confused" if avg browDown + browInnerUp > 0.8
  // "bored" if jawOpen > 0.5 or eyes closed
  // otherwise "neutral"
  let emotion: EmotionType = 'neutral';

  if (effectiveSmile > thresholds.enjoyingSmileThreshold) {
    emotion = 'enjoying';
  } else if (effectiveBrow > thresholds.confusedBrowThreshold) {
    emotion = 'confused';
  } else if (effectiveJaw > thresholds.boredJawThreshold || isEyesClosed) {
    emotion = 'bored';
  } else {
    emotion = 'neutral';
  }

  return {
    timestampMs,
    focused,
    emotion,
    yaw: rawYaw,
    pitch: rawPitch,
  };
}

/**
 * State machine for anti-flicker smoothing:
 * - 3-second sliding window majority vote
 * - Only changes state if the candidate state holds for at least 2 seconds
 */
export class EngagementSmoother {
  private windowMs: number;
  private holdMs: number;
  private history: ClassifiedFrame[] = [];

  private currentFocused = true;
  private currentEmotion: EmotionType = 'neutral';

  private focusCandidate = true;
  private focusCandidateSince = 0;

  private emotionCandidate: EmotionType = 'neutral';
  private emotionCandidateSince = 0;

  private isInitialized = false;

  constructor(thresholdsConfig?: Partial<EngagementThresholds>) {
    const windowSec = thresholdsConfig?.smoothingWindowSec ?? DEFAULT_ENGAGEMENT_THRESHOLDS.smoothingWindowSec;
    const holdSec = thresholdsConfig?.stateHoldSec ?? DEFAULT_ENGAGEMENT_THRESHOLDS.stateHoldSec;
    this.windowMs = windowSec * 1000;
    this.holdMs = holdSec * 1000;
  }

  public reset(initialFocused = true, initialEmotion: EmotionType = 'neutral'): void {
    this.history = [];
    this.currentFocused = initialFocused;
    this.currentEmotion = initialEmotion;
    this.focusCandidate = initialFocused;
    this.focusCandidateSince = 0;
    this.emotionCandidate = initialEmotion;
    this.emotionCandidateSince = 0;
    this.isInitialized = false;
  }

  public addFrame(frame: ClassifiedFrame): { focused: boolean; emotion: EmotionType } {
    this.history.push(frame);

    // Prune history older than 3-second sliding window
    const cutoff = frame.timestampMs - this.windowMs;
    this.history = this.history.filter((f) => f.timestampMs >= cutoff);

    // 1. Majority vote in 3-second sliding window
    let focusedCount = 0;
    let distractedCount = 0;
    const emotionCounts: Record<EmotionType, number> = {
      enjoying: 0,
      confused: 0,
      bored: 0,
      neutral: 0,
    };

    for (const f of this.history) {
      if (f.focused) focusedCount++;
      else distractedCount++;
      emotionCounts[f.emotion] = (emotionCounts[f.emotion] || 0) + 1;
    }

    const majorityFocused = focusedCount >= distractedCount;

    // Highest frequency emotion
    let majorityEmotion: EmotionType = 'neutral';
    let maxEmotionCount = -1;
    const emotionOrder: EmotionType[] = ['enjoying', 'confused', 'bored', 'neutral'];
    for (const em of emotionOrder) {
      const c = emotionCounts[em] || 0;
      if (c > maxEmotionCount) {
        maxEmotionCount = c;
        majorityEmotion = em;
      }
    }

    // First frame initialization
    if (!this.isInitialized) {
      this.currentFocused = majorityFocused;
      this.focusCandidate = majorityFocused;
      this.focusCandidateSince = frame.timestampMs;

      this.currentEmotion = majorityEmotion;
      this.emotionCandidate = majorityEmotion;
      this.emotionCandidateSince = frame.timestampMs;

      this.isInitialized = true;
      return { focused: this.currentFocused, emotion: this.currentEmotion };
    }

    // 2. State hold check for Focus (2 seconds hold required to switch)
    if (majorityFocused === this.currentFocused) {
      this.focusCandidate = majorityFocused;
      this.focusCandidateSince = frame.timestampMs;
    } else {
      if (majorityFocused === this.focusCandidate) {
        if (frame.timestampMs - this.focusCandidateSince >= this.holdMs) {
          this.currentFocused = majorityFocused;
        }
      } else {
        this.focusCandidate = majorityFocused;
        this.focusCandidateSince = frame.timestampMs;
      }
    }

    // 3. State hold check for Emotion (2 seconds hold required to switch)
    if (majorityEmotion === this.currentEmotion) {
      this.emotionCandidate = majorityEmotion;
      this.emotionCandidateSince = frame.timestampMs;
    } else {
      if (majorityEmotion === this.emotionCandidate) {
        if (frame.timestampMs - this.emotionCandidateSince >= this.holdMs) {
          this.currentEmotion = majorityEmotion;
        }
      } else {
        this.emotionCandidate = majorityEmotion;
        this.emotionCandidateSince = frame.timestampMs;
      }
    }

    return { focused: this.currentFocused, emotion: this.currentEmotion };
  }

  public getCurrent(): { focused: boolean; emotion: EmotionType } {
    return { focused: this.currentFocused, emotion: this.currentEmotion };
  }
}

/**
 * Pure function: smooths an entire sequence of classified frames using sliding window and 2s state hold.
 */
export function smoothFrames(
  frames: ClassifiedFrame[],
  thresholdsConfig?: Partial<EngagementThresholds>
): ClassifiedFrame[] {
  if (frames.length === 0) return [];
  const smoother = new EngagementSmoother(thresholdsConfig);
  return frames.map((f) => {
    const smoothed = smoother.addFrame(f);
    return {
      timestampMs: f.timestampMs,
      focused: smoothed.focused,
      emotion: smoothed.emotion,
      yaw: f.yaw,
      pitch: f.pitch,
    };
  });
}

/**
 * Downsamples frames to 1 entry per second and computes summary metrics.
 * Pure function: returns EngagementSummary without storing video or frames.
 */
export function computeEngagementSummary(
  smoothedFrames: ClassifiedFrame[],
  totalDurationSec?: number
): EngagementSummary {
  if (smoothedFrames.length === 0) {
    return {
      focusPercent: 100,
      distractedSeconds: 0,
      emotionPercent: { enjoying: 0, confused: 0, bored: 0, neutral: 100 },
      confusedMoments: 0,
      boredMoments: 0,
      timeline: [],
    };
  }

  const startMs = smoothedFrames[0].timestampMs;
  const maxRelSec = Math.max(
    0,
    Math.floor((smoothedFrames[smoothedFrames.length - 1].timestampMs - startMs) / 1000)
  );
  const targetDurationSec =
    typeof totalDurationSec === 'number' && totalDurationSec > 0
      ? Math.max(1, Math.round(totalDurationSec))
      : maxRelSec + 1;

  // Group frames into 1-second bins: bin = floor((timestampMs - startMs) / 1000)
  const bins: Map<number, ClassifiedFrame[]> = new Map();
  for (const f of smoothedFrames) {
    const s = Math.max(0, Math.floor((f.timestampMs - startMs) / 1000));
    const list = bins.get(s) || [];
    list.push(f);
    bins.set(s, list);
  }

  const timeline: EngagementTimelinePoint[] = [];
  let lastFocused = true;
  let lastEmotion: EmotionType = 'neutral';

  for (let s = 0; s < targetDurationSec; s++) {
    const frameList = bins.get(s);
    if (frameList && frameList.length > 0) {
      // Majority vote within this 1-second bin
      let fCount = 0;
      const emCounts: Record<EmotionType, number> = {
        enjoying: 0,
        confused: 0,
        bored: 0,
        neutral: 0,
      };

      for (const f of frameList) {
        if (f.focused) fCount++;
        emCounts[f.emotion] = (emCounts[f.emotion] || 0) + 1;
      }

      lastFocused = fCount >= frameList.length / 2;

      let topEmotion: EmotionType = 'neutral';
      let topCount = -1;
      for (const em of ['enjoying', 'confused', 'bored', 'neutral'] as EmotionType[]) {
        if (emCounts[em] > topCount) {
          topCount = emCounts[em];
          topEmotion = em;
        }
      }
      lastEmotion = topEmotion;
    }

    timeline.push({
      tSec: s,
      focused: lastFocused,
      emotion: lastEmotion,
    });
  }

  const totalSec = timeline.length;
  if (totalSec === 0) {
    return {
      focusPercent: 100,
      distractedSeconds: 0,
      emotionPercent: { enjoying: 0, confused: 0, bored: 0, neutral: 100 },
      confusedMoments: 0,
      boredMoments: 0,
      timeline: [],
    };
  }

  const focusedCount = timeline.filter((t) => t.focused).length;
  const distractedSeconds = totalSec - focusedCount;
  const focusPercent = Math.round((focusedCount / totalSec) * 100);

  const emotionCounts = {
    enjoying: timeline.filter((t) => t.emotion === 'enjoying').length,
    confused: timeline.filter((t) => t.emotion === 'confused').length,
    bored: timeline.filter((t) => t.emotion === 'bored').length,
    neutral: timeline.filter((t) => t.emotion === 'neutral').length,
  };

  const emotionPercent = {
    enjoying: Math.round((emotionCounts.enjoying / totalSec) * 100),
    confused: Math.round((emotionCounts.confused / totalSec) * 100),
    bored: Math.round((emotionCounts.bored / totalSec) * 100),
    neutral: Math.round((emotionCounts.neutral / totalSec) * 100),
  };

  // Count distinct episodes/moments
  let confusedMoments = 0;
  let boredMoments = 0;
  let prevEmotion: EmotionType = 'neutral';

  for (const point of timeline) {
    if (point.emotion === 'confused' && prevEmotion !== 'confused') {
      confusedMoments++;
    }
    if (point.emotion === 'bored' && prevEmotion !== 'bored') {
      boredMoments++;
    }
    prevEmotion = point.emotion;
  }

  return {
    focusPercent,
    distractedSeconds,
    emotionPercent,
    confusedMoments,
    boredMoments,
    timeline,
  };
}

/**
 * Extracts continuous time ranges (e.g. 130s-145s -> "2:10 - 2:25") where the user appeared confused.
 * Useful for the AI tutor prompt to refer to specific sections gently.
 */
export function getConfusedTimeRanges(
  timeline: EngagementTimelinePoint[]
): Array<{ startSec: number; endSec: number; label: string }> {
  const ranges: Array<{ startSec: number; endSec: number; label: string }> = [];
  let currentStart: number | null = null;

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  for (let i = 0; i < timeline.length; i++) {
    const pt = timeline[i];
    if (pt.emotion === 'confused') {
      if (currentStart === null) currentStart = pt.tSec;
    } else {
      if (currentStart !== null) {
        const end = timeline[i - 1]?.tSec ?? currentStart;
        ranges.push({
          startSec: currentStart,
          endSec: end,
          label: currentStart === end ? formatMinSec(currentStart) : `${formatMinSec(currentStart)} - ${formatMinSec(end)}`,
        });
        currentStart = null;
      }
    }
  }

  if (currentStart !== null) {
    const end = timeline[timeline.length - 1]?.tSec ?? currentStart;
    ranges.push({
      startSec: currentStart,
      endSec: end,
      label: currentStart === end ? formatMinSec(currentStart) : `${formatMinSec(currentStart)} - ${formatMinSec(end)}`,
    });
  }

  return ranges;
}

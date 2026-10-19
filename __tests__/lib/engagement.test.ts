// __tests__/lib/engagement.test.ts
// Unit tests for webcam engagement monitoring pure logic:
// classification, smoothing (flicker removal), and summary downsampling.

import { describe, it, expect } from 'vitest';
import {
  classifyFrame,
  computeBaseline,
  computeEngagementSummary,
  extractBlendshapes,
  extractHeadPoseFromMatrix,
  getConfusedTimeRanges,
  smoothFrames,
  EngagementSmoother,
  type EngagementFrameInput,
  type ClassifiedFrame,
} from '@/lib/engagement';

describe('Engagement monitoring - Pure logic', () => {
  describe('extractBlendshapes & HeadPose', () => {
    it('extracts blendshape scores dictionary from category array', () => {
      const categories = [
        { categoryName: 'eyeBlinkLeft', score: 0.12 },
        { categoryName: 'eyeBlinkRight', score: 0.14 },
        { categoryName: 'mouthSmileLeft', score: 0.65 },
      ];
      const bs = extractBlendshapes(categories);
      expect(bs.eyeBlinkLeft).toBe(0.12);
      expect(bs.eyeBlinkRight).toBe(0.14);
      expect(bs.mouthSmileLeft).toBe(0.65);
      expect(bs.mouthSmileRight).toBeUndefined();
    });

    it('extracts head pose Euler angles from identity and rotated 4x4 matrix', () => {
      // Identity matrix (no rotation)
      const identity = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ];
      const poseIdentity = extractHeadPoseFromMatrix(identity);
      expect(poseIdentity.yaw).toBe(0);
      expect(poseIdentity.pitch).toBe(0);

      // Turn 30 degrees yaw (around Y axis in column-major)
      const rad30 = (30 * Math.PI) / 180;
      const cos30 = Math.cos(rad30);
      const sin30 = Math.sin(rad30);
      const turned = [
        cos30, 0, -sin30, 0,
        0, 1, 0, 0,
        sin30, 0, cos30, 0,
        0, 0, 0, 1,
      ];
      const poseTurned = extractHeadPoseFromMatrix(turned);
      expect(Math.abs(poseTurned.yaw)).toBeCloseTo(30, 0);
    });
  });

  describe('classifyFrame', () => {
    it('marks focused = false when face is missing or document is hidden', () => {
      const noFace: EngagementFrameInput = {
        hasFace: false,
        timestampMs: 1000,
      };
      const res1 = classifyFrame(noFace);
      expect(res1.focused).toBe(false);
      expect(res1.emotion).toBe('neutral');

      const hiddenTab: EngagementFrameInput = {
        hasFace: true,
        documentHidden: true,
        blendshapes: { mouthSmileLeft: 0.8, mouthSmileRight: 0.8 },
        timestampMs: 2000,
      };
      const res2 = classifyFrame(hiddenTab);
      expect(res2.focused).toBe(false);
      expect(res2.emotion).toBe('neutral');
    });

    it('marks focused = false when head yaw or pitch exceeds 25 degrees', () => {
      const turnedHead: EngagementFrameInput = {
        hasFace: true,
        headPose: { yaw: 32, pitch: 0 },
        timestampMs: 1000,
      };
      const resYaw = classifyFrame(turnedHead);
      expect(resYaw.focused).toBe(false);

      const noddingHead: EngagementFrameInput = {
        hasFace: true,
        headPose: { yaw: 5, pitch: -28 },
        timestampMs: 1000,
      };
      const resPitch = classifyFrame(noddingHead);
      expect(resPitch.focused).toBe(false);
    });

    it('marks focused = false and emotion = bored when eyes are closed (eyeBlink > 0.6)', () => {
      const eyesClosed: EngagementFrameInput = {
        hasFace: true,
        blendshapes: { eyeBlinkLeft: 0.75, eyeBlinkRight: 0.7 },
        timestampMs: 1000,
      };
      const res = classifyFrame(eyesClosed);
      expect(res.focused).toBe(false);
      expect(res.emotion).toBe('bored');
    });

    it('detects enjoying emotion when smile > 0.4', () => {
      const smiling: EngagementFrameInput = {
        hasFace: true,
        blendshapes: { mouthSmileLeft: 0.55, mouthSmileRight: 0.6 },
        timestampMs: 1000,
      };
      const res = classifyFrame(smiling);
      expect(res.focused).toBe(true);
      expect(res.emotion).toBe('enjoying');
    });

    it('detects confused emotion when browDown + browInnerUp > 0.8', () => {
      const furrowed: EngagementFrameInput = {
        hasFace: true,
        blendshapes: {
          browDownLeft: 0.5,
          browDownRight: 0.5,
          browInnerUp: 0.4,
        },
        timestampMs: 1000,
      };
      const res = classifyFrame(furrowed);
      expect(res.focused).toBe(true);
      expect(res.emotion).toBe('confused');
    });

    it('detects bored emotion when jawOpen > 0.5 (yawn)', () => {
      const yawning: EngagementFrameInput = {
        hasFace: true,
        blendshapes: { jawOpen: 0.65 },
        timestampMs: 1000,
      };
      const res = classifyFrame(yawning);
      expect(res.focused).toBe(true);
      expect(res.emotion).toBe('bored');
    });

    it('uses baseline calibration when baseline is provided', () => {
      const baselineFrames: EngagementFrameInput[] = [
        {
          hasFace: true,
          blendshapes: { mouthSmileLeft: 0.2, mouthSmileRight: 0.2, eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 },
          headPose: { yaw: 5, pitch: 2 },
          timestampMs: 0,
        },
        {
          hasFace: true,
          blendshapes: { mouthSmileLeft: 0.2, mouthSmileRight: 0.2, eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1 },
          headPose: { yaw: 5, pitch: 2 },
          timestampMs: 1000,
        },
      ];
      const baseline = computeBaseline(baselineFrames);
      expect(baseline).not.toBeNull();
      expect(baseline?.avgSmile).toBe(0.2);

      // Resting smile of 0.35 is not enough above baseline 0.2 to trigger enjoying
      const restingFrame: EngagementFrameInput = {
        hasFace: true,
        blendshapes: { mouthSmileLeft: 0.35, mouthSmileRight: 0.35 },
        headPose: { yaw: 6, pitch: 2 },
        timestampMs: 6000,
      };
      const resResting = classifyFrame(restingFrame, baseline);
      expect(resResting.emotion).toBe('neutral');

      // Genuine big smile of 0.7 triggers enjoying
      const bigSmileFrame: EngagementFrameInput = {
        hasFace: true,
        blendshapes: { mouthSmileLeft: 0.75, mouthSmileRight: 0.75 },
        headPose: { yaw: 6, pitch: 2 },
        timestampMs: 7000,
      };
      const resBigSmile = classifyFrame(bigSmileFrame, baseline);
      expect(resBigSmile.emotion).toBe('enjoying');
    });
  });

  describe('Anti-flicker smoothing (EngagementSmoother)', () => {
    it('ignores brief 400ms glitch/distraction within 3-second window', () => {
      const smoother = new EngagementSmoother();
      // Initialize with focused frames
      smoother.addFrame({ timestampMs: 0, focused: true, emotion: 'neutral' });
      smoother.addFrame({ timestampMs: 200, focused: true, emotion: 'neutral' });
      smoother.addFrame({ timestampMs: 400, focused: true, emotion: 'neutral' });

      // Two distracted frames (400ms glitch)
      const g1 = smoother.addFrame({ timestampMs: 600, focused: false, emotion: 'neutral' });
      const g2 = smoother.addFrame({ timestampMs: 800, focused: false, emotion: 'neutral' });

      expect(g1.focused).toBe(true);
      expect(g2.focused).toBe(true);

      // Back to focused
      const back = smoother.addFrame({ timestampMs: 1000, focused: true, emotion: 'neutral' });
      expect(back.focused).toBe(true);
    });

    it('transitions to distracted only after candidate holds for at least 0.8 seconds', () => {
      const smoother = new EngagementSmoother();
      // Start focused at t = 0
      smoother.addFrame({ timestampMs: 0, focused: true, emotion: 'neutral' });

      // Begin continuous distraction at 150ms intervals (~6-7fps)
      // With 1.5s window: at t=300 the distracted majority candidate is first established
      // (focused=1 at t=0, distracted=2 at t=150,300 → distracted majority)
      // The candidate must then hold for 800ms → transition at t >= 300+800 = 1100ms
      let lastState = smoother.getCurrent();
      for (let t = 150; t <= 1050; t += 150) {
        lastState = smoother.addFrame({ timestampMs: t, focused: false, emotion: 'neutral' });
      }
      // At t=1050, candidate has held for 1050-300=750ms < 800ms: still focused
      expect(lastState.focused).toBe(true);

      // At t=1200, candidate has held for 1200-300=900ms >= 800ms: transitions to distracted
      const transitioned = smoother.addFrame({ timestampMs: 1200, focused: false, emotion: 'neutral' });
      expect(transitioned.focused).toBe(false);
    });

    it('smoothFrames helper smooths an entire sequence without mutating timestamps', () => {
      const raw: ClassifiedFrame[] = [
        { timestampMs: 0, focused: true, emotion: 'neutral' },
        { timestampMs: 200, focused: true, emotion: 'neutral' },
        { timestampMs: 400, focused: false, emotion: 'neutral' }, // brief glitch
        { timestampMs: 600, focused: true, emotion: 'neutral' },
      ];
      const smoothed = smoothFrames(raw);
      expect(smoothed).toHaveLength(4);
      expect(smoothed.every((s) => s.focused)).toBe(true);
    });
  });

  describe('Summary calculation & timeline downsampling', () => {
    it('downsamples frames to 1 per second and calculates focus % and moments', () => {
      const frames: ClassifiedFrame[] = [];
      // 10 seconds total at 5 fps (50 frames)
      // Seconds 0-4 (0 to 4800ms): focused, neutral
      for (let t = 0; t <= 4800; t += 200) {
        frames.push({ timestampMs: t, focused: true, emotion: 'neutral' });
      }
      // Seconds 5-7 (5000 to 7800ms): focused, confused (3 seconds confused)
      for (let t = 5000; t <= 7800; t += 200) {
        frames.push({ timestampMs: t, focused: true, emotion: 'confused' });
      }
      // Seconds 8-9 (8000 to 9800ms): distracted, bored (2 seconds distracted)
      for (let t = 8000; t <= 9800; t += 200) {
        frames.push({ timestampMs: t, focused: false, emotion: 'bored' });
      }

      const summary = computeEngagementSummary(frames, 10);

      expect(summary.timeline).toHaveLength(10);
      expect(summary.timeline[0].tSec).toBe(0);
      expect(summary.timeline[9].tSec).toBe(9);

      // 8 focused seconds, 2 distracted seconds -> 80% focus
      expect(summary.focusPercent).toBe(80);
      expect(summary.distractedSeconds).toBe(2);

      // Emotion breakdown
      expect(summary.emotionPercent.confused).toBe(30); // 3 out of 10s
      expect(summary.emotionPercent.bored).toBe(20); // 2 out of 10s
      expect(summary.emotionPercent.neutral).toBe(50); // 5 out of 10s

      // Moments counts
      expect(summary.confusedMoments).toBe(1);
      expect(summary.boredMoments).toBe(1);

      // Confused time ranges
      const ranges = getConfusedTimeRanges(summary.timeline);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startSec).toBe(5);
      expect(ranges[0].endSec).toBe(7);
      expect(ranges[0].label).toBe('0:05 - 0:07');
    });

    it('returns safe fallback summary when no frames are provided', () => {
      const emptySummary = computeEngagementSummary([]);
      expect(emptySummary.focusPercent).toBe(100);
      expect(emptySummary.distractedSeconds).toBe(0);
      expect(emptySummary.confusedMoments).toBe(0);
      expect(emptySummary.timeline).toEqual([]);
    });
  });
});

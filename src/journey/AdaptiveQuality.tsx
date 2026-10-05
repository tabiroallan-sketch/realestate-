"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import {
  detectQualityTier,
  TIER_BUDGETS,
  type QualityBudget,
  type QualityTier,
} from "@/journey/deviceProfile";

export type { QualityBudget, QualityTier } from "@/journey/deviceProfile";

/** Mutable runtime quality state, read every frame by the scene. */
export type QualityState = QualityBudget & {
  tier: QualityTier;
};

type AdaptiveQualityProps = {
  state: React.RefObject<QualityState>;
};

/**
 * Samples frame duration and steps the tier down when the average falls behind.
 *
 * Uses a rolling window rather than an instantaneous reading: a single slow
 * frame is usually a GC pause or a texture upload, and downgrading on those
 * would make quality flicker for no reason.
 *
 * Downgrades only. A device that renders smoothly at the high tier gains nothing
 * from being promoted later, and oscillating between tiers is more visible than
 * simply running one tier well.
 */
export function AdaptiveQuality({ state }: AdaptiveQualityProps) {
  const gl = useThree((three) => three.gl);

  const sample = useRef({
    frames: 0,
    elapsed: 0,
    // Ignore the first moments: shader compilation and texture decode make
    // early frames unrepresentative.
    warmup: 0.7,
    downgrades: 0,
  });

  useEffect(() => {
    const initial = detectQualityTier();
    applyTier(state, initial, gl);
  }, [state, gl]);

  useFrame((_, delta) => {
    const s = sample.current;
    const current = state.current;
    if (!current) return;

    if (current.tier === "conservative" || s.downgrades >= 2) return;

    if (s.warmup > 0) {
      s.warmup -= delta;
      s.frames = 0;
      s.elapsed = 0;
      return;
    }

    // 45 frames is roughly three quarters of a second at 60fps — long enough to
    // be stable, short enough to act on before the scroll begins.
    s.frames += 1;
    s.elapsed += delta;

    if (s.frames < 45) return;

    const fps = s.frames / s.elapsed;
    s.frames = 0;
    s.elapsed = 0;

    if (fps >= 45) return;

    s.downgrades += 1;
    const next: QualityTier = current.tier === "high" ? "balanced" : "conservative";
    applyTier(state, next, gl);
  });

  return null;
}

function applyTier(
  state: React.RefObject<QualityState>,
  tier: QualityTier,
  gl: { setPixelRatio: (ratio: number) => void } | null,
) {
  const budget = TIER_BUDGETS[tier];
  state.current = { tier, ...budget };
  if (gl) gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, budget.dpr));
}

/**
 * Caps device pixel ratio to the tier budget.
 *
 * Runs once on mount: `AdaptiveQuality` owns every later change, and two effects
 * writing the pixel ratio would fight each other during a downgrade.
 */
export function useDprBudget(state: React.RefObject<QualityState>) {
  const gl = useThree((three) => three.gl);

  useEffect(() => {
    if (!state.current) return;
    gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.current.dpr));
  }, [gl, state]);
}

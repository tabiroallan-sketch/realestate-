"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { journey } from "@/journey/store";

/**
 * Day → night state.
 *
 * Held in a ref rather than state because it is read every frame inside
 * `useFrame` and must never trigger a re-render.
 */
export type DayState = {
  /** 0 = full day, 1 = full night. */
  night: number;
  /** Sun elevation in radians; drives the directional light. */
  elevation: number;
  /** True once interior and facade lights should be on. */
  lightsOn: boolean;
};

/**
 * Maps journey progress to a day state.
 *
 * The transition belongs to the last fifth of the flight, which is where the
 * camera pulls back to the illuminated exterior. Holding full day for the rest
 * keeps the architecture legible — an all-day scene would be prettier and would
 * hide the building's massing entirely.
 */
export function useDayCycle(reduced: boolean) {
  const state = useRef<DayState>({ night: 0, elevation: 1.1, lightsOn: false });

  useFrame(() => {
    const t = Math.min(1, Math.max(0, journey.progress.value));
    const night = smoothstep(0.8, 0.97, t);

    const next = reduced ? (t > 0.9 ? 1 : 0) : night;
    const current = state.current;

    current.night = next;
    current.lightsOn = next > 0.35;
    current.elevation = THREE.MathUtils.lerp(1.15, -0.08, next);
  });

  return state;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
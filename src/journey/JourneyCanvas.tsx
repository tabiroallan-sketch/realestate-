"use client";

import { useEffect, useState } from "react";

import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { detectQualityTier, TIER_BUDGETS } from "@/journey/deviceProfile";

export type JourneyCanvasProps = {
  className?: string;
};

/**
 * Pixel ratio for the canvas.
 *
 * Read once on mount from the same device profile the rest of the scene uses, so
 * mobile renders at DPR 1 from its very first frame instead of briefly rendering
 * a 2x buffer and downgrading after first paint.
 */
export function resolveDpr(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, TIER_BUDGETS[detectQualityTier()].dpr);
}

type Impl = React.ComponentType<{ dpr: number }>;

/**
 * The persistent journey canvas.
 *
 * Mounted once for the whole scroll span and never unmounted — that is the entire
 * point: a single WebGL context the camera flies through. It sits behind the DOM
 * journey with `pointer-events: none`, so all content stays real, selectable and
 * keyboard reachable.
 *
 * Nothing 3D is imported statically. React Three Fiber, Three.js and the whole
 * scene graph arrive through a single dynamic import after first paint, so the
 * initial bundle carries no 3D code at all.
 */
export function JourneyCanvas({ className }: JourneyCanvasProps) {
  const supported = useWebGLSupport();
  const [payload, setPayload] = useState<{ Impl: Impl; dpr: number } | null>(null);

  useEffect(() => {
    if (!supported) return;

    let cancelled = false;

    // The component and its resolution are settled in one state update, so the
    // canvas never mounts for a frame at the wrong pixel ratio.
    void import("@/journey/JourneyCanvasImpl").then((module) => {
      if (cancelled) return;
      setPayload({ Impl: module.JourneyCanvasImpl, dpr: resolveDpr() });
    });

    return () => {
      cancelled = true;
    };
  }, [supported]);

  // No WebGL: the DOM journey carries the experience on its own. Returning null
  // rather than a placeholder avoids an empty box sitting over real content.
  if (!supported) return null;

  return (
    <div
      data-journey-canvas
      aria-hidden="true"
      className={className ?? "pointer-events-none fixed inset-0 z-0"}
    >
      {payload && <payload.Impl dpr={payload.dpr} />}
    </div>
  );
}
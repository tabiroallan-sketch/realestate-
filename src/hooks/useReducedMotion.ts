"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tracks `prefers-reduced-motion`.
 *
 * Synchronous from the first client render rather than corrected in an effect.
 * That matters: an effect-based version reports `false` on the first pass, which
 * lets a `gsap.from(...)` tween get created and apply its opacity-0 from-state.
 * When the hook then flips to `true` the re-run skips the animation, and the
 * elements are stranded invisible. `useSyncExternalStore` closes that window —
 * there is no render in which motion-reduced users see a hidden element.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const query = window.matchMedia(QUERY);
      query.addEventListener("change", onStoreChange);
      return () => query.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(QUERY).matches,
    // Server render: assume motion is allowed. No element is ever hidden in
    // markup, so this only decides whether an animation is scheduled.
    () => false,
  );
}
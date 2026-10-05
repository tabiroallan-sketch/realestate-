"use client";

import { useEffect, useRef, useState } from "react";

type Entry = { src: string; weight?: number };

/**
 * Preloads a prioritised list of images and reports genuine completion
 * progress (0 → 1). No artificial delay is ever added.
 *
 * Weights bias the reported progress toward assets that matter most (the hero
 * poster), so the bar reflects perceived readiness rather than raw file order.
 */
export function useAssetPreload(entries: Entry[], enabled = true) {
  // Nothing to wait for is already "complete", so the disabled path is handled
  // during render rather than by a state update inside the effect.
  const idle = !enabled || entries.length === 0;
  const [progress, setProgress] = useState(idle ? 1 : 0);
  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (idle) return;

    let cancelled = false;
    loadedRef.current = new Set();

    const totalWeight = entries.reduce((sum, e) => sum + (e.weight ?? 1), 0);
    const loadedWeight = () =>
      entries.reduce(
        (sum, e) => sum + (loadedRef.current.has(e.src) ? (e.weight ?? 1) : 0),
        0,
      );

    const report = () => {
      if (cancelled) return;
      setProgress(Math.min(1, loadedWeight() / totalWeight));
    };

    entries.forEach((entry) => {
      const image = new Image();
      image.decoding = "async";

      const done = () => {
        if (loadedRef.current.has(entry.src)) return;
        loadedRef.current.add(entry.src);
        report();
      };

      image.onload = done;
      // A failed asset must not stall the loading screen.
      image.onerror = done;
      image.src = entry.src;
    });

    report();

    return () => {
      cancelled = true;
    };
  }, [idle, entries]);

  return idle ? 1 : progress;
}
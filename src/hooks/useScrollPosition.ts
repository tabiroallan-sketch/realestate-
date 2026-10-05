"use client";

import { useEffect, useRef, useState } from "react";

import { chapters } from "@/data/navigation";

export type ScrollDirection = "down" | "up";

export type ScrollState = {
  /** 0 → 1 across the whole document. */
  progress: number;
  /** Id of the chapter occupying the viewport centre. */
  activeId: string;
  scrollY: number;
  direction: ScrollDirection;
};

/**
 * Single source of truth for document scroll.
 *
 * Consumers derive what they need during render rather than reading
 * `window.scrollY` inside their own effects — one rAF-throttled listener, one
 * layout read per frame, and no cascading setState from derived effects.
 */
export function useScrollPosition(): ScrollState {
  const [state, setState] = useState<ScrollState>({
    progress: 0,
    activeId: chapters[0]?.id ?? "hero",
    scrollY: 0,
    direction: "down",
  });

  const lastScrollY = useRef(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;

      const scrollY = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;

      const direction: ScrollDirection = scrollY > lastScrollY.current ? "down" : "up";

      const centre = window.innerHeight * 0.5;
      let activeId = chapters[0]?.id ?? "hero";

      for (const chapter of chapters) {
        const el = document.getElementById(chapter.id);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= centre && bottom > centre) {
          activeId = chapter.id;
          break;
        }
      }

      lastScrollY.current = scrollY;

      // Bail when nothing observable changed — avoids a re-render per frame on
      // sub-pixel scroll deltas.
      setState((prev) =>
        prev.progress === progress &&
        prev.activeId === activeId &&
        prev.scrollY === scrollY &&
        prev.direction === direction
          ? prev
          : { progress, activeId, scrollY, direction },
      );
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return state;
}
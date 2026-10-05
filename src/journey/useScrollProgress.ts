"use client";

import { useEffect } from "react";

import { gsap, ScrollTrigger, registerGsap } from "@/animations/gsap";
import { scrub } from "@/animations/easing";
import { JOURNEY_END_ID, JOURNEY_START_ID } from "@/journey/waypoints";
import { journey, resetJourney } from "@/journey/store";

registerGsap();

/**
 * Scroll progress for the journey, written straight into the shared store.
 *
 * `scrub` is a smoothing factor, not a duration: ScrollTrigger eases toward the
 * scroll position over roughly a second, which is what makes the camera feel
 * operated rather than dragged. Only the number is written — nothing here
 * triggers a render.
 */
export function useScrollProgress() {
  useEffect(() => {
    const start = document.getElementById(JOURNEY_START_ID);
    const end = document.getElementById(JOURNEY_END_ID);

    if (!start || !end) {
      // Nothing to drive yet — the canvas stays at progress 0.
      return;
    }

    const trigger = ScrollTrigger.create({
      trigger: start,
      // The journey runs from the top of the first chapter to the bottom of the
      // last, so the whole scroll span maps onto 0 → 1.
      endTrigger: end,
      start: "top top",
      end: "bottom bottom",
      scrub: scrub.cinematic,
      onUpdate: (self) => {
        journey.progress.value = self.progress;
        journey.progress.active = true;
      },
      onLeaveBack: () => {
        journey.progress.active = false;
      },
    });

    // Layout settles after fonts and photographs decode; without a refresh the
    // end position is measured against an empty document and the camera runs out
    // of path halfway up the page.
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) {
      void document.fonts.ready.then(refresh);
    }
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      trigger.kill();
      resetJourney();
    };
  }, []);
}

/**
 * Scroll progress across the entire document, 0 → 1.
 *
 * Used by the scroll rail. Kept separate from the journey trigger because the
 * rail must span the whole page, including the chapters past the canvas.
 */
export function useDocumentProgress(onProgress: (value: number) => void) {
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => onProgress(self.progress),
    });

    return () => trigger.kill();
  }, [onProgress]);
}

export { gsap, ScrollTrigger };
"use client";

import { useEffect } from "react";

import { journey } from "@/journey/store";

/**
 * Damped pointer parallax, written into the shared store.
 *
 * The raw pointer is unusable for camera work: it jitters, and on a trackpad it
 * reports large jumps. A damped follow turns it into something that feels like
 * the camera has mass.
 */
export function usePointerParallax(disabled: boolean) {
  useEffect(() => {
    // Coarse pointers and reduced motion: park at centre.
    if (disabled) {
      journey.parallax.x = 0;
      journey.parallax.y = 0;
      return;
    }

    // Only a fine pointer with hover can drive parallax. A touch device moving
    // the camera while scrolling would fight the scroll itself.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const state = { x: 0, y: 0 };
    let frame = 0;
    let last = 0;

    const onPointerMove = (event: PointerEvent) => {
      // Normalised device coords: -1 → 1 across the viewport, independent of
      // resolution.
      state.x = (event.clientX / window.innerWidth) * 2 - 1;
      state.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    const onPointerLeave = () => {
      state.x = 0;
      state.y = 0;
    };

    const tick = (now: number) => {
      frame = 0;
      // Frame-rate independent damping: one time constant on a 60 Hz or a
      // 144 Hz display, and skipping frames should skip easing.
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      const ease = 1 - Math.exp(-3 * dt);
      journey.parallax.x += (state.x - journey.parallax.x) * ease;
      journey.parallax.y += (state.y - journey.parallax.y) * ease;
    };

    const onTick = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointermove", onTick, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointermove", onTick);
      document.removeEventListener("pointerleave", onPointerLeave);
      if (frame) window.cancelAnimationFrame(frame);
      journey.parallax.x = 0;
      journey.parallax.y = 0;
    };
  }, [disabled]);
}
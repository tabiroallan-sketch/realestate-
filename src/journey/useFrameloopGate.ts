"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Pauses the render loop when the canvas cannot be seen.
 *
 * A backgrounded tab or a scrolled-past journey otherwise burns a full frame of
 * GPU every animation frame. R3F's `frameloop` switches to `never` and is
 * restored on return, so a returning visitor gets an immediate frame rather than
 * a visible stutter.
 */
export function useFrameloopGate() {
  const invalidate = useThree((state) => state.invalidate);
  const setFrameloop = useThree((state) => state.setFrameloop);

  // Held in a ref because the listener is registered once but needs the current
  // frameloop when a visibility change fires long after mount.
  const active = useRef(true);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        active.current = false;
        setFrameloop("never");
        return;
      }
      active.current = true;
      setFrameloop("always");
      invalidate();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setFrameloop, invalidate]);

  return active;
}
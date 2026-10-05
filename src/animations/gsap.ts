"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * Single registration point for GSAP plugins.
 *
 * Importing this module is enough to guarantee `gsap.registerPlugin` has run
 * before any tween or ScrollTrigger is created. It is a no-op on repeat
 * imports because module evaluation is cached.
 */
let registered = false;

export function registerGsap() {
  if (registered) return gsap;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  registered = true;
  return gsap;
}

export { gsap, ScrollTrigger, SplitText };

/** Motion must be re-evaluated when the OS preference changes at runtime. */
export function refreshScrollTriggers() {
  ScrollTrigger.refresh();
}
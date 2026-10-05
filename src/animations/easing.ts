/**
 * Named easing curves, mirroring the CSS tokens in `globals.css`.
 *
 * Architecture gets slow, symmetric curves. Only transitions earn fast,
 * asymmetric easing.
 */
export const ease = {
  /** Entrances — decisive start, long settle. */
  outExpo: "expo.out",
  /** Standard UI state change. */
  power2Out: "power2.out",
  /** Cinematic camera moves and section transitions. */
  inOutQuint: "power5.inOut",
  /** Symmetrical, for anything that should feel architectural. */
  architectural: "power4.inOut",
} as const;

/** Smoothstep-style 0 → 1 → 0 curve, for interpolating between authored stops. */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export const duration = {
  micro: 0.18,
  ui: 0.32,
  reveal: 0.9,
  cinematic: 1.6,
} as const;

/**
 * `scrub` values. GSAP guidance: use `true` (instant) or a small number for
 * scroll-linked motion — never `onEnter`/`onLeave`, which snap.
 */
export const scrub = {
  tight: true,
  smooth: 1,
  cinematic: 1.5,
} as const;
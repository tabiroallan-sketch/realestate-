/**
 * Device capability profiling.
 *
 * Deliberately free of Three.js and React Three Fiber imports: the canvas shell
 * needs the tier *before* the 3D chunk loads, and importing the profiler from a
 * module that pulls in R3F would drag the whole 3D bundle into the first paint.
 */

export type QualityTier = "conservative" | "balanced" | "high";

export type QualityBudget = {
  /**
   * Device pixel ratio ceiling.
   *
   * Never use raw `window.devicePixelRatio`: a 3x phone at full DPR renders 9x
   * the pixels of a 1x panel for no visible gain on a phone-sized canvas.
   */
  dpr: number;
  /** Maximum rooftop particles; 0 disables the system entirely. */
  particles: number;
  /** Skyline instance count. */
  skyline: number;
};

/** Coarse pointer and touch devices get the conservative budget. */
const MOBILE_BREAKPOINT = 820;

export const TIER_BUDGETS: Record<QualityTier, QualityBudget> = {
  conservative: { dpr: 1, particles: 0, skyline: 220 },
  balanced: { dpr: 1.5, particles: 1200, skyline: 420 },
  high: { dpr: 2, particles: 3000, skyline: 620 },
};

/**
 * Picks a starting tier from device signals.
 *
 * The guess is optimistic on desktop because most laptops handle the high tier;
 * the frame-time sampler in `AdaptiveQuality` corrects it within a couple of
 * seconds. Mobile starts conservative since it is far more likely to be
 * thermally limited, and a phone that stutters on first scroll is worse than one
 * that renders beautifully at a slightly lower budget.
 */
export function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "conservative";

  const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  if (isMobile) return "conservative";

  // Software rendering reports a large core count but cannot sustain the high
  // tier, so a SwiftShader context is treated as a low-power device.
  if (hasSoftwareRenderer()) return "conservative";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (cores >= 8 && memory >= 8) return "high";
  if (cores >= 4) return "balanced";
  return "conservative";
}

function hasSoftwareRenderer(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) return true;

    const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? String((gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      : "";

    const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    lose?.loseContext();

    return /swiftshader|llvmpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}
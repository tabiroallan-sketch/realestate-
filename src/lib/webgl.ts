/**
 * WebGL capability detection.
 *
 * Kept free of React and DOM-only assumptions at module scope so it can be
 * imported from anywhere (including the 3D layer) without dragging in a
 * client boundary.
 */

export type WebGLSupport = "pending" | "supported" | "unsupported";

function probeWebGL(): boolean {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");

    if (!gl) return false;

    // Release the probe context immediately; browsers cap concurrent contexts.
    const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    lose?.loseContext();

    return true;
  } catch {
    return false;
  }
}

let cached: WebGLSupport = "pending";

export function detectWebGL(): WebGLSupport {
  if (cached === "pending") {
    cached = probeWebGL() ? "supported" : "unsupported";
  }
  return cached;
}
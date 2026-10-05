"use client";

import { useSyncExternalStore } from "react";

function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");

    if (!gl) return false;

    // A context can exist but be software-rendered or blocked by policy. Treat
    // an unusable context as no WebGL so the DOM-only journey stays intact.
    const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    lose?.loseContext();

    return true;
  } catch {
    return false;
  }
}

// Detection is stable for the lifetime of the document, so the snapshot must be
// a cached primitive or React will loop on identity changes.
let cached: boolean | null = null;

function getSnapshot(): boolean {
  if (cached === null) cached = detectWebGL();
  return cached;
}

const subscribe = () => () => {};

/**
 * Whether a usable WebGL context is available.
 *
 * Returns `false` on the server so server and client markup agree; the canvas
 * mounts on the client only if detection succeeds.
 */
export function useWebGLSupport(): boolean {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  );
}
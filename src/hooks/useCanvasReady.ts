"use client";

import { useSyncExternalStore } from "react";

import {
  canvasReadyServerSnapshot,
  canvasReadySnapshot,
  subscribeCanvasReady,
} from "@/journey/store";

/**
 * Whether the WebGL layer has drawn its first frame.
 *
 * `useSyncExternalStore` rather than state because the flag is published by the
 * canvas, which is a sibling of the content rather than its parent.
 */
export function useCanvasReady(): boolean {
  return useSyncExternalStore(
    subscribeCanvasReady,
    canvasReadySnapshot,
    canvasReadyServerSnapshot,
  ).ready;
}
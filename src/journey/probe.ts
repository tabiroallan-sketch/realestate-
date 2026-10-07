"use client";

import { journey } from "@/journey/store";

/**
 * Opt-in test seam for the journey scene.
 *
 * The probe needs to read where the camera actually ended up at a given flight
 * parameter, and to drive that parameter directly rather than through the DOM.
 * Reaching either from the outside means exposing something, and the cheapest
 * honest exposure is a small mutable object behind a query flag: without
 * `?journeyProbe=1` nothing here is written to and the frame loop costs one
 * boolean check.
 *
 * This module is imported by `CameraRig`, which lives inside the dynamic chunk,
 * so none of it reaches the initial bundle.
 */

type Vec3 = { x: number; y: number; z: number };

export type JourneyProbe = {
  /** True once `?journeyProbe=1` is present in the URL. */
  enabled: boolean;
  /**
   * Freezes the flight parameter against ScrollTrigger.
   *
   * The scroll trigger scrubs toward the real scroll position every frame, so a
   * directly-assigned value is dragged back to the document position before the
   * damped camera can reach it. Measuring without this reads a camera mid-decay
   * rather than at rest — tens of units of phantom error.
   */
  hold: boolean;
  /** The flight parameter the rig sampled on its last frame. */
  t: number;
  /**
   * Increments once per frame. Under software rendering a frame can take 250ms,
   * so polling on wall-clock alone reads the previous frame's values and looks
   * like the camera never moved.
   */
  frame: number;
  /** Where the rig wants the camera to be. */
  desired: Vec3;
  /** Where the camera actually is, after damping. */
  camera: Vec3;
  /** The look-at target the rig wants. */
  target: Vec3;
};

const disabled: Vec3 = { x: 0, y: 0, z: 0 };

export const journeyProbe: JourneyProbe = {
  enabled: false,
  hold: false,
  t: 0,
  frame: 0,
  desired: disabled,
  camera: disabled,
  target: disabled,
};

/**
 * Turns the probe on when the URL asks for it. Runs once on mount — reading
 * `location` during render would differ between server and client.
 */
export function enableJourneyProbe() {
  if (typeof window === "undefined") return;
  try {
    journeyProbe.enabled = new URLSearchParams(window.location.search).has("journeyProbe");
  } catch {
    journeyProbe.enabled = false;
  }

  if (!journeyProbe.enabled) return;

  // Publish only behind the flag. Without `?journeyProbe=1` these never exist,
  // so there is nothing on `window` for a visitor or a scraper to read.
  Object.defineProperty(window, "__journeyProbe", {
    value: journeyProbe,
    configurable: true,
  });
  Object.defineProperty(window, "__forceProgress", {
    value: forceProgress,
    configurable: true,
  });
}

/**
 * Drives the flight directly, bypassing ScrollTrigger. Used by the probe to
 * stand the camera at an exact authored parameter; scrolling cannot hit one of
 * these values precisely enough to assert on.
 */
function forceProgress(t: number) {
  journeyProbe.hold = true;
  journey.progress.value = t < 0 ? 0 : t > 1 ? 1 : t;
}
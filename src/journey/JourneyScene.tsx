"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { assets, heroVideo } from "@/data/assets";
import { BEATS } from "@/data/beats";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { AdaptiveQuality, type QualityState } from "@/journey/AdaptiveQuality";
import { Backdrop } from "@/journey/Backdrop";
import { CameraRig } from "@/journey/CameraRig";
import { PhotoPlane } from "@/journey/PhotoPlane";
import { initPlaneReady } from "@/journey/ready";
import { markCanvasReady } from "@/journey/store";
import { useFrameloopGate } from "@/journey/useFrameloopGate";
import { usePointerParallax } from "@/journey/usePointerParallax";
import { useScrollProgress } from "@/journey/useScrollProgress";
import { VideoPlane } from "@/journey/VideoPlane";

/**
 * The scene graph.
 *
 * Split from the canvas shell so Three.js and this whole module land in a lazily
 * imported chunk — the initial bundle carries no 3D code at all.
 */
export function JourneyScene() {
  const reduced = useReducedMotion();

  // Defaults match the balanced tier; `AdaptiveQuality` overwrites this ref as
  // soon as the real device profile resolves. A ref rather than state because the
  // scene reads it every frame and must never trigger a re-render.
  const quality = useRef<QualityState>({
    tier: "balanced",
    dpr: 1.5,
    particles: 1200,
  });

  useScrollProgress();
  usePointerParallax(reduced);
  useFrameloopGate();

  // Arms the plane-readiness seam. Child effects run before this one, but a
  // texture decode is always asynchronous, so no `markPlaneReady` can land
  // before the counter is armed.
  useEffect(() => {
    initPlaneReady(BEATS.length);
  }, []);

  return (
    <>
      <AdaptiveQuality state={quality} />
      <CameraRig />
      <Backdrop />

      {BEATS.map((beat, index) =>
        beat.id === "arrival" ? (
          <VideoPlane
            key={beat.id}
            src={heroVideo.webm}
            poster={heroVideo.poster}
            beatIndex={index}
            depth={beat.depth}
          />
        ) : (
          <PhotoPlane
            key={beat.id}
            src={`${assets[beat.assetKey].srcSetBase}-1376.webp`}
            beatIndex={index}
            depth={beat.depth}
          />
        ),
      )}

      <ReadySignal />
    </>
  );
}

/** Publishes readiness once the first frame has actually been drawn. */
function ReadySignal() {
  const fired = useRef(false);

  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    markCanvasReady();
  });

  return null;
}

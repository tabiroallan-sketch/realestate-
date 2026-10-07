"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { AdaptiveQuality, type QualityState } from "@/journey/AdaptiveQuality";
import { CameraRig } from "@/journey/CameraRig";
import { Atmosphere } from "@/journey/environment/Atmosphere";
import { City, Ground } from "@/journey/environment/City";
import { Sky } from "@/journey/environment/Sky";
import { TOWERS, TowerCluster } from "@/journey/TowerCluster";
import { markCanvasReady } from "@/journey/store";
import { useDayCycle } from "@/journey/useDayCycle";
import { useFrameloopGate } from "@/journey/useFrameloopGate";
import { usePointerParallax } from "@/journey/usePointerParallax";
import { useScrollProgress } from "@/journey/useScrollProgress";
import { STOREY_HEIGHT } from "@/journey/waypoints";
import { WindowLights } from "@/journey/WindowLights";

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
    skyline: 420,
  });

  const day = useDayCycle(reduced);

  useScrollProgress();
  usePointerParallax(reduced);
  useFrameloopGate();

  // The skyline instance count is the one quality value worth re-rendering for.
  // Polled rather than subscribed: a tier change is rare, and subscribing would
  // re-render the whole scene to change a single number.
  const skyline = useSkylineCount(quality);

  return (
    <>
      <AdaptiveQuality state={quality} />
      <CameraRig />

      <Sky day={day} />
      <Atmosphere day={day} density={0.00072} sunPosition={[-180, 210, 150]} />

      <Ground />
      <TowerCluster />
      <WindowLights
        night={day}
        towers={TOWERS.map((tower) => ({
          x: tower.x,
          z: tower.z,
          w: tower.w,
          d: tower.d,
          storeys: tower.storeys,
        }))}
        storeyHeight={STOREY_HEIGHT}
      />
      <City count={skyline} />

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

function useSkylineCount(quality: React.RefObject<QualityState>): number {
  const [count, setCount] = useState(420);
  const applied = useRef(420);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = quality.current?.skyline ?? 420;
      if (next === applied.current) return;
      applied.current = next;
      setCount(next);
    }, 1500);

    return () => window.clearInterval(id);
  }, [quality]);

  return count;
}
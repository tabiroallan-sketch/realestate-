"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { PALETTE } from "@/journey/environment/Sky";

/**
 * Exponential fog, the plan's atmosphere choice.
 *
 * `FogExp2` gives implicit far-plane culling for free — geometry dissolves before
 * it reaches the far clip, so the skyline can be large without costing fill rate
 * — and it is the reason the city reads as distance rather than as a backdrop.
 *
 * All lights are built once and mutated in place. Three.js lights are mutable
 * engine objects, so nothing here is React state.
 */
export function Atmosphere({
  day,
  density,
  sunPosition,
}: {
  day: React.RefObject<import("@/journey/useDayCycle").DayState>;
  density: number;
  sunPosition: [number, number, number];
}) {
  const scene = useMemo(() => {
    const fog = new THREE.FogExp2(PALETTE.fogDay, density);

    // A physical sun with no source texture gives directional shading on the
    // tower faces. Positioned on the west-south-west arc for the long afternoon
    // shadows the brief calls for.
    const sun = new THREE.DirectionalLight(PALETTE.sunDay, 2.4);
    sun.position.set(...sunPosition);
    // Phase 2 spends the frame budget on geometry; the brief forbids visible
    // shadow maps, and a facade in Nairobi's light is legible without one.
    sun.castShadow = false;

    const ambient = new THREE.HemisphereLight("#cfe0ea", PALETTE.ground, 1.2);

    // Scratch colours, allocated once. Interpolating between fresh
    // `THREE.Color` instances every frame would allocate ~150 objects a second
    // for no benefit.
    const colors = {
      fogDay: new THREE.Color(PALETTE.fogDay),
      fogNight: new THREE.Color(PALETTE.nightFog),
      sunDay: new THREE.Color(PALETTE.sunDay),
      sunNight: new THREE.Color("#5a6b8c"),
    };

    return { fog, sun, ambient, colors };
  }, [density, sunPosition]);

  const sceneRef = useRef(scene);

  useFrame(() => {
    const state = day.current;
    if (!state) return;

    const { fog, sun, ambient, colors } = sceneRef.current;

    fog.color.lerpColors(colors.fogDay, colors.fogNight, state.night);
    // Night fog thickens: the density that reads as clear afternoon air would
    // leave the skyline razor-sharp after dark, which breaks the illusion.
    fog.density = density * (1 + state.night * 0.55);

    sun.color.lerpColors(colors.sunDay, colors.sunNight, state.night);
    sun.intensity = 2.4 * (1 - state.night * 0.82);

    ambient.intensity = 1.2 * (1 - state.night * 0.68);
  });

  return (
    <>
      {/* Attached imperatively: fog is scene state, not a child of any object. */}
      <primitive object={scene.fog} attach="fog" />
      <primitive object={scene.sun} />
      <primitive object={scene.ambient} />
    </>
  );
}
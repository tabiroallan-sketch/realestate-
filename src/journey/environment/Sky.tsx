"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { DayState } from "@/journey/useDayCycle";

/**
 * Palette mirrors the CSS tokens in `globals.css`. Duplicated deliberately:
 * sampling computed styles at runtime would mean the scene cannot render before
 * hydration, and would force a style recalculation per material.
 */
export const PALETTE = {
  ivory: "#e8e4dc",
  ivoryDeep: "#cfc9bd",
  bronze: "#9a7b4f",
  bronzeDark: "#6b563a",
  glazing: "#5f7d8c",
  verdant: "#3d5a45",
  ground: "#4a4741",
  fogDay: "#b9c4c9",
  sunDay: "#fff4e2",
  nightSky: "#0d1622",
  nightFog: "#141f2b",
  windowGlow: "#ffcf94",
} as const;

/** Sky gradient stops for day and night. */
export const SKY_DAY = { top: "#3f74a2", horizon: "#cbd6db", bottom: "#6d6a63" } as const;
export const SKY_NIGHT = { top: "#050a13", horizon: "#243449", bottom: "#070b12" } as const;

const SKY_VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  uniform float uOffset;
  uniform float uHorizonSharpness;

  varying vec3 vWorldPosition;

  void main() {
    vec3 direction = normalize(vWorldPosition);
    float height = direction.y + uOffset;

    // Below the horizon the gradient falls to a ground haze, so the skyline
    // reads as sitting *in* atmosphere rather than pasted onto a card.
    float above = smoothstep(0.0, uHorizonSharpness, height);
    float below = smoothstep(0.0, uHorizonSharpness * 0.6, -height);

    vec3 color = mix(uHorizon, uTop, pow(above, 0.72));
    color = mix(color, uBottom, below);

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
  }
`;

type SkyProps = {
  /** Shared day-cycle state. The gradient interpolates as `night` rises. */
  day: React.RefObject<DayState>;
  radius?: number;
  offset?: number;
  horizonSharpness?: number;
};

/**
 * Analytic sky gradient that follows the day cycle.
 *
 * A gradient shader rather than a skybox texture: one draw call, no texture
 * memory, and it interpolates continuously as the light changes. The horizon
 * band is what sells the sky — a hard two-stop gradient reads as a flat
 * backdrop rather than as air.
 */
export function Sky({ day, radius = 1600, offset = 0, horizonSharpness = 0.34 }: SkyProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(SKY_DAY.top) },
          uHorizon: { value: new THREE.Color(SKY_DAY.horizon) },
          uBottom: { value: new THREE.Color(SKY_DAY.bottom) },
          uOffset: { value: offset },
          uHorizonSharpness: { value: horizonSharpness },
        },
      }),
    [offset, horizonSharpness],
  );

  const geometry = useMemo(() => new THREE.SphereGeometry(radius, 32, 20), [radius]);

  // Scratch colours, reused each frame to avoid per-frame allocation.
  const scratch = useRef({
    top: new THREE.Color(),
    horizon: new THREE.Color(),
    bottom: new THREE.Color(),
    dayTop: new THREE.Color(SKY_DAY.top),
    dayHorizon: new THREE.Color(SKY_DAY.horizon),
    dayBottom: new THREE.Color(SKY_DAY.bottom),
    nightTop: new THREE.Color(SKY_NIGHT.top),
    nightHorizon: new THREE.Color(SKY_NIGHT.horizon),
    nightBottom: new THREE.Color(SKY_NIGHT.bottom),
  });

  useFrame(() => {
    const state = day.current;
    if (!state) return;

    const s = scratch.current;
    const night = state.night;

    s.top.lerpColors(s.dayTop, s.nightTop, night);
    s.horizon.lerpColors(s.dayHorizon, s.nightHorizon, night);
    s.bottom.lerpColors(s.dayBottom, s.nightBottom, night);

    material.uniforms.uTop.value.copy(s.top);
    material.uniforms.uHorizon.value.copy(s.horizon);
    material.uniforms.uBottom.value.copy(s.bottom);
  });

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-1}
      name="sky"
    />
  );
}
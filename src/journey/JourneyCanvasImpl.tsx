"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { JourneyScene } from "@/journey/JourneyScene";

type JourneyCanvasImplProps = {
  /** Already capped against the device budget by `resolveDpr`. */
  dpr: number;
};

/**
 * Owns the WebGL context.
 *
 * Kept in its own module purely so that everything touching Three.js — the
 * renderer, tone mapping, the scene graph — sits behind the dynamic import in
 * `JourneyCanvas`. Nothing here should be imported statically anywhere else.
 */
export function JourneyCanvasImpl({ dpr }: JourneyCanvasImplProps) {
  return (
    <Canvas
      dpr={dpr}
      camera={{ fov: 46, near: 0.5, far: 2400, position: [-210, 132, 232] }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <JourneyScene />
    </Canvas>
  );
}
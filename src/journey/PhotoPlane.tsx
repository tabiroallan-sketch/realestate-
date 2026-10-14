"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  activeBeat,
  kenBurnsScale,
  planeOpacity,
  planePose,
  weightsInto,
} from "@/journey/photoPlanes";
import { markPlaneReady } from "@/journey/ready";
import { journey } from "@/journey/store";
import { WAYPOINTS } from "@/journey/waypoints";

/** Authored beat parameters, read every frame — hoisted out of the render. */
const anchorTs = WAYPOINTS.map((waypoint) => waypoint.t);

let feather: THREE.CanvasTexture | null = null;

/**
 * The soft-edge mask shared by every photo plane.
 *
 * A hard-edged plane reads as a pasted card. A 6% feathered border dissolves the
 * photograph into whatever sits behind it, which is what lets a crossfade look
 * like a cut rather than two rectangles changing opacity.
 */
function featherTexture(): THREE.CanvasTexture {
  if (feather) return feather;

  const size = 128;
  const inset = size * 0.06;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (context) {
    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = Math.min(x, size - 1 - x);
        const dy = Math.min(y, size - 1 - y);
        const ramp = Math.max(0, Math.min(1, Math.min(dx, dy) / inset));
        const value = Math.round(255 * ramp);
        const index = (y * size + x) * 4;
        image.data[index] = value;
        image.data[index + 1] = value;
        image.data[index + 2] = value;
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }

  feather = new THREE.CanvasTexture(canvas);
  return feather;
}

type PhotoPlaneProps = {
  src: string;
  beatIndex: number;
  depth: number;
};

/**
 * One beat of the flight.
 *
 * Unlit by design: the photograph is the light. The material is transparent with
 * writing disabled and tone mapping off, so the frame is the source image, faded
 * by weight and the near-clip gate alone.
 */
export function PhotoPlane({ src, beatIndex, depth }: PhotoPlaneProps) {
  const reduced = useReducedMotion();

  const pose = useMemo(() => planePose(WAYPOINTS, beatIndex, depth), [beatIndex, depth]);

  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const failed = useRef(false);
  const weights = useRef(new Array(anchorTs.length).fill(0));

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      src,
      (texture) => {
        if (!active) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = materialRef.current;
        if (material) {
          material.map = texture;
          material.needsUpdate = true;
        }
        markPlaneReady();
      },
      undefined,
      () => {
        if (!active) return;
        failed.current = true;
        const mesh = meshRef.current;
        if (mesh) mesh.visible = false;
      },
    );

    return () => {
      active = false;
    };
  }, [src]);

  useFrame((state) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    const t = Math.max(0, Math.min(1, journey.progress.value));

    let weight: number;
    if (reduced) {
      weight = activeBeat(t, anchorTs) === beatIndex ? 1 : 0;
    } else {
      weight = weightsInto(t, anchorTs, weights.current)[beatIndex];
    }

    const opacity = planeOpacity(weight, state.camera.position.distanceTo(mesh.position));
    mesh.visible = !failed.current && material.map !== null && opacity > 0;
    if (!mesh.visible) return;

    material.opacity = opacity;
    mesh.scale.setScalar(kenBurnsScale(weight, reduced));
  });

  return (
    <mesh ref={meshRef} position={pose.position} visible={false} frustumCulled={false}>
      <planeGeometry args={[pose.width, pose.height]} />
      <meshBasicMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        toneMapped={false}
        alphaMap={featherTexture()}
        opacity={0}
      />
    </mesh>
  );
}

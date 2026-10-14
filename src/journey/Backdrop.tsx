"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { assets } from "@/data/assets";

/** Ink fallback — the page background, used when the poster cannot be drawn. */
const INK = "#0A0C0B";

const POSTER_SRC = `${assets.heroPoster.srcSetBase}-1376.webp`;

/**
 * The flight's backdrop.
 *
 * A photo-plane run has no sky, horizon or ground to sit against, so the whole
 * far field is one inverted sphere following the camera. The map is the hero
 * poster downscaled to 16×16: at r=800 the sphere is a colour field, and a
 * full-resolution texture would only cost decode time to render the same blur.
 */
export function Backdrop() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(image, 0, 0, 16, 16);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = materialRef.current;
      if (material) {
        material.color.set("#FFFFFF");
        material.map = texture;
        material.needsUpdate = true;
      }
    };

    image.onerror = () => {
      const material = materialRef.current;
      if (material) material.color.set(INK);
    };

    image.src = POSTER_SRC;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.copy(state.camera.position);
  });

  return (
    <mesh ref={meshRef} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[800, 32, 16]} />
      <meshBasicMaterial
        ref={materialRef}
        color={INK}
        side={THREE.BackSide}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

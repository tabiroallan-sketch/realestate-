"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { PALETTE } from "@/journey/environment/Sky";

/**
 * Context: the city Nairobi sits in.
 *
 * A single instanced box mesh. The blocks are placed on a ring beyond the site
 * so they never intersect the development, and their height distribution falls
 * off with distance so the skyline reads as a plain rather than a ring of
 * identical towers.
 */
export function City({ count = 420 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.ivoryDeep,
        roughness: 0.94,
        metalness: 0,
        // Slightly translucent so blocks behind read as atmospheric depth rather
        // than as a solid wall.
        transparent: true,
        opacity: 0.92,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();

    // Deterministic PRNG — a different skyline per visit would be a bug, and it
    // would desync SSR from the client.
    let seed = 20261005;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i += 1) {
      // Ring placement: 150m minimum keeps the site clear, 900m maximum puts
      // the far blocks well into the fog.
      const radius = 150 + Math.pow(random(), 0.65) * 750;
      const angle = random() * Math.PI * 2;

      position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      // Taller toward the middle distance, lower at the edges.
      const falloff = 1 - Math.min(1, (radius - 150) / 750);
      const height = 8 + random() * 46 * (0.35 + falloff * 0.65);

      scale.set(10 + random() * 26, height, 10 + random() * 26);

      // Sit the box on the ground plane.
      position.y = height / 2 - 2;

      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count]);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      name="city"
    />
  );
}

/**
 * Ground plane plus landscaped podium.
 *
 * The podium is what stops the towers looking like they float: a plinth with
 * reflecting pools, planted areas and a road edge. Kept as simple extruded
 * shapes because the camera only sees it obliquely from above and from the
 * entrance waypoint.
 */
export function Ground() {
  const materials = useMemo(
    () => ({
      ground: new THREE.MeshStandardMaterial({
        color: PALETTE.ground,
        roughness: 0.98,
        metalness: 0,
      }),
      podium: new THREE.MeshStandardMaterial({
        color: PALETTE.ivoryDeep,
        roughness: 0.88,
        metalness: 0.02,
      }),
      lawn: new THREE.MeshStandardMaterial({
        color: PALETTE.verdant,
        roughness: 1,
        metalness: 0,
      }),
      pool: new THREE.MeshStandardMaterial({
        color: "#4d7d86",
        roughness: 0.06,
        metalness: 0.5,
        // Pools read as reflective only if they pick up the sky, which a
        // standard material cannot do without an env map. High metalness plus
        // the analytic sky behind them is the cheaper approximation.
        envMapIntensity: 1.2,
      }),
    }),
    [],
  );

  useLayoutEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose());
    },
    [materials],
  );

  return (
    <group name="ground">
      {/* Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow={false}>
        <planeGeometry args={[3000, 3000, 1, 1]} />
        <primitive object={materials.ground} attach="material" />
      </mesh>

      {/* Podium plinth */}
      <mesh position={[4, 1.6, 0]} material={materials.podium}>
        <boxGeometry args={[104, 3.2, 62]} />
      </mesh>

      {/* Reflecting pool, set back from the road edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 3.25, 24]}>
        <planeGeometry args={[62, 9]} />
        <primitive object={materials.pool} attach="material" />
      </mesh>

      {/* Planted areas flanking the approach */}
      {[
        { position: [-36, 3.3, 18] as const, scale: [22, 0.3, 16] as const },
        { position: [44, 3.3, 18] as const, scale: [20, 0.3, 16] as const },
        { position: [4, 3.3, -22] as const, scale: [70, 0.3, 14] as const },
      ].map((lawn, index) => (
        <mesh key={index} position={lawn.position as unknown as [number, number, number]}>
          <boxGeometry args={lawn.scale as unknown as [number, number, number]} />
          <primitive object={materials.lawn} attach="material" />
        </mesh>
      ))}

      {/* Entrance colonnade — the threshold the camera passes through */}
      <group position={[-8, 0, 30]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[(i - 3) * 5.5, 6.5, 0]} material={materials.podium}>
            <boxGeometry args={[1.1, 6.4, 1.1]} />
          </mesh>
        ))}
        <mesh position={[0, 10.1, 0]} material={materials.podium}>
          <boxGeometry args={[36, 1.4, 3.2]} />
        </mesh>
      </group>
    </group>
  );
}
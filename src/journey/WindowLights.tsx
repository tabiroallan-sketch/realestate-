"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type TowerBounds = { x: number; z: number; w: number; d: number };

/**
 * Emissive window grid that fades in at dusk.
 *
 * One instanced mesh covers every tower: 3 towers × 22 storeys × 16 panes is
 * over a thousand quads in a single draw call. A material per window would be a
 * thousand draw calls and would visibly stall the frame on the transition.
 */
export function WindowLights({
  night,
  towers,
  storeys,
  bays,
  storeyHeight,
}: {
  night: React.RefObject<import("@/journey/useDayCycle").DayState>;
  towers: TowerBounds[];
  storeys: number;
  bays: number;
  storeyHeight: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        // White base so the per-instance tint reads at full strength, and
        // `vertexColors` so the instance colour attribute is actually sampled.
        // Without it Three ignores the attribute and every pane renders white.
        color: "#ffffff",
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: true,
      }),
    [],
  );

  const { geometry, count } = useMemo(() => {
    const perTower = storeys * bays;
    const total = towers.length * perTower;

    const pane = new THREE.PlaneGeometry(1, 1);
    const colors = new Float32Array(total * 3);

    for (let i = 0; i < total; i += 1) {
      // Deterministic pseudo-random: SSR and client must agree, and Math.random
      // would produce a different lit pattern on every render.
      const n = Math.sin(i * 12.9898) * 43758.5453;
      const variance = n - Math.floor(n);

      // Roughly a third of the windows stay dark — a fully lit facade is both
      // unrealistic and visually flatter.
      const lit = variance > 0.34 ? 1 : 0.08;
      colors[i * 3] = lit;
      colors[i * 3 + 1] = lit * 0.86;
      colors[i * 3 + 2] = lit * 0.66;
    }

    // An InstancedMesh attribute, not a geometry attribute: instancing reads
    // `instanceColor` off the mesh, so a geometry-level `color` is ignored.
    pane.setAttribute("instanceColor", new THREE.InstancedBufferAttribute(colors, 3));

    return { geometry: pane, count: total };
  }, [towers, storeys, bays]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const euler = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const transform = new THREE.Matrix4();

    const baysPerFace = Math.max(2, Math.floor(bays / 2));
    const paneWidth = 1.9;
    const paneHeight = storeyHeight * 0.54;

    let index = 0;

    for (const tower of towers) {
      for (let storey = 1; storey <= storeys; storey += 1) {
        const y = storey * storeyHeight + storeyHeight * 0.46;

        for (let face = 0; face < 2; face += 1) {
          // Face 0 is the south elevation the approach flies past; face 1 is the
          // east elevation seen from the balcony and rooftop waypoints.
          const along = face === 0 ? tower.w : tower.d;

          for (let bay = 0; bay < baysPerFace; bay += 1) {
            const t = (bay + 0.5) / baysPerFace;
            const offset = (t - 0.5) * along;

            if (face === 0) {
              position.set(tower.x + offset, y, tower.z + tower.d / 2 + 0.05);
              euler.set(0, 0, 0);
            } else {
              position.set(tower.x + tower.w / 2 + 0.05, y, tower.z + offset);
              euler.set(0, Math.PI / 2, 0);
            }

            quaternion.setFromEuler(euler);
            scale.set(along / baysPerFace / paneWidth, paneHeight, 1);
            transform.compose(position, quaternion, scale);
            mesh.setMatrixAt(index, transform);
            index += 1;
          }
        }
      }
    }

    mesh.count = index;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [towers, storeys, bays, storeyHeight]);

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  // Read through refs inside the frame loop: the material and the mesh are
  // mutable engine objects, not React state.
  const materialRef = useRef(material);

  useFrame(() => {
    const mesh = meshRef.current;
    const state = night.current;
    if (!mesh || !state) return;

    // Hidden by day: the panes are unlit then, and drawing them is pure overdraw.
    mesh.visible = state.lightsOn;
    // `transparent` is set on the material, so opacity now actually takes effect
    // and the panes fade up through dusk rather than snapping on.
    materialRef.current.opacity = state.night;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      name="window-lights"
    />
  );
}
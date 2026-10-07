"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { ellipsePerimeter } from "@/journey/TowerCluster";

type TowerBounds = { x: number; z: number; w: number; d: number; storeys: number };

/** Bays wrap the whole ellipse — every waypoint orbit sees lit windows. */
function baysFor(tower: TowerBounds): number {
  const a = tower.w / 2;
  const b = tower.d / 2;
  return Math.max(8, Math.round(ellipsePerimeter(a, b) / 2.9));
}

/**
 * Emissive window grid that fades in at dusk.
 *
 * One instanced mesh covers every tower — panes placed radially on the glazing
 * ellipse, a bay every ~2.9m of perimeter. A material per window would be a
 * thousand draw calls and would visibly stall the frame on the transition.
 */
export function WindowLights({
  night,
  towers,
  storeyHeight,
}: {
  night: React.RefObject<import("@/journey/useDayCycle").DayState>;
  towers: TowerBounds[];
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
    let total = 0;
    for (const tower of towers) total += tower.storeys * baysFor(tower);

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
  }, [towers]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const euler = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const transform = new THREE.Matrix4();

    // Sits just outside the glazing ring so the chord of each bay clears the
    // curve, and inside the balcony edge so the slab overhangs the pane.
    const paneRadius = 0.965;
    const paneHeight = 1.7;

    let index = 0;

    for (const tower of towers) {
      const bays = baysFor(tower);
      const a = (tower.w / 2) * paneRadius;
      const b = (tower.d / 2) * paneRadius;
      const paneWidth = (ellipsePerimeter(a, b) / bays) * 0.55;
      const bayAngle = (Math.PI * 2) / bays;

      for (let storey = 0; storey < tower.storeys; storey += 1) {
        const y = storey * storeyHeight + 1.75;

        for (let bay = 0; bay < bays; bay += 1) {
          const t = (bay + 0.5) * bayAngle;
          const cos = Math.cos(t);
          const sin = Math.sin(t);

          position.set(tower.x + a * cos, y, tower.z + b * sin);
          euler.set(0, Math.atan2(b * cos, a * sin), 0);
          quaternion.setFromEuler(euler);
          scale.set(paneWidth, paneHeight, 1);
          transform.compose(position, quaternion, scale);
          mesh.setMatrixAt(index, transform);
          index += 1;
        }
      }
    }

    mesh.count = index;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [towers, storeyHeight]);

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
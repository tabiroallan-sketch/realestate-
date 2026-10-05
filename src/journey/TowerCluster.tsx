"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { PALETTE } from "@/journey/environment/Sky";
import { STOREY_HEIGHT, TOWER_STOREYS } from "@/journey/waypoints";

/**
 * Site layout. Values are in metres with the development centred on the origin.
 *
 * The three towers are offset in depth as well as on X — a single row would
 * read as a wall from the approach waypoint. Tower C sits back and is the
 * tallest, which is what gives the cluster a silhouette rather than a profile.
 */
export const TOWERS = [
  { id: "A", x: -26, z: 0, w: 17, d: 15, storeys: TOWER_STOREYS, rotation: 0 },
  { id: "B", x: 6, z: -8, w: 20, d: 17, storeys: TOWER_STOREYS + 3, rotation: 0 },
  { id: "C", x: 34, z: 6, w: 16, d: 16, storeys: TOWER_STOREYS - 2, rotation: 0 },
] as const;

export type TowerSpec = (typeof TOWERS)[number];

/** Number of curved balcony bands per tower. The signature of the design. */
const BALCONIES_PER_FLOOR = 2;

/**
 * The procedural tower complex.
 *
 * Every tower is four instanced meshes — core, balcony bands, fins and a
 * parapet — rather than a mesh per floor. At 22 storeys × 3 towers a per-floor
 * approach is 200+ draw calls before anything else is in the scene; this is 12.
 *
 * Geometry is shared across all three towers and disposed on unmount.
 */
export function TowerCluster() {
  const balconyRef = useRef<THREE.InstancedMesh>(null);
  const finRef = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.InstancedMesh>(null);

  const materials = useMemo(
    () => ({
      // Board-formed ivory concrete: high roughness, no metalness.
      concrete: new THREE.MeshStandardMaterial({
        color: PALETTE.ivory,
        roughness: 0.82,
        metalness: 0.02,
      }),
      // Balcony reveals sit in shadow and read a shade deeper than the core.
      balcony: new THREE.MeshStandardMaterial({
        color: PALETTE.ivoryDeep,
        roughness: 0.74,
        metalness: 0.03,
      }),
      // Dark bronze anodised aluminium — the only genuinely specular surface.
      fin: new THREE.MeshStandardMaterial({
        color: PALETTE.bronzeDark,
        roughness: 0.34,
        metalness: 0.86,
      }),
      // Blue-tinted low-E glazing, double sided so interiors read correctly.
      glazing: new THREE.MeshStandardMaterial({
        color: PALETTE.glazing,
        roughness: 0.12,
        metalness: 0.42,
        side: THREE.DoubleSide,
      }),
    }),
    [],
  );

  const geometries = useMemo(
    () => ({
      core: new THREE.BoxGeometry(1, 1, 1),
      balcony: new THREE.BoxGeometry(1, 1, 1),
      fin: new THREE.BoxGeometry(1, 1, 1),
      glazing: new THREE.PlaneGeometry(1, 1),
    }),
    [],
  );

  // ---- Instance transforms ------------------------------------------------
  const transforms = useMemo(() => {
    const core: THREE.Matrix4[] = [];
    const balcony: THREE.Matrix4[] = [];
    const fin: THREE.Matrix4[] = [];

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();

    for (const tower of TOWERS) {
      const height = tower.storeys * STOREY_HEIGHT;

      // Core: the full mass of the tower, inset from the balcony line so the
      // bands read as projecting elements rather than as painted stripes.
      p.set(tower.x, height / 2, tower.z);
      s.set(tower.w * 0.86, height, tower.d * 0.86);
      m.compose(p, q, s);
      core.push(m.clone());

      // Balcony bands: the curved horizontal reveal that defines the design.
      // Two per floor at different depths, which is what produces the stepped
      // profile seen in the reference photography.
      for (let storey = 1; storey <= tower.storeys; storey += 1) {
        for (let band = 0; band < BALCONIES_PER_FLOOR; band += 1) {
          const y = storey * STOREY_HEIGHT + band * (STOREY_HEIGHT * 0.5) - 0.2;
          const inset = band === 0 ? 0 : -0.45;

          p.set(tower.x, y, tower.z + tower.d / 2 + inset);
          s.set(tower.w * (band === 0 ? 1.06 : 1.12), 0.34, 1.5 + band * 0.4);
          m.compose(p, q, s);
          balcony.push(m.clone());
        }
      }

      // Bronze fins: 480mm modules running the full height, on the sun-facing
      // elevations. These carry the vertical rhythm of the facade.
      const finSpacing = 2.4;
      const finsPerFace = Math.max(3, Math.floor(tower.w / finSpacing));

      for (let storey = 0; storey < tower.storeys; storey += 1) {
        const y = storey * STOREY_HEIGHT + STOREY_HEIGHT * 0.5;

        for (let f = 0; f < finsPerFace; f += 1) {
          const t = (f + 0.5) / finsPerFace;
          const x = tower.x + (t - 0.5) * tower.w * 0.86;

          // South face
          p.set(x, y, tower.z + tower.d / 2 + 0.62);
          s.set(0.16, STOREY_HEIGHT * 0.92, 0.9);
          m.compose(p, q, s);
          fin.push(m.clone());

          // East face
          p.set(tower.x + tower.w / 2 + 0.62, y, tower.z + (t - 0.5) * tower.d * 0.86);
          s.set(0.9, STOREY_HEIGHT * 0.92, 0.16);
          m.compose(p, q, s);
          fin.push(m.clone());
        }
      }
    }

    return { core, balcony, fin };
  }, []);

  // ---- Write transforms into the instanced meshes -------------------------
  useLayoutEffect(() => {
    const apply = (
      mesh: THREE.InstancedMesh | null,
      list: THREE.Matrix4[],
    ) => {
      if (!mesh) return;
      list.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
      mesh.count = list.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    apply(coreRef.current, transforms.core);
    apply(balconyRef.current, transforms.balcony);
    apply(finRef.current, transforms.fin);
  }, [transforms]);

  // ---- Dispose shared geometry and materials on unmount -------------------
  useLayoutEffect(
    () => () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      Object.values(materials).forEach((material) => material.dispose());
    },
    [geometries, materials],
  );

  return (
    <group name="tower-cluster">
      <instancedMesh
        ref={coreRef}
        args={[geometries.core, materials.concrete, Math.max(1, transforms.core.length)]}
        frustumCulled={false}
        castShadow={false}
        receiveShadow={false}
      />

      <instancedMesh
        ref={balconyRef}
        args={[geometries.balcony, materials.balcony, Math.max(1, transforms.balcony.length)]}
        frustumCulled={false}
      />

      <instancedMesh
        ref={finRef}
        args={[geometries.fin, materials.fin, Math.max(1, transforms.fin.length)]}
        frustumCulled={false}
      />

      {/* Glazing is a single merged plane pair per tower rather than instanced —
          it never animates, so the extra draw call buys simpler code. */}
      {TOWERS.map((tower) => {
        const height = tower.storeys * STOREY_HEIGHT;
        return (
          <group key={tower.id} position={[tower.x, 0, tower.z]}>
            <mesh
              geometry={geometries.glazing}
              material={materials.glazing}
              position={[0, height / 2, tower.d / 2 + 0.01]}
              scale={[tower.w * 0.98, height * 0.99, 1]}
            />
            <mesh
              geometry={geometries.glazing}
              material={materials.glazing}
              position={[tower.w / 2 + 0.01, height / 2, 0]}
              rotation={[0, Math.PI / 2, 0]}
              scale={[tower.d * 0.98, height * 0.99, 1]}
            />
          </group>
        );
      })}
    </group>
  );
}

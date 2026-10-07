"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { PALETTE } from "@/journey/environment/Sky";
import { STOREY_HEIGHT, TOWER_STOREYS } from "@/journey/waypoints";

/**
 * Site layout. Values are in metres with the development centred on the origin.
 *
 * The three towers are offset in depth as well as on X — a single row would
 * read as a wall from the approach waypoint. Tower B sits back and is the
 * tallest, which is what gives the cluster a silhouette rather than a profile.
 */
export const TOWERS = [
  { id: "A", x: -26, z: 0, w: 17, d: 15, storeys: TOWER_STOREYS, rotation: 0 },
  { id: "B", x: 6, z: -8, w: 20, d: 17, storeys: TOWER_STOREYS + 3, rotation: 0 },
  { id: "C", x: 34, z: 6, w: 16, d: 16, storeys: TOWER_STOREYS - 2, rotation: 0 },
] as const;

export type TowerSpec = (typeof TOWERS)[number];

/**
 * Upper podium: the curtain-walled plinth that ties the three towers into one
 * complex. It sits on the landscape plinth from `City.Ground` (top at 3.2m) and
 * the towers' ground storeys are buried inside it, so the facade rhythm starts
 * visually at `PODIUM.top`.
 */
export const PODIUM = {
  x: 4.5,
  z: -1.5,
  w: 81,
  d: 35,
  floor: 3.2,
  glassTop: 8.4,
  top: 9.6,
  finSpacing: 2.4,
} as const;

/**
 * Facade layer radii, as a fraction of the tower footprint. Each layer is an
 * elliptical cylinder around the core; the offsets are what makes the bands
 * read as projecting elements instead of painted stripes.
 */
const RADIUS = {
  core: 0.86,
  reveal: 0.9,
  glazing: 0.94,
  spandrel: 0.99,
  crown: 1.02,
  balcony: 1.07,
  fin: 1.05,
} as const;

/**
 * One storey's vertical stack, in metres above the floor line (3.6m total):
 * bronze spandrel at the floor line, a proud ivory balcony edge across the
 * base of the glazing, then a dark recessed reveal carrying to the next floor.
 * The alternation is the facade's banding rhythm — the reference photography's
 * strongest measurable signature.
 */
const STOREY_STACK = {
  spandrel: 0.55,
  glassFrom: 0.55,
  glassTo: 2.95,
  revealFrom: 2.95,
} as const;

/** Bronze fins: radial around the full ellipse, not just the sunlit faces. */
const FIN = { width: 0.45, depth: 0.8, spacing: 2.4 } as const;
const PODIUM_FIN = { width: 0.5, depth: 0.6 } as const;

/**
 * The shadow line between floors. Deliberately outside the ivory/bronze
 * palette and dark enough to classify as unlit structure: without shadow
 * maps, the reveal's colour is what carries the contrast between bands.
 */
const REVEAL_COLOR = "#37342e";

const CYLINDER_SEGMENTS = 48;

/** Ramanujan approximation — sub-metre at these eccentricities. */
export function ellipsePerimeter(a: number, b: number): number {
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

/**
 * The procedural tower complex.
 *
 * Six instanced meshes — core, spandrel, reveal, glazing, balcony edge, fins —
 * rather than a mesh per floor: at 67 storeys × 3 towers a per-floor approach
 * would be hundreds of draw calls before anything else entered the scene. All
 * four elevations carry the full facade treatment because every camera
 * waypoint orbits the cluster.
 *
 * Geometry is shared across all three towers and disposed on unmount.
 */
export function TowerCluster() {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const spandrelRef = useRef<THREE.InstancedMesh>(null);
  const revealRef = useRef<THREE.InstancedMesh>(null);
  const glazingRef = useRef<THREE.InstancedMesh>(null);
  const balconyRef = useRef<THREE.InstancedMesh>(null);
  const finRef = useRef<THREE.InstancedMesh>(null);

  const materials = useMemo(
    () => ({
      // Board-formed ivory concrete: high roughness, no metalness.
      concrete: new THREE.MeshStandardMaterial({
        color: PALETTE.ivory,
        roughness: 0.82,
        metalness: 0.02,
      }),
      reveal: new THREE.MeshStandardMaterial({
        color: REVEAL_COLOR,
        roughness: 0.9,
        metalness: 0.05,
      }),
      // Blue-tinted low-E glazing, double sided so interiors read correctly.
      glazing: new THREE.MeshStandardMaterial({
        color: PALETTE.glazing,
        roughness: 0.12,
        metalness: 0.42,
        side: THREE.DoubleSide,
      }),
      // Warm bronze floor-line spandrels. Kept mostly dielectric: with no
      // environment map a fully metallic surface renders near-black, and the
      // bronze has to survive the night waypoint's dim lighting.
      spandrel: new THREE.MeshStandardMaterial({
        color: PALETTE.bronze,
        roughness: 0.5,
        metalness: 0.1,
      }),
      // Ivory balcony slab edges — the bright line in each floor's rhythm.
      balcony: new THREE.MeshStandardMaterial({
        color: PALETTE.ivory,
        roughness: 0.7,
        metalness: 0.03,
      }),
      // Dark bronze anodised aluminium — the specular surface on the fins.
      fin: new THREE.MeshStandardMaterial({
        color: PALETTE.bronzeDark,
        roughness: 0.45,
        metalness: 0.15,
      }),
    }),
    [],
  );

  const geometries = useMemo(
    () => ({
      core: new THREE.CylinderGeometry(0.5, 0.5, 1, CYLINDER_SEGMENTS, 1, false),
      ring: new THREE.CylinderGeometry(0.5, 0.5, 1, CYLINDER_SEGMENTS, 1, true),
      box: new THREE.BoxGeometry(1, 1, 1),
    }),
    [],
  );

  // ---- Instance transforms ------------------------------------------------
  const transforms = useMemo(() => {
    const core: THREE.Matrix4[] = [];
    const spandrel: THREE.Matrix4[] = [];
    const reveal: THREE.Matrix4[] = [];
    const glazing: THREE.Matrix4[] = [];
    const balcony: THREE.Matrix4[] = [];
    const fin: THREE.Matrix4[] = [];

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();

    const ring = (
      list: THREE.Matrix4[],
      tower: TowerSpec,
      y: number,
      height: number,
      k: number,
    ) => {
      p.set(tower.x, y, tower.z);
      q.identity();
      s.set(tower.w * k, height, tower.d * k);
      m.compose(p, q, s);
      list.push(m.clone());
    };

    for (const tower of TOWERS) {
      const height = tower.storeys * STOREY_HEIGHT;

      // Core: the full mass of the tower, closed at the roof so the aerial
      // waypoint looks down onto a real top rather than into a hollow tube.
      p.set(tower.x, height / 2, tower.z);
      q.identity();
      s.set(tower.w * RADIUS.core, height, tower.d * RADIUS.core);
      m.compose(p, q, s);
      core.push(m.clone());

      // The facade stack, wrapping every elevation.
      for (let storey = 0; storey < tower.storeys; storey += 1) {
        const floor = storey * STOREY_HEIGHT;
        ring(spandrel, tower, floor + STOREY_STACK.spandrel / 2, STOREY_STACK.spandrel, RADIUS.spandrel);
        ring(
          glazing,
          tower,
          floor + (STOREY_STACK.glassFrom + STOREY_STACK.glassTo) / 2,
          STOREY_STACK.glassTo - STOREY_STACK.glassFrom,
          RADIUS.glazing,
        );
        ring(
          reveal,
          tower,
          floor + (STOREY_STACK.revealFrom + STOREY_HEIGHT) / 2,
          STOREY_HEIGHT - STOREY_STACK.revealFrom,
          RADIUS.reveal,
        );
        ring(
          balcony,
          tower,
          floor + STOREY_STACK.glassFrom + 0.225,
          0.45,
          RADIUS.balcony,
        );
      }

      // Crown: a bronze parapet band capping the stack.
      ring(spandrel, tower, height - 0.7, 1.4, RADIUS.crown);

      // Bronze fins: full-height blades radial around the ellipse, emerging
      // above the podium. Vertical rhythm on every side, not just south+east.
      const finHeight = height - PODIUM.top;
      const a = (tower.w / 2) * RADIUS.fin;
      const b = (tower.d / 2) * RADIUS.fin;
      const finCount = Math.max(8, Math.round(ellipsePerimeter(a, b) / FIN.spacing));

      for (let i = 0; i < finCount; i += 1) {
        const t = ((i + 0.5) / finCount) * Math.PI * 2;
        const cos = Math.cos(t);
        const sin = Math.sin(t);

        p.set(tower.x + a * cos, PODIUM.top + finHeight / 2, tower.z + b * sin);
        // Outward normal of an ellipse at parameter t is ∝ (b·cos t, a·sin t).
        e.set(0, Math.atan2(b * cos, a * sin), 0);
        q.setFromEuler(e);
        s.set(FIN.width, finHeight, FIN.depth);
        m.compose(p, q, s);
        fin.push(m.clone());
      }
    }

    // Podium colonnade: bronze fins wrapping all four faces of the plinth.
    const halfW = PODIUM.w / 2;
    const halfD = PODIUM.d / 2;
    const podiumFinHeight = PODIUM.top - 0.6 - PODIUM.floor - 0.2;
    const podiumFinY = PODIUM.floor + 0.2 + podiumFinHeight / 2;
    const edges = [
      { axis: "x" as const, fix: PODIUM.z - halfD, from: PODIUM.x - halfW, to: PODIUM.x + halfW, nx: 0, nz: -1 },
      { axis: "z" as const, fix: PODIUM.x + halfW, from: PODIUM.z - halfD, to: PODIUM.z + halfD, nx: 1, nz: 0 },
      { axis: "x" as const, fix: PODIUM.z + halfD, from: PODIUM.x + halfW, to: PODIUM.x - halfW, nx: 0, nz: 1 },
      { axis: "z" as const, fix: PODIUM.x - halfW, from: PODIUM.z + halfD, to: PODIUM.z - halfD, nx: -1, nz: 0 },
    ];

    for (const edge of edges) {
      const length = Math.abs(edge.to - edge.from);
      const edgeFins = Math.max(3, Math.round(length / PODIUM.finSpacing));

      for (let i = 0; i < edgeFins; i += 1) {
        const u = edge.from + ((i + 0.5) / edgeFins) * (edge.to - edge.from);
        if (edge.axis === "x") p.set(u, podiumFinY, edge.fix);
        else p.set(edge.fix, podiumFinY, u);
        e.set(0, Math.atan2(edge.nx, edge.nz), 0);
        q.setFromEuler(e);
        s.set(PODIUM_FIN.width, podiumFinHeight, PODIUM_FIN.depth);
        m.compose(p, q, s);
        fin.push(m.clone());
      }
    }

    return { core, spandrel, reveal, glazing, balcony, fin };
  }, []);

  // ---- Write transforms into the instanced meshes -------------------------
  useLayoutEffect(() => {
    const apply = (mesh: THREE.InstancedMesh | null, list: THREE.Matrix4[]) => {
      if (!mesh) return;
      list.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
      mesh.count = list.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };

    apply(coreRef.current, transforms.core);
    apply(spandrelRef.current, transforms.spandrel);
    apply(revealRef.current, transforms.reveal);
    apply(glazingRef.current, transforms.glazing);
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
      />

      <instancedMesh
        ref={spandrelRef}
        args={[geometries.ring, materials.spandrel, Math.max(1, transforms.spandrel.length)]}
        frustumCulled={false}
      />

      <instancedMesh
        ref={revealRef}
        args={[geometries.ring, materials.reveal, Math.max(1, transforms.reveal.length)]}
        frustumCulled={false}
      />

      <instancedMesh
        ref={glazingRef}
        args={[geometries.ring, materials.glazing, Math.max(1, transforms.glazing.length)]}
        frustumCulled={false}
      />

      <instancedMesh
        ref={balconyRef}
        args={[geometries.ring, materials.balcony, Math.max(1, transforms.balcony.length)]}
        frustumCulled={false}
      />

      <instancedMesh
        ref={finRef}
        args={[geometries.box, materials.fin, Math.max(1, transforms.fin.length)]}
        frustumCulled={false}
      />

      {/* Podium curtain wall under an ivory capping slab. */}
      <mesh
        material={materials.glazing}
        position={[PODIUM.x, (PODIUM.floor + PODIUM.glassTop) / 2, PODIUM.z]}
      >
        <boxGeometry args={[PODIUM.w, PODIUM.glassTop - PODIUM.floor, PODIUM.d]} />
      </mesh>

      <mesh
        material={materials.concrete}
        position={[PODIUM.x, (PODIUM.glassTop + PODIUM.top) / 2, PODIUM.z]}
      >
        <boxGeometry args={[PODIUM.w + 1.6, PODIUM.top - PODIUM.glassTop, PODIUM.d + 1.6]} />
      </mesh>
    </group>
  );
}

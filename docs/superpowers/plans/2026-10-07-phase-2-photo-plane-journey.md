# Phase 2 Photo-Plane Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Phase 2's procedural exterior scene with the 14 provided assets shown as FOV-fitted full-frame planes flown through by the existing camera rig.

**Architecture:** `JourneyScene` keeps `AdaptiveQuality` + `CameraRig` and swaps every visible surface for photo/video planes anchored along the waypoint path, with a camera-following backdrop sphere textured by a runtime-downscaled copy of the active photo. Plane fades are pure functions of scroll progress (the same value the camera damps toward), so verification is a node script over the math plus an image gate comparing captures to their source photos.

**Tech Stack:** Next.js 16, React 19, three 0.186, R3F 9.8, TypeScript, Playwright, sharp (existing verify-script stack).

**Spec:** `docs/superpowers/specs/2026-10-07-phase-2-photo-plane-journey-design.md`

## Global Constraints

- Fit: `height = 2 · d · tan(fov/2) · 1.03` (3% overfill margin), `width = height · aspect`, fov/position/target interpolated between bracketing waypoints (`fitAnchorAt`); all assets are 16:9 so aspect is 16/9.
- Crossfade: across leg `[A,B]`, `s = smoothstep(A + 0.4·(B−A), B − 0.4·(B−A), t)`; outgoing opacity `1−s`, incoming `s`. Coverage must satisfy `sum(opacities) ≥ 0.999` for every `t ∈ [0,1]`.
- Reduced motion: planes hard-cut — opacity is `1` only inside the beat's Voronoi cell over beat anchors; video beat renders `heroPoster` texture; Ken Burns off.
- Ken Burns: `scale = 1 + 0.04 · smoothstep(prevAnchor, nextAnchor, t)`.
- Near-clip safety: opacity `*= smoothstep(2, 6, cameraDistance)`.
- Backdrop: sphere `r = 800`, copies camera **position only** each frame, 16×16 downscale of the two active sources mixed by the same `s`, `--ink` tint on load failure.
- Materials: unlit, `transparent`, `depthWrite: false`, `toneMapped: false`, feathered alpha border = 6% of plane size.
- Strip from render tree but keep files on disk: `Sky`, `Atmosphere`, `City`, `Ground`, `TowerCluster`, `WindowLights`, and the `useDayCycle()` call in `JourneyScene`.
- New gate thresholds: photo-match (downscaled luminance correlation) ≥ **0.8** for the four still pairs; aerial pair (live video vs poster) ≥ **0.5**; coverage = each corner patch source-correlation ≥ **0.5** and mean luma > **12**.
- `waypoints.ts` field order (`id, position, target, fov, t, label`) must not change — `journey.mjs` regex depends on it.
- No new runtime dependencies. Asset URLs come from `assets[key].srcSetBase + "-1376.webp"` and `heroVideo.mp4`.

## Review Focus

1. **A texture 404s mid-journey** — plane must hide itself and the run must stay error-free; most likely first at a typo'd asset key. Pinned by `scripts/verify-plane-resilience.mjs` (aborts one `.webp` route, asserts zero console/page errors).
2. **Browser autoplay policy blocks the video** — WP01 would render blank. Pinned by the resilience script's `readyState ≥ 2` assertion at `t=0`.
3. **Crossfade windows leave a gap** — backdrop-only stretch where a photo should be. Pinned by `scripts/verify-plane-math.mjs`'s `sum ≥ 0.999` sweep.
4. **Reduced motion still cross-fades** — planes must step-cut with the snapped camera. Pinned by `verify-plane-math`'s reduced-mode cell assertions and the existing `journey.mjs` reduced context.
5. **Gate false-red on the video waypoint** — a live video frame will never match the poster still at 0.8. Pinned by the aerial pair's own ≥0.5 threshold in the gate rewrite.

---

## File Structure

| File | Responsibility |
|---|---|
| Create: `src/journey/photoPlanes.ts` | Pure data + math: beat list, `fitAnchorAt`, `fitRect`, `planePose`, `planeOpacities`, `kenBurnsScale`. No THREE, no React — node-importable for tests. |
| Create: `src/journey/PhotoPlane.tsx` | R3F mesh for photo beats: imperative texture load, fit, feather, per-frame opacity/Ken Burns/near-fade. |
| Create: `src/journey/VideoPlane.tsx` | WP01: video texture, loop/muted/playsInline, poster still under reduced motion. |
| Create: `src/journey/Backdrop.tsx` | Camera-following sphere, two blurred textures mixed by `s`, ink fallback. |
| Create: `scripts/verify-plane-math.mjs` | Node assertions over `photoPlanes.ts` (fit numbers, coverage sum, reduced cells). |
| Create: `scripts/verify-plane-resilience.mjs` | Playwright: abort one texture, sweep `t`, assert clean + video ready. |
| Modify: `src/journey/JourneyScene.tsx` | Strip procedural components, mount backdrop + planes. |
| Modify: `scripts/compare-reference.mjs` | Retire palette/band gate; add photo-match + coverage gate. |
| Modify: `scripts/capture-reference.mjs` | Only if a wait-for-plane/video step is needed (Task 6 verifies). |
| Modify: `plan.md` | Record the remake and the gate swap (Task 7). |

---

### Task 1: Plane math module

**Files:**
- Create: `src/journey/photoPlanes.ts`
- Test: `scripts/verify-plane-math.mjs`

**Interfaces:**
- Consumes: waypoint data **passed as an argument** — the module has zero imports (node-runs-verified constraint: `.ts → ./waypoints` extensionless fails Node ESM, `.ts` extensions fail `tsc` without `allowImportingTsExtensions`).
  - `type AnchorLike = { position: [number,number,number]; target: [number,number,number]; fov: number; t: number }`
- Produces (everything later tasks use):
  - `type PlaneBeat = { id: string; kind: "video" | "photo"; assetKey: string; anchorT: number; depth: number }`
  - `const PLANE_BEATS: PlaneBeat[]` — anchors `0, .14, .30, .44×2, .58, .64, .70, .82×2, .91, 1` per spec mapping; depths: default `90`, deeper lobby/rooftop planes `130`, entrance `70`.
  - `fitAnchorAt(waypoints: AnchorLike[], t: number): { position: [number,number,number]; target: [number,number,number]; fov: number }` — lerp between bracketing entries by `t`.
  - `fitRect(fovDeg: number, distance: number, aspect: number): { width: number; height: number }`
  - `planePose(waypoints: AnchorLike[], beat: PlaneBeat): { position: [number,number,number]; lookAt: [number,number,number] }` — `position + normalize(target−position) · depth`.
  - `planeOpacities(t: number, reduced: boolean): Record<string, number>` — Global Constraints' crossfade rule; `Record` covers every `PLANE_BEATS` id.
  - `kenBurnsScale(t: number, reduced: boolean): number` — `1` when reduced.
  - `backdropMix(t: number): { index: number; nextIndex: number; s: number }` — which two beats blend for the backdrop.
  - Callers (`PhotoPlane`, `VideoPlane`, `Backdrop`) pass `WAYPOINTS` themselves.

- [ ] **Step 1: Write the failing test**

`scripts/verify-plane-math.mjs` (plain `node:assert/strict`, run with `node scripts/verify-plane-math.mjs`):

```js
import assert from "node:assert/strict";
import { WAYPOINTS } from "../src/journey/waypoints.ts";
import { PLANE_BEATS, fitAnchorAt, fitRect, planeOpacities, kenBurnsScale } from "../src/journey/photoPlanes.ts";

// fit: waypoint aerial fov 40, d 90, 16:9
const r = fitRect(40, 90, 16 / 9);
assert.ok(Math.abs(r.height - 2 * 90 * Math.tan((40 * Math.PI) / 360) * 1.03) < 1e-9);
assert.ok(Math.abs(r.width - r.height * (16 / 9)) < 1e-9);

// anchor interpolation: t=0.44 is exactly the lobby waypoint
const a = fitAnchorAt(WAYPOINTS, 0.44);
assert.deepEqual(a, { position: [10, 6, 20], target: [4, 6, -6], fov: 38 });

// coverage: sum of opacities never leaves a hole
for (let t = 0; t <= 1.0001; t += 0.005) {
  const ops = Object.values(planeOpacities(t, false));
  const sum = ops.reduce((a, b) => a + b, 0);
  assert.ok(sum >= 0.999, `coverage hole at t=${t.toFixed(3)} sum=${sum}`);
}

// anchors: at t=0 the video beat alone is fully visible
assert.equal(planeOpacities(0, false)["video-aerial"], 1);

// reduced motion: exactly one beat visible per t (step cut, no blend)
for (let t = 0; t <= 1.0001; t += 0.01) {
  const visible = Object.entries(planeOpacities(t, true)).filter(([, o]) => o === 1);
  assert.equal(visible.length, 1, `t=${t.toFixed(2)} visible=${visible.map(([k]) => k)}`);
}

assert.equal(kenBurnsScale(0.5, true), 1);
console.log("plane math green");
```

(Node prints a harmless `MODULE_TYPELESS_PACKAGE_JSON` warning on `.mjs → .ts` imports — expected; the `.ts` extensions above are required and were verified against this Node version.)

(Beat ids in the assertions: `video-aerial` plus photo ids named in `PLANE_BEATS` — keep ids lowercase-kebab; the reduced-cell check requires exactly one `1` at every sample, including where cells meet, so cells must be half-open — implement as "closest anchor wins, ties go to the earlier beat".)

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/verify-plane-math.mjs`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `src/journey/photoPlanes.ts`**

Data + pure functions per the Interfaces block. Crossfade per Global Constraints; `fitAnchorAt` lerps `position`, `target`, `fov` between the bracketing entries. **The module must have zero import statements** — it defines `AnchorLike` locally (structural type, no `import type`), which is what makes it loadable by both `tsc`/Next and bare Node.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/verify-plane-math.mjs`
Expected: `plane math green`

- [ ] **Step 5: Commit**

```bash
git add src/journey/photoPlanes.ts scripts/verify-plane-math.mjs
git commit -m "feat: photo-plane fit and crossfade math"
```

---

### Task 2: PhotoPlane component

**Files:**
- Create: `src/journey/PhotoPlane.tsx`

**Interfaces:**
- Consumes: Task 1 exports — `planePose(WAYPOINTS, beat)`, `fitAnchorAt(WAYPOINTS, t)`, `fitRect(...)`, `planeOpacities(t, reduced)`, `kenBurnsScale(t, reduced)` (callers pass `WAYPOINTS`); `journey` store (`journey.progress.value: number`); `useReducedMotion` hook; asset URL `${assets[key].srcSetBase}-1376.webp`.
- Produces: `<PhotoPlane beat={PlaneBeat} url={string} />` — a `<mesh>` rendering `geometry plane(1,1)` scaled by `fitRect`, imperative texture load (hidden `Image` + `TextureLoader`-style load in `useEffect`), `onError → url state null → render null`.

- [ ] **Step 1: Implement `PhotoPlane` per the Interfaces block**

Key decisions already made: feather alphaMap is a lazily created singleton 256×144 canvas (white interior, transparent outer 6% border); `useFrame` reads `journey.progress.value`, writes `material.opacity` and `mesh.scale`; near-fade multiplies opacity; Ken Burns multiplies `mesh.scale` by `kenBurnsScale`; no `Suspense` — the plane renders nothing until its texture resolves.

- [ ] **Step 2: Build and lint**

Run: `npm run build && npm run lint`
Expected: green (R3F components have no unit harness in this repo — the canvas-level proofs are Tasks 5–6).

- [ ] **Step 3: Commit**

```bash
git add src/journey/PhotoPlane.tsx
git commit -m "feat: fitted PhotoPlane with progress-driven fades"
```

---

### Task 3: VideoPlane component

**Files:**
- Create: `src/journey/VideoPlane.tsx`

**Interfaces:**
- Consumes: Task 1 exports; `heroVideo.mp4`; `heroPoster` asset URL (still fallback).
- Produces: `<VideoPlane beat={PlaneBeat} />` — same pose/fit/opacity machinery as `PhotoPlane`, texture from a DOM `<video muted loop playsInline autoplay>` created in `useEffect`; when `useReducedMotion()` is true the texture is the `heroPoster` `.webp` and the video element is not created.

- [ ] **Step 1: Implement `VideoPlane`**
- [ ] **Step 2: Build and lint** — `npm run build && npm run lint`, expected green.
- [ ] **Step 3: Commit**

```bash
git add src/journey/VideoPlane.tsx
git commit -m "feat: video plane for the aerial waypoint"
```

---

### Task 4: Backdrop

**Files:**
- Create: `src/journey/Backdrop.tsx`

**Interfaces:**
- Consumes: `backdropMix(t)` from Task 1; `PLANE_BEATS` + same URL-building rule for sources; `useReducedMotion` (reduced → mix at `index === nextIndex`, i.e. nearest cell only).
- Produces: `<Backdrop />` — `<mesh><sphereGeometry args={[800, 32, 16]} />` with `side={THREE.BackSide}`, `ShaderMaterial` uniforms `{ texA, texB, mixFactor }`, `depthWrite: false`, `toneMapped: false`; `useFrame` copies `camera.position` to the mesh and updates uniforms from `backdropMix`; each source downscaled to 16×16 via canvas → `CanvasTexture`; failed source → uniform-free flat `color` uniform set to `#0A0C0B` for that side.

- [ ] **Step 1: Implement `Backdrop`**
- [ ] **Step 2: Build and lint** — `npm run build && npm run lint`, expected green.
- [ ] **Step 3: Commit**

```bash
git add src/journey/Backdrop.tsx
git commit -m "feat: image-derived backdrop sphere"
```

---

### Task 5: Rewire JourneyScene + resilience proof

**Files:**
- Modify: `src/journey/JourneyScene.tsx` (remove `Sky`, `Atmosphere`, `City`, `Ground`, `TowerCluster`, `WindowLights`, `useDayCycle` imports/calls; add `<Backdrop />` then `PLANE_BEATS.map(beat => beat.kind === "video" ? <VideoPlane …/> : <PhotoPlane …/>)`)
- Test: `scripts/verify-plane-resilience.mjs`

**Interfaces:**
- Consumes: Tasks 1–4 components; asset URL rule.
- Produces: scene tree exactly as spec'd; resilience script runnable via `node scripts/verify-plane-resilience.mjs` (server on :3000 required).

- [ ] **Step 1: Write the failing resilience test**

`scripts/verify-plane-resilience.mjs`, modeled on `journey.mjs`'s launch args (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`), viewport 1440×900:

```js
// route: abort one rooftop photo webp; goto http://localhost:3000/?journeyProbe=1
// for t of [0,.14,.30,.44,.58,.64,.70,.82,.91,1]:
//   window.__forceProgress(t); await 400ms
// assertions:
//   consoleErrors.length === 0 && pageErrors.length === 0
//   document video: readyState >= 2
//   final canvas fingerprint (clip screenshot of [data-journey-canvas] canvas).length > 20000
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/verify-plane-resilience.mjs`
Expected: FAIL (scene still procedural, or script errors on missing seam).

- [ ] **Step 3: Rewire `JourneyScene`**

Strip per Global Constraints (files stay on disk). Keep `AdaptiveQuality`, `CameraRig`, `useScrollProgress`, `usePointerParallax`, `useFrameloopGate`, `useSkylineCount` removal optional (its consumer `City` is gone — remove it too). Render order: `Backdrop` first, then planes.

- [ ] **Step 4: Run resilience + journey**

Run: `node scripts/verify-plane-resilience.mjs` → expected: all assertions pass.
Run: `node scripts/journey.mjs` → expected: `phase 2 journey probe green` (frame painted, hashes change, reduced context green, waypoint accuracy ≤ 1u).

- [ ] **Step 5: Commit**

```bash
git add src/journey/JourneyScene.tsx scripts/verify-plane-resilience.mjs
git commit -m "feat: journey scene rendered from photo planes"
```

---

### Task 6: Gate rewrite → capture → green

**Files:**
- Modify: `scripts/compare-reference.mjs` (replace `columnTops`/`runs`/`bandPitch`/`palette` gate section with photo-match + coverage; keep `PAIRS`, `composite`, CLI)
- Modify: `scripts/compare-reference.mjs` `PAIRS`: `night` stamp → `20261005095607` (facade, per mapping); `aerial.ref` → `scripts/generated/…` no — aerial's source is the video poster at `public/assets/video/hero-aerial-poster.webp` (absolute route `/assets/video/hero-aerial-poster.webp` resolved against `ROOT/public`); every other pair keeps its stamp lookup.
- Modify: `scripts/capture-reference.mjs` only if captures fire before textures settle — verified by Step 3.

**Interfaces:**
- Consumes: captures from `capture-reference.mjs` (5 PNGs), sources from `image/` + video poster, `sharp`.
- Produces: `node scripts/compare-reference.mjs --gate` exit 0/1 with lines `PASS/FAIL <pair> photo-match — got N.NN` and `PASS/FAIL <pair> coverage — got …`.

- [ ] **Step 1: Rewrite the measurement + gate**

`analyse(file)` → downscale to 96×54 luminance; photo-match = Pearson correlation vs same-size source luminance; coverage = for each of 4 corners a 24×24 patch: correlation with source corner ≥ 0.5 AND mean luma > 12. Gate: four still pairs ≥ 0.8 photo-match, aerial ≥ 0.5, all five pairs pass coverage. Composite keeps rendering cap-over-source side-by-sides.

- [ ] **Step 2: Capture**

Run: server on :3000, then `node scripts/capture-reference.mjs`
Expected: 5 frames. If the aerial frame is a black/blank video frame, add a "wait for `readyState ≥ 2` / settle" step to the capture script and re-run.

- [ ] **Step 3: Gate — expect RED first, then iterate**

Run: `node scripts/compare-reference.mjs --gate`
Expected: initially FAIL on mismatches; fix **fit constants only** (depths, `fitAnchorAt` lerp, margin) — never the thresholds — until:

```
PASS approach photo-match / entrance / rooftop / night / aerial
PASS all coverage
reference gate green
```

- [ ] **Step 4: Commit**

```bash
git add scripts/compare-reference.mjs scripts/capture-reference.mjs scripts/screenshots/reference/
git commit -m "test: photo-match and coverage gate for the plane journey"
```

---

### Task 7: Full verification + plan.md record

- [ ] **Step 1: Full suite**

```
npm run verify            # anchors · typecheck · lint · build
# restart the :3000 server AFTER the build (build under a live server corrupts its assets)
node scripts/journey.mjs
node scripts/verify-plane-math.mjs
node scripts/verify-plane-resilience.mjs
node scripts/capture-reference.mjs && node scripts/compare-reference.mjs --gate
```
Expected: every command green.

- [ ] **Step 2: Update `plan.md`**

Status line → Phase 2 photo-plane remake complete (gate green). In the Phase 2 section: record that the procedural gate is retired and replaced by photo-match/coverage; note stripped-but-retained modules (`Sky`, `Atmosphere`, `City`, `Ground`, `TowerCluster`, `WindowLights`) awaiting Phase 5; link the spec.

- [ ] **Step 3: Commit**

```bash
git add plan.md
git commit -m "docs: record Phase 2 photo-plane remake and new gate"
```

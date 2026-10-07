# Phase 3 — Cinematic story

Seven interior story chapters with camera transitions between all waypoints, and interior
3-plane assemblies behind the DOM narrative.

**Gate: each chapter's camera lands within 1 unit of its authored waypoint; each interior
assembly renders and is framed by the camera that reaches it; desktop + mobile + reduced
motion + no-WebGL + console clean.**

---

## 1. The blocking defect found in pre-flight

`CameraRig` samples both curves with `curve.getPointAt(t)`. `getPointAt` is **arc-length**
parameterised: it walks the polyline at constant speed, so `u` means "fraction of total
path distance". But `WAYPOINTS[].t` is **waypoint** parameter: it means "how far through
the authored sequence". Those two agree only if the segments happen to be equal length.

They are not. Measured against the authored values:

| waypoint | authored `t` | camera stands this far from it |
|---|---|---|
| aerial | 0.00 | 0.0 units |
| approach | 0.14 | 10.2 units |
| entrance | 0.30 | 36.8 units |
| lobby | 0.44 | 12.0 units |
| apartment | 0.58 | 53.6 units |
| **balcony** | 0.70 | **136.8 units** |
| **rooftop** | 0.82 | **154.0 units** |
| night | 0.91 | 88.4 units |
| masterplan | 1.00 | 0.0 units |

Maximum drift 20.4% of the journey. The two long final segments (`rooftop→night` 138 units,
`night→masterplan` 159 units) are compressed into the last 18% of scroll budget, while the
short `lobby→apartment→balcony` interior run gets 40% of the scroll to cover 55 units.

`getPointAt` was almost certainly chosen to keep camera speed constant, which is a real
instinct. It is the wrong trade here: constant speed means the camera races through the
long exterior pull-backs and crawls through the interiors, and it silently discards the
authored `t` weights — the uneven spacing is a deliberate art-direction decision recorded in
`waypoints.ts`, and `getPointAt` throws it away without saying so.

**Decision:** switch to `getPoint` behind an explicit `authoredToU()` remap that preserves
the authored weights. Verified: the camera now lands **0.000 units** from all nine
waypoints, and the flight never dips below `y = 2.3` so it does not tunnel through the
podium. Task 1.

---

## 2. Task breakdown

Each task is RED→GREEN against a named verification command. All commands run against a
production build on `:3000`.

### Task 1 — Camera lands where the data says
**Red:** extend `scripts/journey.mjs` with a waypoint-accuracy assertion that reads the camera
position out of the live scene at each of the nine authored `t` values and asserts the
distance to the authored waypoint is < 1 unit. It must fail at balcony/rooftop/night.
**Green:** `authoredToU()` in `waypoints.ts`, `getPointAt` → `getPoint` in `CameraRig`, FOV
stops keyed off authored `t` unchanged.
**Verify:** `npm run verify:journey`

Ruling: FOV keeps interpolating on authored `t` — it already does, via `fovAt`, which is
independent of curve sampling and needs no change. Cost if wrong: a 1-frame FOV pop at
segment boundaries, invisible under `easeInOutSine`.

### Task 2 — Chapter identity from scroll, not from geometry
**Red:** assert in the probe that `journey.progress.chapter` changes as the scroll crosses
chapter boundaries. `progress.chapter` is declared in `store.ts` and **written by nothing** —
it is initialised to `"hero"`, reset to `"hero"`, and never updated. Dead field today.
**Green:** a `CHAPTER_T: Record<string, number>` table beside the existing (also dead)
`CHAPTER_WAYPOINT`, plus a pure `chapterAt(t)` helper. `useScrollProgress`'s `onUpdate` writes
`journey.progress.chapter = chapterAt(self.progress)`.
**Verify:** `npm run verify:journey`

Ruling: derive the chapter from the canvas trigger's own progress (`self.progress`), not from
`useScrollPosition`'s viewport-centre DOM hit-test. Two different quantities: the latter is
whole-document progress and would drift out of sync with the flight. Cost if wrong: an
assembly fades at the wrong scroll depth.

### Task 3 — The 3-plane interior primitive
**Red:** probe asserts an assembly group named `interior-*` exists in the scene graph and that
at least one interior chapter's frame hash is distinct from its exterior neighbour's.
**Green:** `InteriorAssembly` — a reusable component taking a waypoint id, a palette, and
three depth-layered plane groups (near / mid / far) with per-plane opacity and parallax
depth, following the existing instancing idiom from `TowerCluster` and `WindowLights`:
`args={[memoGeometry, memoMaterial, count]}`, matrices via `useLayoutEffect`, per-frame writes
only through refs, explicit `dispose()`, deterministic pseudo-random only (never
`Math.random`), `frustumCulled={false}`.
**Verify:** `npm run verify:journey`

Ruling: build the primitive on instanced meshes with per-instance `instanceColor` rather than
loading texture assets. The brief supplies 14 JPEGs and they are photography of *different*
buildings — using them as interior backdrops would put the reference photos behind the
procedural geometry and reintroduce the exact mismatch risk 1 warns about. Flat-shaded
instanced planes stay consistent with the art direction and cost no bytes.
Cost if wrong: interiors read more abstract than photographic.

### Task 4 — Seven assemblies, one per story beat
Development · Entrance · Lobby · Residence · Living Room · Balcony · Rooftop. Each gets its
own waypoint, palette, plane layout and camera framing. Assembly visibility is driven by
`chapterAt(t)` with a fade window around each chapter's `t`, so only the live assembly is
drawn.
**Verify:** `npm run verify:journey` + `npm run verify:anchors`

Ruling: two of the seven beats (Entrance, Living Room) have no DOM `<section>` and Living Room
has no dedicated waypoint. I am **not** adding navigation chapters — `plan.md` deliberately
merges these beats into adjacent sections, and `scripts/verify-anchors.mjs` treats the 13
chapters as a fixed contract. The beats get 3D presence and camera work; the DOM narrative
continues to carry them under the merged sections. Cost if wrong: a beat with 3D but no
dedicated prose.

### Task 5 — Camera transitions compose with the assemblies
Each interior waypoint gets authored FOV and target values chosen so the frame reads:
lobby 38° wide, apartment 34° long-lens to compress depth, balcony 48° to open onto the city
reveal, rooftop 50° for the vertical rise. Verified by fingerprint at every waypoint.
**Verify:** `npm run verify:journey`

### Task 6 — Reduced motion has a real presentation
Reduced motion currently snaps to the nearest waypoint with no interpolation. Seven
assemblies that only exist mid-transition would be invisible to reduced-motion users.
Assemblies must snap to their chapter's full state rather than fading through it.
**Verify:** `npm run verify:journey` reduced-motion context

### Task 7 — Adaptive quality for interiors
Interior assembly counts fold into the existing `QualityState` budget. The `particles` budget
value is declared in all three tiers and **consumed by nothing** — the rooftop assembly adopts
it. Conservative tier drops assembly plane counts and skips the Living Room detail layer.
**Verify:** `npm run verify:journey` mobile context (DPR 1, no overflow) + `npm run audit:layout`

### Task 8 — Full gate
`typecheck`, `lint`, `build`, `verify:anchors`, `audit-layout`, `smoke` (320/375/430/834/1440),
`verify:journey` (desktop / reduced motion / no-WebGL / mobile). Screenshots to
`scripts/screenshots/phase3-*.png`.
**Verify:** `npm run verify:full`

---

## 3. Art-direction calls I'm making without an interview

Flagged for review per your instruction. Each is reversible and recorded here so a
disagreement is a one-line change, not a re-architecture.

1. **Interiors are procedural, not photographic.** Rationale in Task 3. The supplied photos
   are of other buildings.
2. **Interior palette is ivory/concrete/bronze**, inherited from `PALETTE`, not new hues.
   Keeps the Swiss-minimal discipline and avoids introducing colours with no token behind them.
3. **Assemblies fade rather than pop.** No hard cuts between chapters — matches the brief's
   "slow cinematic movement… pauses create anticipation". Cost: a brief moment where two
   assemblies are both semi-visible during a fade window.
4. **The rooftop particle budget is inherited**, not invented. `particles: 0 | 1200 | 3000`
   already exists in `TIER_BUDGETS` with no consumer.
5. **Living Room gets a waypoint between apartment and balcony** rather than sharing the
   apartment's. The `apartment→balcony` segment is only 26 units — enough for a distinct stop
   without adding scroll budget.
6. **No new DOM chapters.** See Task 4 ruling.

## 4. Risks carried into Phase 3

1. **Tower massing is unverified against the reference stills** — you elected to proceed. The
   interiors now sit inside that massing, so if the massing is wrong the interiors inherit it.
   This is the largest open risk and it is not mine to close.
2. **Interior legibility at small viewport.** A 34° long-lens interior that composes well at
   1440px may crop badly at 360px. Mitigation: FOV steps and assembly plane offsets widen on
   the conservative tier rather than trusting the same frame.
3. **Draw-call growth.** Seven assemblies plus 12 tower draw calls plus city plus windows. Every
   assembly must be instanced and every mesh must cull by chapter visibility.
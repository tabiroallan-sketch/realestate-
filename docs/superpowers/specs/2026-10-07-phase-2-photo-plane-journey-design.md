# Phase 2 remake — photo-plane journey

**Date:** 2026-10-07
**Status:** design approved (brainstorming session), awaiting spec review
**Supersedes:** the procedural-exterior scope of plan.md Phase 2

## Problem

Phase 2 delivered a procedural 3D exterior (towers, city, sky, sun) that only *approximates*
the 14 provided assets. A full correction pass (facade articulation, lighting, framing,
numeric gate 6/6 green) still left the render ~20% off the reference massing and softer in
banding. The user chose to stop approximating: the journey must **look exactly like the
provided images**.

## Decisions (user-selected)

1. **Hybrid** — the 3D camera rig, waypoints, scroll driving and inertial motion stay.
   The scene's visible content becomes the provided images.
2. **Full-frame planes** — each photo appears as a film still suspended in 3D space,
   fitted to fill the camera's FOV at its waypoint. No photo-on-geometry mapping,
   no layered-billboard fakery.
3. **Image-derived backdrop** — between/behind planes, a heavily blurred copy of the
   current photo fills the void; every visible pixel derives from the 14 assets.
4. **Video on the first plane** — the aerial MP4 plays as WP01's full-frame plane inside
   the canvas; the DOM layer is only the fast first-paint.
5. **Procedural scene code is stripped from the render tree, not deleted** —
   `TowerCluster` stays on disk for Phase 5 (exploded view).
6. **Approach: anchored planes** — planes are real quads in world space at their
   waypoints; fades are progress-driven off the same value the camera follows.

## Goals

- The journey's exterior look is, pixel-for-pixel, the provided imagery.
- One continuous camera, no cuts, no teleporting (plan.md core mechanic preserved).
- Same verification rigor as before, re-targeted: automated gate proves the right photo
  fills the frame at each waypoint.

## Non-goals

- Interior 3-plane assemblies (Phase 3 — already image-based by plan).
- Threshold choreography, day→night shader, text reveals (Phase 4).
- SVG masterplan (Phase 5). `TowerCluster` reuse for the exploded view (Phase 5).
- Any change to DOM sections, chrome, waypoints, camera curves or scroll mechanics.

## Architecture

### Scene tree after the remake

```
JourneyScene
  AdaptiveQuality            (kept)
  CameraRig                  (kept — curves, FOV stops, damping, parallax, snap)
  Backdrop                   (new) camera-position-following sphere, two-texture mix
  <VideoPlane>  t=0.00       (new) WP01
  <PhotoPlane> …             (new) one per beat, see mapping table
```

Removed from the render tree (files kept on disk): `Sky`, `Atmosphere`, `City`, `Ground`,
`TowerCluster`, `WindowLights`, and the `useDayCycle` call (no consumers remain).
`THREE.Fog` is not used — blur plus feathered plane edges hide seams better.

### PhotoPlane

- **Fit:** anchored `d` units from the camera's waypoint position along its look
  direction; height `= 2·d·tan(fov/2)` using **that waypoint's FOV stop**, width
  `= height × (imgW/imgH)`. At the waypoint the photo fills the viewport exactly; a small
  margin (≤3%) guards against parallax peek. `d` is per-plane (it sets depth ordering —
  "deeper" planes sit further along the leg — and parallax strength); default ≈ 90.
- **Orientation:** static, facing the camera's arrival point (no per-frame billboarding —
  spatial honesty; parallax comes from real camera motion).
- **Edges:** ~6% alpha-feathered border so the quad melts into the backdrop.
- **Material:** `MeshBasicMaterial`-equivalent (unlit), transparent, `fog: false`,
  `toneMapped: false` — the photo must render as authored, not through the ACES curve.
  Texture filtering: linear + mipmaps (WebGL2 handles the non-POT source).

### VideoPlane

Same fit/orientation math; `HTMLVideoElement` → `VideoTexture`, loop, muted,
`playsInline`. Under `prefers-reduced-motion` it renders the hero poster still instead
(plan rule: video paused on poster).

### Backdrop

- Sphere (~r 800) that copies the camera's **position** each frame but not its rotation,
  so it reads as an infinite environment.
- Textured with a runtime-downscaled copy of each active source image (~16 px drawn to a
  canvas, linear-filtered = blur for free, zero extra assets).
- A shader mixes `blurredA/blurredB` by the same crossfade factor the planes use, so the
  void behind a fading plane fades with it.
- If a source image fails to load, the backdrop falls to an `--ink`-tinted color.

### Transition mechanics

- **Progress-driven windows.** Per plane, derived from neighboring waypoint `t` values:
  fade-in over the last ~40% of the incoming leg, fade-out over the first ~35% of the
  outgoing leg, overlapping with normalized opacity so two planes cross-blend — no black
  gaps, no cuts. A short **hold** at each anchor keeps the image still for a beat.
- **Threshold fly-through.** Opacity ramps to 0 as camera-to-plane distance crosses
  near-clip + margin — entering lobby/rooftop photos is a pass-through, never a clip.
- **Ken Burns.** `scale 1 → 1.04` across each hold, driven by progress; off under
  reduced motion.
- **Reduced motion.** Camera snaps (existing); planes hard-cut at the snap; Ken Burns
  off; poster still replaces video.

## Asset mapping (all 14)

| Beat (t) | Asset |
|---|---|
| WP01 aerial (0.00) | `Aerial_view…mp4` — video plane |
| WP02 approach (0.14) | `Verde_Residences_development_view…1056.jpg` |
| WP03 entrance (0.30) | `Verde_Residences_exterior_street…09442.jpg` |
| WP04 lobby (0.44) | `Verde_Residences_lobby_interior…095500.jpg` (far) + `Lobby_interior_with_sculptural_s…09447.jpg` (deeper) |
| WP05 apartment (0.58) | `Luxury_apartment_interior_view…095506.jpg` |
| mid-leg (~0.64, no camera WP) | `Luxury_apartment_living_room_int…095512.jpg` |
| WP06 balcony (0.70) | `Balcony_view_of_Nairobi_skyline…095517.jpg` |
| WP07 rooftop (0.82) | `Camera_rising_over_building_rooftop…095523.jpg` (near) + `Rooftop_pool_overlooking_Nairobi…095537.jpg` (deeper) |
| WP08 night (0.91) | `Building_facade_at_night…095607.jpg` |
| WP09 masterplan (1.00) | `Verde_Residences_luxury_towers_N…095427.jpg` |
| DOM hero first-paint | `Verde_Residences_luxury_towers_N…095409.jpg` (poster, unchanged) |
| reserved for Phase 7 | `Verde_Residences_illuminated…095550.jpg` |

Source filenames contain U+2026 and timestamps — assets go through the existing
`build-image-ladder.mjs` rename/AVIF/WebP pipeline; the canvas loads the WebP ladder.

## Hero interplay & fallbacks

- First paint unchanged (DOM video/poster, text, CTA, scrim). On canvas-ready the DOM
  layer crossfades to the canvas video plane playing the same loop — same handoff
  pattern as today's poster→canvas.
- no-WebGL: unchanged (DOM journey, photograph kept).
- Texture failure: plane hides, backdrop tints to `--ink`; no crash, no hole
  (`MediaFrame` pattern).

## Verification rework

The procedural gate (bronze/ivory/band-energy vs reference) is **retired** — the scene
now *is* the photos. Replaced inside `scripts/compare-reference.mjs --gate`:

1. **Photo match** — each captured waypoint frame vs its source image: downscaled
   luminance/structure correlation ≥ threshold (starting target 0.8, tunable against
   false failures). Proves the right photo fills the frame.
2. **Full-frame coverage** — corner patches must correlate with the source's corners and
   carry non-trivial luminance: catches misfitted planes, backdrop holes, black fallbacks.

Unchanged and still green: `capture-reference.mjs` (same 5 waypoints), `journey.mjs`
(canvas paints, frame hashes change across scroll, pointer-events, waypoint accuracy
≤ 1u), `verify:anchors`, typecheck, lint, build. Composites become render-vs-source —
near-identical by goal, so human eyeball is a confirmation, not an adjudication.

## Risks

- **Asset resolution ceiling** — 1376×768 sources are soft at ≥2K viewport widths.
  Accepted; assets are fixed by the brief.
- **Crossfade double-exposure** — two photos briefly blended mid-leg; tune window widths
  if it reads muddy (art check during implementation).
- **First-paint handoff seam** — DOM video and canvas video are separate elements;
  the crossfade must hide drift. Same risk pattern already accepted in Phase 2.
- **Dead code on disk** — stripped modules linger until Phase 5; documented in plan.md.

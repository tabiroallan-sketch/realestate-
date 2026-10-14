> **SUPERSEDED 2026-10-07** by `docs/superpowers/specs/2026-10-07-full-site-redesign-design.md` — phases 3–10 retired; this file is historical.

# THE VERDE RESIDENCES — Cinematic Interactive 3D Real Estate Website

> Implementation plan. Nairobi, Kenya · luxury residential development · scroll-driven
> cinematic experience. Phases 1–10, each gated on verification.

**Created:** 2026-10-05
**Status:** Phase 2 complete + reference gate GREEN — human adjudication of side-by-sides before Phase 3

---

## 0. Locked decisions

| Decision | Choice | Source |
|---|---|---|
| 3D approach | Procedural 3D exteriors + layered image interiors | User |
| Missing assets | Use only the provided images; fill gaps with code (procedural 3D / SVG / type-led) | User |
| Typography | Bodoni Moda + Jost | User |
| Page length | All 15 beats, compressed into 12 rendered sections (~25 viewport-heights) | User |
| Stack | Next.js 16 App Router, React 19, TS, Tailwind v4, three 0.186, R3F 9.8, drei 10.7, GSAP 3.15, Lenis 1.3.26 | — |

### Asset inventory (provided, 14 files)

All JPEGs are 1376×768 (16:9), 650KB–1.05MB. Filenames contain a literal `…` (U+2026) and a
timestamp suffix — **must be renamed** (unsafe in URLs).

| # | Source file | Primary home |
|---|---|---|
| 1 | `Aerial_view_of_residential_towers_*.mp4` | Hero arrival layer |
| 2 | `Verde_Residences_luxury_towers_N…_0912.jpg` | Hero poster |
| 3 | `Verde_Residences_luxury_towers_N…_1054.jpg` | Hero alternate / Development |
| 4 | `Verde_Residences_development_view_1056.jpg` | Development |
| 5 | `Verde_Residences_exterior_street_0945.jpg` | Entrance |
| 6 | `Verde_Residences_lobby_interior_0955.jpg` | Lobby — far plane |
| 7 | `Lobby_interior_with_sculptural_s_0945.jpg` | Lobby — mid/near plane |
| 8 | `Luxury_apartment_interior_view_0955.jpg` | Residence + hotspots |
| 9 | `Luxury_apartment_living_room_int_0955.jpg` | Living Room |
| 10 | `Balcony_view_of_Nairobi_skyline_0955.jpg` | Balcony |
| 11 | `Camera_rising_over_building_rooftop_0955.jpg` | Rooftop entry |
| 12 | `Rooftop_pool_overlooking_Nairobi_0955.jpg` | Rooftop pool |
| 13 | `Building_facade_at_night_1056.jpg` | Day→Night end state |
| 14 | `Verde_Residences_illuminated_at_0955.jpg` | Final CTA |

### Asset gaps — resolved with code, not placeholders

- **Exploded view** → real procedural 3D (section 07). No image required; strongest section, free.
- **Masterplan** → hand-authored SVG site plan with real interactive hotspots.
- **Location** → hand-authored SVG map of Nairobi.
- **Amenities** → typographic-led cards (avoids repeating the 13 images).
- **Interior hotspots** → real `<button>`s layered over the apartment image.

---

## 1. The core mechanic

One **persistent, never-unmounting WebGL canvas** spans sections 01→06. The camera never stops
and never teleports. Inside that single scene:

- **Procedural geometry** — tower complex, sky, sun, city, landscape
- **Image-plane interiors** — lobby / apartment / living room / balcony are *not* flat billboards.
  Each is a 3-plane assembly:
  - **far plane** — window wall + city beyond
  - **mid plane** — furniture
  - **near plane** — architectural framing (door jamb, balcony rail, window mullion)

  The camera flies *through* a designed threshold (bronze fins part, glass fades) and the interior
  planes take over, each parallaxing at its own rate off real camera motion + pointer.

This removes the seam problem: no teleport, and interiors read as spaces rather than photo cards.
If an interior texture fails to load, the near-plane frame still holds the composition.

Section 07 (exploded) uses a **second, lighter canvas** reusing the same `TowerCluster` geometry,
mounted via `IntersectionObserver` and unmounted after. Sections 08–12 use **zero WebGL**.

### Performance rules for the journey canvas

- Three.js dynamic-imported; chunk loads **after** hero paint
- `dpr` ladder: `min(dpr, 1.5)` desktop · `min(dpr, 2)` high-end · `1` mobile
  — **never** raw `window.devicePixelRatio`
- `AdaptiveQuality` samples FPS over the first ~2s, downgrades DPR / disables particles
  / reduces skyline instance count before the user perceives it
- `frameloop` pauses on `visibilitychange` and when the canvas leaves the viewport
- `InstancedMesh` for balcony bands (3 towers × 22 floors × N) and skyline blocks (500+)
- `FogExp2` for atmosphere + implicit far-plane culling
- Particles capped at 3000, mobile 600, disabled under reduced motion
- Explicit `dispose()` of geometry, materials and textures on unmount

---

## 2. Camera architecture

`CameraRig` is the single owner of camera state. No component mutates the camera directly.

```
CameraRig
  position      CatmullRomCurve3 through 9 waypoints
  target        separate CatmullRomCurve3  (decoupled look-at = camera-operator feel)
  fov           animated per waypoint (wide aerial → long-lens interior)
  parallax      pointer offset, damped, clamped
  damping       velocity/inertial follow toward target state
  reducedMotion collapse curve → nearest-waypoint snaps with crossfades
```

**Waypoints**

| WP | Position | Intent |
|---|---|---|
| 01 | Far aerial | Establish scale, high altitude |
| 02 | Approaching development | Towers grow, fog shifts |
| 03 | Entrance | Ground level, threshold |
| 04 | Lobby | Interior — architectural framing |
| 05 | Apartment | Interior — depth layering |
| 06 | Balcony | Exterior — city reveal |
| 07 | Rooftop | Vertical rise, pool, particles |
| 08 | Night exterior | Post day→night, illuminated |
| 09 | Masterplan | Zoom out to site |

**Driving mechanism:** GSAP ScrollTrigger with **`scrub: 1`** writes normalized progress to a ref.
Per the verified Three.js guideline, `onEnter`/`onLeave` are **never** used for camera motion — they
snap. R3F's `useFrame` lerps the real camera toward that target state, producing the inertial
follow for free.

---

## 3. Design system

### Colour

| Token | Value | Contrast on Ink | Use |
|---|---|---|---|
| `--ink` | `#0A0C0B` | — | Base background |
| `--ivory` | `#F2EFE9` | ~17:1 | Primary text |
| `--ivory-dim` | `rgba(242,239,233,.62)` | ~7.5:1 | Secondary text |
| `--bronze` | `#A68A64` | ~6.0:1 | Hairlines, accents, eyebrows |
| `--glass` | `#2A3F52` | — | Blue-tinted glass tints (sparing) |
| `--verdant` | `#3F5B45` | — | Foliage accent (sparing) |
| `--focus` | `#F2EFE9` | — | Focus ring |

Derived from the identity: ivory concrete, dark bronze fins, blue-tinted glass, tropical landscape.

### Surface rules (Swiss minimalism — from `minimalism-and-swiss-style`, verified)

- `--radius-*: 0` everywhere
- `--shadow-*: none` — depth from scale, blur and luminance instead
- No gradients, no glassmorphism
- Borders: `1px solid rgba(242,239,233,.14)` hairlines

### Typography

- **Display:** Bodoni Moda 400 (`--font-display`) — `clamp(2.75rem, 9vw, 8.5rem)`,
  tracking `-0.02em`, leading `0.92`
- **UI/Body:** Jost 300/400/500 (`--font-sans`)
- **Eyebrow/label:** Jost 500, `0.6875rem`, uppercase, tracking `0.28em`, bronze
- **Body measure:** max `34ch`, leading `1.65`
- Loaded via `next/font/google` — self-hosted, `display: swap`, no CLS

### Layout

- Grid: 12-col desktop → 6-col tablet → 4-col mobile
- Gutter: `clamp(20px, 5vw, 88px)`
- Max content width: 1600px; full-bleed for cinematic sections
- Breakpoints: 320 base · 375 · 430 · 640 · 768 · 1024 · 1280 · 1440 · 1728+

### Motion tokens

```
--dur-micro      180ms    hover, press
--dur-ui         320ms    state change
--dur-reveal     900ms    entrance reveal
--dur-cinematic  1600ms   scene transitions
--ease-out-expo        cubic-bezier(0.16, 1, 0.3, 1)
--ease-in-out-quint    cubic-bezier(0.83, 0, 0.17, 1)
--ease-architectural   cubic-bezier(0.65, 0, 0.35, 1)
```

---

## 4. Journey map — 12 rendered sections, 9 waypoints

| # | Section | Media | Beats merged | WP |
|---|---|---|---|---|
| 01 | Hero + Development reveal | video → poster → 3D | 01 + 02 | 01→02 |
| 02 | Threshold: Entrance → Lobby | 3-plane interior | 03 + 04 | 03→04 |
| 03 | The Residence | image + hotspots | 05 | 05 |
| 04 | Living Room → Balcony | 3-plane + skyline | 06 + 07 | 06 |
| 05 | Rooftop | 3D + pool | 08 | 07 |
| 06 | Day → Night | shader interpolation | 09 | 08 |
| 07 | Exploded Architecture | 3D (2nd canvas) | 10 | — |
| 08 | Masterplan | SVG | 11 | 09 |
| 09 | Residence Collection | images | 12 | — |
| 10 | Amenities | horizontal scroll | 13 | — |
| 11 | Location | SVG map | 14 | — |
| 12 | Final CTA + Form | night image | 15 | — |

### Pinned sections (budgeted — max 2, per GSAP guideline)

- Section 01 (hero flight) — scrub 1
- Section 10 (amenities) — vertical→horizontal scrub
- Section 07 (exploded) — pinned, 3D

---

## 5. Copy (locked)

- **Hero:** `Live Above The Ordinary.` · eyebrow `THE VERDE RESIDENCES — NAIROBI`
  · primary CTA `EXPLORE RESIDENCES` · secondary CTA `VIEW MASTERPLAN`
- **Development:** `Architecture That Belongs Here.`
- **Lobby:** `Designed Around You.` — concierge, wellness, security, communal
- **Balcony:** `PANORAMIC CITY VIEWS` → `THE CITY. YOUR HORIZON.`
- **Final CTA:** `Your New Perspective Awaits.` · `REQUEST A PRIVATE VIEWING` · `DOWNLOAD BROCHURE`

Copy lives in `data/`, never inline in components.

---

## 6. Code architecture

```
app/
  layout.tsx        fonts, metadata, JSON-LD, skip-link, Providers
  page.tsx          composes sections in order
  globals.css       Tailwind v4 @theme + design tokens
  loading.tsx  error.tsx  not-found.tsx  robots.ts  sitemap.ts
components/
  chrome/     Navigation MobileMenu ScrollProgress CustomCursor Loader
  journey/    JourneyCanvas JourneyOverlay
              sections/ Hero Development Entrance Lobby Residence
                        LivingRoom Balcony Rooftop DayNight
  architecture/ ExplodedView Masterplan
  collection/   ResidenceCollection Amenities Location
  cta/          FinalCta ViewingForm Footer
  ui/          Button Eyebrow Field Hotspot Reveal MediaFrame Section
three/
  CameraRig.ts  journeyCurves.ts  QualityManager.ts  capability.ts  dispose.ts
  towers/     TowerCluster Tower BalconyBand Fin Glass
  env/        SkyDome SunLight CitySkyline Landscape
  planes/     InteriorPlane ImagePlane
  shaders/    sky.ts water.ts
animations/  reveal parallax horizontal transitions easing gsap
hooks/       useLenis useReducedMotion usePointerParallax useWebGLSupport
             useSectionProgress useActiveSection useMediaQuery useInView
data/        site navigation journey properties amenities location
             explodedLayers masterplan journeyHotspots
lib/         webgl cn contrast format media
public/assets/{hero,architecture,interiors,lifestyle,masterplan,video,icons}
```

**Boundaries:** 3D logic knows nothing about UI; UI never touches the camera; animation utilities
own all timing; content lives in `data/`; nothing in one mega-component.

---

## 7. Accessibility

- Semantic HTML, one `<h1>`, `<h2>` per `<section aria-labelledby>`
- Canvas is `aria-hidden="true"` — **all meaningful content exists in the HTML DOM**
- Canvas `alt` equivalent provided via a visually-hidden description adjacent to each scene
- Visible focus on every interactive element: `outline: 2px solid var(--focus); outline-offset: 3px`
- `scroll-padding-top: var(--nav-h)` so sticky nav never obscures focus
- Skip-to-content link
- Hotspots: real `<button aria-expanded>`, keyboard reachable, sensible DOM order
- Carousels have keyboard + button alternatives, not swipe-only
- `prefers-reduced-motion`: Lenis off (native scroll), camera snaps to waypoints, particles off,
  video paused on poster, transitions shortened. **Content is never hidden.**
- **Reveal states gated behind `html[data-motion="on"]`** (set by JS) — default CSS is fully
  visible, so no-JS and crawlers get complete content

---

## 8. SEO

- `title`: `The Verde Residences | Luxury Living in Nairobi`
- `description`: `Discover The Verde Residences — a new standard of luxury residential living in Nairobi.`
- Open Graph + Twitter/X + canonical + `metadataBase`
- JSON-LD `@graph`: `Organization`, `WebSite`, `RealEstateAgent`, `RealEstateListing`
- Descriptive alt text on every image; `<figure>/<figcaption>` for architectural imagery
- `robots.ts`, `sitemap.ts`
- Streamed via Suspense + `loading.tsx`

---

## 9. Error handling

| Failure | Response |
|---|---|
| WebGL unavailable | Elegant 2D fallback — hero still + CSS parallax path. Full experience intact, minus 3D. |
| WebGL context lost | `ErrorBoundary` + context-restore listener → 2D fallback |
| Image 404 / error | Tinted fallback panel with alt text; layout preserved |
| Slow device | `AdaptiveQuality` downgrade ladder |
| Low memory | Reduced skyline instances, textures at half res |
| Reduced motion | Full content, simplified motion |
| Missing asset | `MediaFrame` renders labelled slot; page never breaks |

---

## 10. Performance budgets

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |
| Initial JS (gzip) | ≤ 200KB excluding Three chunk |
| LCP | hero poster (`priority`) |
| CLS | < 0.02 |
| Frame rate | 60fps desktop, ≥ 30fps mid mobile |

---

## 11. Verification gates (every phase, no exceptions)

1. `next build` — catches type + SSR errors
2. Playwright suite: console-clean · reduced-motion · WebGL-disabled ·
   320px / 375px / 430px / 1440px
3. Lighthouse against the production build in headless Chrome
4. Manual: keyboard traversal, tab order, focus visibility

No phase proceeds on a red gate.

---

## 12. Phase plan

### Phase 1 — Foundation ✅ complete
Scaffold Next 16 + TS + Tailwind v4 · design tokens · typography · global styles ·
navigation (+ mobile fullscreen menu) · loading screen · responsive shell · scroll progress ·
custom cursor. **No complex 3D yet.**

Gate evidence (`npm run verify` → `verify:anchors` · `verify:smoke` · `verify:layout`):
- `next build` green; `/`, `/_not-found`, `/robots.txt`, `/sitemap.xml` all static.
- Playwright: 5 viewports (320/375/430/834/1440) · console-clean · zero failed requests ·
  loader self-exits · all 13 chapters reachable by anchor · mobile menu focus trap and
  focus-return verified · AVIF served · hero decodes at every width.
- `prefers-reduced-motion` leaves all content visible; WebGL-disabled run renders the
  full DOM journey with no errors.
- Measured type scale is monotonic and correctly split serif/sans; all sampled text
  ≥ 4.5:1 (large ≥ 3:1) against its painted background; no horizontal overflow at 320px;
  no section overlap; all standalone controls ≥ 24px effective target.

**Build-time guards added during this phase** (each caught a real defect):
- `scripts/verify-anchors.mjs` — every chapter and nav/CTA hash must resolve to a real
  rendered id. Caught a 12-vs-13 chapter drift.
- `scripts/build-image-ladder.mjs` — source filenames must exist and be unique per section.
  Caught a wrong `rooftopPool` filename and a silent `heroPoster` duplicate.
- `scripts/smoke.mjs`, `scripts/audit-layout.mjs` — browser gate and computed-layout audit.

**Defects found and fixed at this gate:**
- `skip-link` was defined as two `@utility` blocks (Tailwind v4 rejects duplicates).
- `next/image` could not resolve the extensionless manifest keys, so every photograph
  400'd. Replaced with `ResponsivePicture`, which serves the prebuilt AVIF/WebP ladder
  directly through `<picture>` instead of re-encoding already-optimised assets.
- React Compiler lint surfaced four real `setState`-in-effect violations; scroll state now
  derives during render from a single subscription, and `useMounted` / `useWebGLSupport` /
  `useReducedMotion` use `useSyncExternalStore`.
- `useReducedMotion` returned `false` on the first client render, so a `gsap.from` tween
  applied its opacity-0 from-state and motion-reduced users saw permanently hidden
  content. Reveals now actively clear the from-state rather than only skipping.
- 7 undersized touch targets in the nav and footer.

### Phase 2 — Hero — COMPLETE
Journey canvas · environment (sky, sun, fog, city, landscape) · procedural tower complex ·
`CameraRig` + waypoints + scroll controller · hero typography & CTA · loading integration.
**Gate: desktop + mobile + console clean. PASSED.**

Delivered:

- `src/journey/store.ts` — module-level mutable store for scroll progress, pointer parallax
  and canvas readiness. Progress is written ~60×/s and read inside `useFrame`, so it cannot
  live in React state; a module singleton also keeps the React Compiler lint rules satisfiable
  without threading refs as props.
- `src/journey/deviceProfile.ts` — tier detection with no Three.js imports, so the canvas
  shell can resolve the pixel ratio before the 3D chunk loads. Mobile and software renderers
  (SwiftShader/llvmpipe) are detected and pinned to the conservative tier.
- `JourneyCanvas` → dynamic `import()` → `JourneyCanvasImpl` → `JourneyScene`. Nothing imports
  Three.js or R3F statically; the initial bundle carries no 3D code.
- `CameraRig` — separate Catmull-Rom curves for position and look-at, per-waypoint FOV stops,
  frame-rate-independent damping, reduced-motion waypoint snapping.
- `environment/Sky` (analytic gradient shader interpolating day→night), `environment/Atmosphere`
  (`FogExp2` + sun + hemisphere, night fog thickening), `environment/City` (instanced skyline
  plus ground/podium).
- `TowerCluster` — 3 towers, 4 instanced meshes total (core, balcony bands, bronze fins,
  glazing) rather than a mesh per floor: 12 draw calls instead of 200+.
- `WindowLights` — ~1,900 emissive panes in one instanced mesh, fading in through dusk via an
  `instanceColor` attribute.
- `useScrollProgress` (GSAP ScrollTrigger, scrubbed), `usePointerParallax` (damped, fine-pointer
  only), `useFrameloopGate` (visibility-change pause), `AdaptiveQuality` (frame-time sampler,
  downgrade-only).
- `Experience` mounts the canvas once, behind the content, `pointer-events: none` and
  `aria-hidden`. `Hero` cross-fades the photograph out over the canvas on first drawn frame and
  swaps to a heavier scrim tuned for the brighter 3D sky.

Gate evidence:

- `scripts/journey.mjs` added (`npm run verify:journey`, folded into `verify:full`): canvas
  mounts and paints a non-uniform frame; frame hash changes across the scroll flight; canvas
  never captures pointer events and the hero CTA stays hit-testable; render loop measurably
  stops on `visibilitychange` and returns to the DOM-only frame rate; reduced motion renders
  without errors; no-WebGL devices get no canvas and keep the photograph; mobile renders at
  DPR 1 with zero horizontal overflow; no console errors, no failed requests.
- `npm run verify:anchors`, `typecheck`, `lint`, `build` green. `smoke.mjs` and
  `audit-layout.mjs` green across 320 / 375 / 430 / 834 / 1440.
- Fixed along the way: `WindowLights` was setting `opacity` on a non-transparent material and
  attaching instance colours as a geometry attribute, so the window grid would never have lit;
  `Atmosphere` allocated ~150 `THREE.Color` objects per second in the frame loop; `TowerCluster`
  pushed glazing quads into the core instanced mesh; mojibake in two comment blocks.
- Playwright's actionability helpers had to be replaced with direct DOM scrolling in
  `smoke.mjs` — a continuously animating WebGL layer never satisfies the "stable element" wait.

**Reference comparison (risk 1) — DONE, verdict: not yet the same buildings.**
Captured the 5 exterior waypoints via the `?journeyProbe=1` seam
(`scripts/capture-reference.mjs`) and measured them against the reference stills
(`scripts/compare-reference.mjs`; method: vertical-derivative structure detection,
fixed thresholds for both sides, white-balance control for photo grade). Evidence:

- **Materials** — render towers are ivory + glass; references are bronze-dominant.
  Cleanest pairs (cool-graded refs, grade working *against* the finding):
  aerial 29% bronze (ref) vs 5% (render), night 22% vs 4%; entrance glass 43%
  (render) vs 12% (ref). Ivory runs 23–31% in renders vs 0–8% in references.
- **Facade articulation** — reference balcony banding is strong and regular at
  every distance (aerial pitch 29px, r≈0.93, energy ≈1500). The render's banding
  collapses with distance (aerial pitch incoherent, energy ≈120 — 10× weaker);
  only the night close-up bands properly (pitch 26–27px, r≈0.9 → 22 storeys,
  self-validating `TOWER_STOREYS`).
- **Hero/development framing** — reference towers occupy ~2× the frame width and
  reach within 5–10% of frame top; render towers are half as wide, tops at
  16–39%. Possibly intentional for "far aerial" — human adjudication required.

Side-by-side composites for the human pass: `scripts/screenshots/reference/side-by-side/*.png`.
Caveats: photo noise fragments reference column runs (run counts and `impliedFloors`
unreliable); white-balance control can manufacture bronze from neutral pixels, so
bronze conclusions rest on the cool-graded pairs + raw numbers.
**Corrections (materials, band contrast, framing review) must land before Phase 3.**

**Corrections pass — REFERENCE GATE GREEN (6/6).** Verified with
`node scripts/capture-reference.mjs` → `node scripts/compare-reference.mjs --gate`:

- `TowerCluster` rewritten — elliptical cores with full facade articulation on all four
  faces: per-storey perimeter rings (bronze spandrel / ivory balcony slab / teal glazing /
  dark reveal), full-height radial bronze fins, crown parapet, podium plinth with colonnade;
  6 instanced meshes.
- `WindowLights` re-gridded onto each tower's ellipse at its own storey count (tower C no
  longer floats panes above its roofline).
- Lighting/materials: hemisphere 0.85 → 1.2, spandrel metalness 0.2 → 0.1, fins 0.5 → 0.15 —
  shadow-facing facade faces now land in the bronze bucket instead of collapsing to "dark"
  (no env map; high metalness renders near-black).
- Framing: WP01 aerial → `position [-115,60,130] target [0,37,0] fov 40`. Camera sits below
  the tallest roofline so all three towers rise above the horizon and reach 5–10% of frame
  top, matching the poster.
- **Detector correction (applies to both sides alike):** `columnTops` box-smooths 5 rows
  before differencing. Real-time renders cliff in 1–2px; photographs blur over many rows.
  A single raw-derivative rule could not see both. At a 5-row scale both are detectable and
  sky gradients still sit far below threshold.
- `scripts/journey.mjs`: hygiene checks + final screenshot + primary-context close moved
  ahead of the reduced-motion/fallback/mobile sections — two software WebGL contexts in one
  renderer starved the reduced-motion mount past its 60s timeout (and made the hidden-fps
  baseline check read 39 vs 59).

Gate evidence (caps are the gate; reference values are context):

| Check | Result | Cap | Reference |
|---|---|---|---|
| aerial bronze | 27% | ≥ 15% | 18% |
| night bronze | 20% | ≥ 15% | 23% |
| aerial band energy | 593 | ≥ 500 | 962–1749 |
| aerial ivory | 9% | ≤ 20% | 7% |
| widest tower run | 149px | ≥ 70px | 85–122px |
| tower top | 7% | ≤ 20% | 5–10% |

- `npm run verify` (anchors · typecheck · lint · build) green. `npm run verify:journey`
  green — 30 checks, worst waypoint accuracy 0.39 units (`approach`).
- Composites regenerated → `scripts/screenshots/reference/side-by-side/`.
- **Open for human adjudication:** towers ~20% wider in frame than the poster (149px vs
  85–122px — slimming `TOWERS` widths is the lever); band energy 593 vs ~1500 (banding
  reads real but softer than the photograph); rooftop waypoint renders darker than its
  reference (not gated).

### Phase 3 — Cinematic story
Development · Entrance · Lobby · Residence · Living Room · Balcony · Rooftop.
Camera transitions between all waypoints. Interior 3-plane assemblies.

### Phase 4 — Advanced animation
Thresholds (fins part, glass fades) · parallax · masks/clip-path · image transitions ·
day→night shader interpolation · text choreography · architectural reveals.

### Phase 5 — Interactive architecture
Exploded 3D view (reuse `TowerCluster`) · SVG masterplan with hotspots · residence collection.

### Phase 6 — Amenities + Location
Horizontal scrub section with mobile carousel conversion · SVG location map.

### Phase 7 — Final CTA + forms
Night scene · viewing form (validation, `aria-live`, error summary) · brochure CTA · footer.

### Phase 8 — Performance
Bundle analysis · image/texture sizing · DPR ladder · adaptive quality · mobile FPS · memory.

### Phase 9 — Accessibility + SEO
Keyboard · screen reader · contrast audit · reduced motion · metadata · JSON-LD · semantic pass.

### Phase 10 — Polish + sign-off
Full creative review — awkward transitions, spacing, timing, clutter, hierarchy, mobile,
loading, broken interactions. Lighthouse sign-off.

---

## 13. Known risks

1. **Cannot visually verify the reference images** — the procedural towers are art-directed from
   the written description alone. First task in Phase 2 is a side-by-side check against the
   reference stills; if they read as different buildings, massing and materials get corrected
   before going further.
2. **Model-to-photo match** is the single biggest quality risk and requires human adjudication.
3. **720p hero video** is soft at 1440p+ — used as a fast-arrival layer that cross-fades to the
   still, never as the primary hero.

---

## 14. Creative rules

- No animation without a purpose: every motion supports story, hierarchy, navigation, spatial
  understanding or emotional impact.
- Slow cinematic movement for architecture; faster only for transitions; pauses create anticipation.
- Reserve moments where the user can simply appreciate the building.
- Never: generic templates, glassmorphism, stock photography, mismatched architecture between
  sections, walls of text, neon, gratuitous gradients, particle overload, fake loading delays,
  ignored console errors, mobile as an afterthought.
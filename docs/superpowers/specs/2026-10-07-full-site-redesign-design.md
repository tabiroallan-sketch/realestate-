# The Verde Residences — Full-Site Redesign Design

**Date:** 2026-10-07 · **Status:** design approved section-by-section in brainstorming; awaiting spec review
**Purpose:** sales and lead generation. Inspire → inform → convert, on a phone, with one primary action: WhatsApp / call.

## 0. Relationship to existing artifacts

- **Supersedes:** the original 10-phase roadmap (`plan.md` phases 3–10, `plan-phase-3.md`) — retired entirely, not backlogged. Sections it planned (masterplan drag, exploded view, configurator, hotspots) are out of scope and their content decisions are reversed below.
- **Amends:** `docs/superpowers/specs/2026-10-07-phase-2-photo-plane-journey-design.md` — its **mechanics remain law** (FOV fit, progress crossfade, backdrop, reduced-motion step-cuts, resilience); this spec changes its **beats, waypoints and verification constants**. Its uncommitted implementation plan must be rewritten against this spec before execution.
- **Retains:** the Next.js 16 / React 19 / TypeScript / Tailwind v4 / three / R3F / GSAP / Lenis stack, the journey engine (`store`, `CameraRig`, `JourneyCanvas`, `AdaptiveQuality`, probe), the 14 provided assets, and the `site.ts` single-content-file pattern.

## 1. Locked decisions

| Decision | Choice |
|---|---|
| Purpose | Sales & lead generation; WhatsApp / phone is the primary CTA everywhere |
| Depth | Full rebuild — structure, design system, motion, copy |
| Narrative | Buyer funnel: inspire (the flight) → inform → convert |
| Page architecture | Journey first — canvas owns the top ~40%, funnel runs underneath |
| Visual identity | **Dark cinematic**: ink ground, bronze, ivory; Bodoni Moda + Jost |
| The flight | 13 beats, video arrival first, ends on the lit towers at night; no masterplan zoom-out |
| Device | **Mobile-first**; persistent bottom WhatsApp bar on phones |
| Availability | Static inventory snapshot ("37 / 84, as of October 2026"), WhatsApp CTA per row |
| Developer trust | Fictional-but-real track record (consistent with the footer disclaimer) |
| Copy voice | Quiet luxury, hard specifics — numbers, materials, minutes; no superlatives |
| Roadmap | Superseded entirely |
| Custom cursor | Dropped — flourish reads "demo", not "sales" |

## 2. Page map (~14 screens total; Phase 1 was ~25)

### Act 1 — The Flight (≈8 screens, scroll-scrubbed canvas)

13 beats crossfade on scroll, each holding for a beat around its anchor:

1. Arrival — aerial **video**, autoplay muted loop (poster fallback)
2. The Towers — day exterior
3. Development view — all three towers
4. Threshold — street-level arrival
5. Inside — lobby wide
6. Lobby detail — sculptural stair
7. Residence interior — panoramic living
8. Living room — second interior angle
9. The View — balcony over Nairobi
10. Rooftop rise — camera lifting over the roof
11. Rooftop pool — infinity edge, skyline
12. Night facade — dusk, fins lit
13. Night — towers illuminated; **the journey rests here**

The night frame dissolves into Act 2 — no seam; the funnel's first section fades in over it.

### Act 2 — The Facts (≈6 screens, editorial, dark system)

1. **The Development** — 3 towers, 22 storeys, Q4 2027, the four materials; full-bleed `development-towers` band (the only photo reused outside the flight)
2. **The Residence Collection** — four typology cards with KES pricing *(approved mockup)*
3. **Amenities** — four groups, type-led grid (no photos — the film owns them)
4. **Location** — compact drive-time strip (CBD 8 min, Westlands 6 min, Upper Hill 5 min, JKIA 32 min, Wilson 14 min, Karura 7 min); no map
5. **Availability** — 37/84 snapshot, a representative subset of unit rows (5–8, not the full inventory — the full list is the WhatsApp CTA's job), per-row WhatsApp *(approved mockup)*
6. **Trust** — Verde Development Partners stats *(approved mockup)*
7. **Close** — CTA block (WhatsApp pill, phone, hours Mon–Sat 09:00–18:00 EAT, gallery address) + footer

### Chrome

- Nav: VERDE wordmark · Residences · Amenities · Availability · Contact · WhatsApp pill; translucent over the flight → solid on scroll; anchors jump straight past the film to the facts
- Mobile: hamburger menu + **persistent bottom WhatsApp bar** (always visible on phones, flight included — the primary CTA never leaves the thumb)
- Thin bronze scroll-progress line; short loader that releases when the first beat is ready
- Footer keeps the fictional-project disclaimer

## 3. The flight

### Camera acts (13 waypoints, re-authored as one continuous shot)

| Act | Beats | Camera intent |
|---|---|---|
| Open | 1–3 | High aerial (video) drifts down and around the exteriors, fov ~40 |
| Ground | 4 | Drops to street level, fov narrows — the approach |
| Interior run | 5–8 | Flies through interiors, long-lens fovs, planes deeper from the camera |
| Reveal | 9 | Pushes out across the balcony toward the skyline |
| Rise | 10–11 | Vertical lift above the towers |
| Close | 12–13 | Pulls back to the lit towers and rests |

### Amendments to the photo-plane design

- `waypoints.ts`: **9 → 13 entries**, re-authored; field order (`id, position, target, fov, t, label`) frozen; **masterplan waypoint deleted** — the flight ends on night
- Beat anchors re-spread across `t ∈ [0,1]`: interiors compressed (fast through the lobby), exteriors given room; exact weights are a plan-level decision
- Mechanics unchanged and restated as binding: fit `height = 2·d·tan(fov/2)·1.03`, width `= height·aspect` (all sources 16:9); crossfade `s = smoothstep(A + 0.4·(B−A), B − 0.4·(B−A), t)` with `sum(opacities) ≥ 0.999` at every `t`; reduced motion = step-cut (exactly one beat visible, video → poster, Ken Burns off); Ken Burns `1 + 0.04·smoothstep`; near-clip fade `smoothstep(2, 6, distance)`; backdrop sphere r800, position-follow only, 16×16 downscale, ink `#0A0C0B` fallback; materials unlit / transparent / `depthWrite:false` / `toneMapped:false`, 6% feathered border; default plane depth 90, deeper interiors 130, entrance 70
- Video beat: `muted playsinline autoplay` loop from `hero-aerial.mp4`, poster still as first frame and reduced-motion texture
- Texture failure: the plane hides itself; backdrop falls back to ink — the run stays error-free

## 4. Design system

**Tokens:** ground `#0A0C0B` · surface `#10130F` · ivory `#E8E2D5` · bronze `#B98A45` · muted `#8F897C` · body `#A39D91` · hairline `rgba(232,226,213,.12)`

**Type:** Bodoni Moda 400 (display, italic accents) · Jost 300–500 (body, labels, UI). Eyebrow = Jost caps 10px / `.24em` / bronze. Display sizes clamp; body 13–16px, `1.6` line-height, never below 13px on phones.

**Components:** unit card · availability row (+ status chip: Available = bronze outline, On hold = muted) · stat block (Bodoni figure over Jost caps label) · bronze CTA pill (ink text) · secondary pill (bronze outline) · section header (eyebrow → Bodoni headline → lede) · hairline rules.

**Grid & rhythm:** 12-column shell on desktop, single column on phones; section padding `clamp(4rem, 12vh, 9rem)`; content measure ≤ 68ch for body copy.

**Motion:** restrained fade/rise reveals (GSAP + Lenis retained); nothing in Act 2 moves while being read; every animation has a reduced-motion equivalent.

## 5. Content & copy

- Voice: quiet luxury, hard specifics. Every line earns its place with a number, a material, a minute or a name. No "luxury redefined", no stacked adjectives.
- All strings live in `src/data/site.ts`; extended with:
  - `availability` — total 84, remaining 37, as-of date, unit rows drawn from the four typologies with floors, sizes, prices (internally consistent with `residenceTypes`), statuses
  - `trust` — founded 2009, 1,240 homes handed over, 6 towers under construction (fictional-but-credible)
- **Deleted content:** masterplan section, exploded-architecture section, day/night editorial (the flight now ends on night), location SVG map, hand-authored SVG masterplan
- **Deleted code:** procedural journey components (`Sky`, `City`, `Atmosphere`, `TowerCluster`, `WindowLights`, `useDayCycle`) and `CustomCursor` — the roadmap that would have reused them is superseded; keeping them would be dead code

## 6. Edge behavior

- **Reduced motion:** flight step-cuts between beats (exactly one visible), video → poster still, Ken Burns off, reveals become instant
- **No WebGL:** flight collapses to stacked full-bleed stills — one per beat at ~50vh, lazy-loaded, labeled, no crossfade machinery; Act 2 unchanged
- **Autoplay blocked:** poster still is the first frame; the flight still works as scrubbed images
- **JS disabled:** Act 2 content is server-rendered and readable; the flight degrades to the hero poster
- **Texture 404:** plane hides itself, backdrop inks over, run stays console-clean

## 7. Performance (mobile-first)

- three.js / journey chunk loads **after** hero paint; first frame = poster (no blank canvas)
- dpr ladder (`min(dpr,1.5)` desktop / `min(dpr,2)` high-end / `1` mobile) + `AdaptiveQuality` FPS sampling retained
- Act 2 images lazy-loaded below the fold; fonts preconnected, subset
- Zero new runtime dependencies
- Target: smooth scroll on mid-range Android, no layout shift above the fold

## 8. Verification gates

1. **Photo match** — capture at each of the 13 anchors vs its source: luminance/structure correlation ≥ **0.8** for the 12 still pairs, ≥ **0.5** for the aerial pair (live video vs poster); corner coverage ≥ **0.5** and mean luma > **12**
2. **Journey probe** — `journey.mjs` re-keyed to 13 waypoints: camera lands within 1 unit of each authored waypoint; DOM handoff, reduced-motion, no-WebGL and console-clean checks stay green
3. **Plane math** — coverage `sum ≥ 0.999` over a full `t` sweep; reduced-motion cells exactly one visible; fit numbers match the formula
4. **Resilience** — aborted `.webp` route → zero console/page errors; video `readyState ≥ 2` at `t = 0`
5. **Full suite** — `npm run verify` (anchors, typecheck, lint, build) green; desktop + mobile screenshots; side-by-side composites produced for human eyeball review

## 9. Accepted trade-offs

- The 13-beat flight (~8 screens) pushes the facts further down than a pure landing page would — accepted, mitigated by nav anchors and the sticky WhatsApp bar
- Act 2 repeats the flight's photos only once (`development-towers` band); everything else is type-led by design
- 1376px sources full-bleed on large screens hit a resolution ceiling — accepted (unchanged from before)
- Inventory and trust figures are fictional — covered by the existing footer disclaimer

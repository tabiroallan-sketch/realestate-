# The Verde Residences — Full-Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the site as a sales/lead-gen page — a 13-beat scroll-scrubbed photo-flight over a dark-cinematic buyer funnel (facts + WhatsApp conversion), superseding the old 10-phase roadmap.

**Architecture:** Act 1 is a single tall `#hero` section (800svh) with a sticky viewport over the fixed WebGL canvas; the flight's 13 waypoints drive it, and the canvas comes up as photo planes (one generated webp per beat) crossfading on scroll. Act 2 is ordinary server-rendered sections (development, residences, amenities, location, availability, trust, close) that scroll up over the resting night frame. Chrome (nav, sticky WhatsApp bar, progress line) and tokens are reworked to the approved dark-cinematic system.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, three 0.186 / R3F 9.8 / drei 10.7, GSAP 3.15 + Lenis, Playwright + sharp verify scripts (the repo's test convention — there is no unit-test framework).

**Spec:** `docs/superpowers/specs/2026-10-07-full-site-redesign-design.md` (committed `c51cb28`). Mechanics law inherited from `docs/superpowers/specs/2026-10-07-phase-2-photo-plane-journey-design.md` (amended, uncommitted) — its formulas and resilience rules remain binding; this plan re-keys its beats/constants.

## Global Constraints

- **Zero new runtime dependencies** (spec §7). Verification scripts may only use already-present devDeps (playwright, sharp) and node builtins.
- **Mechanics law (binding, spec §3):** fit `height = 2·d·tan(fov/2)·1.03`, `width = height·(16/9)`; crossfade `s = smoothstep(A+0.4·(B−A), B−0.4·(B−A), t)` with complementary weights, `sum ≥ 0.999` at every `t`; reduced motion = step-cut (exactly one beat visible, video → poster, Ken Burns off); Ken Burns `1 + 0.04·smoothstep`; near-clip fade `smoothstep(2, 6, distance)`; backdrop sphere r800, position-follow only, 16×16 downscale, ink `#0A0C0B` fallback; materials unlit / `transparent` / `depthWrite:false` / `toneMapped:false`, 6% feathered border; plane depths: default **90**, interiors (lobby, lobby-detail, residence, living) **130**, threshold **70**.
- **Waypoint field order frozen:** `id, position, target, fov, t, label` — `scripts/journey.mjs` and `scripts/lib/waypoints.mjs` parse it with regex.
- **Palette (spec §4):** ground `#0A0C0B` · surface `#10130F` · ivory `#E8E2D5` · bronze `#B98A45` · muted `#8F897C` · body `#A39D91` · hairline `rgba(232,226,213,.12)`.
- **Copy voice:** quiet luxury, hard specifics — a number, material, minute or name per line. No superlatives. All strings in `src/data/site.ts`.
- **Primary CTA:** WhatsApp (`https://wa.me/254700000000`) / phone (`tel:`) everywhere; persistent bottom WhatsApp bar always visible on phones (spec §2 chrome).
- **Bijection rule:** every `<section id>` on the page is a `chapters` entry in `navigation.ts` and vice versa (`smoke.mjs` asserts `section[id]` count === chapters length; `verify-anchors.mjs` resolves each chapter).
- **Import rules (Node/TS constraints, proven empirically):** `photoPlans`-style files imported by `.mjs` tests must be **zero-import** `.ts` files; `.mjs → ../src/….ts` imports use explicit `.ts` extensions; TS→TS imports use `@/` aliases with **no** extensions (no `allowImportingTsExtensions` in tsconfig).
- **Server hygiene:** `npm run verify` (build) corrupts a running `next start` on :3000 — kill :3000 and restart (`Start-Process cmd /c "npm start > scripts\screenshots\reference\server.log 2>&1" -WindowStyle Hidden`, sleep 7) before any Playwright suite. Suites die if their shell times out; start server + run suite in one command when needed.
- **Deleted code (spec §5):** `CustomCursor`; procedural journey components `Sky`, `Atmosphere`, `City` (incl. `Ground`), `TowerCluster`, `WindowLights`, `useDayCycle` — deleted with their now-unused exports (`TOWER_STOREYS`, `STOREY_HEIGHT`, `TOWER_HEIGHT`, `CHAPTER_WAYPOINT`). Old DOM sections/components: `Hero.tsx`, old `Development.tsx`, `EditorialChapter.tsx`, and `sections` keys `lobby, residence, balcony, rooftop, dayNight, exploded, masterplan`.
- **Commits:** one per task, green suite first. Include any regenerated `AGENTS.md` block with the work (per its header). Never push.

## Review Focus

1. **Flight scroll span** — if `#hero` is not both journey start and end (or the probe samples the document instead of the flight), the camera freezes mid-flight or runs out of path. → Test: `journey.mjs` flight-change check rewritten to flight-relative scroll positions, plus per-waypoint accuracy (Task 3).
2. **Chapters ↔ sections bijection** — a stray section id or a nav link to a deleted id breaks `smoke.mjs` (count equality) and `verify-anchors.mjs` silently. → Test: `verify-anchors.mjs` + `smoke.mjs` no-WebGL chapter count (Task 4), `verify-content.mjs` chapter check (Task 2 onward).
3. **Crossfade sum regression** — non-complementary weights create a see-through moment between beats (black flash over the backdrop). → Test: `verify-plane-math.mjs` sweep asserting `sum ≥ 0.999` at every `t` and exactly-one-visible under reduced motion (Task 6).
4. **Waypoint regex parse** — re-authoring waypoints must keep field order or `journey.mjs`/capture parsers silently see fewer beats. → Test: waypoint-count check bumped to 13 run red-before-green (Task 5); `loadWaypoints()` used by capture/compare (Task 8).
5. **Texture-load timing** — fingerprints taken before the 13 webps arrive compress to near-uniform and fail `bytes > 20_000`, or the gate compares a poster-less frame. → Test: deterministic `window.__verdePlanesReady` seam awaited by `journey.mjs` and capture before fingerprinting (Task 7/8); console-clean + readyState checks in `verify-plane-resilience.mjs` (Task 7).
6. **Hydration mismatch on the no-WebGL fallback** — server HTML must be the WebGL layout; the stacked-stills branch only appears post-mount. → Test: `smoke.mjs` console-error assertions across all viewports + the webgl-disabled block (Task 3).

---

## File Structure

**Create**
- `src/components/chrome/WhatsAppBar.tsx` — persistent bottom WhatsApp bar (mobile, always visible)
- `src/components/journey/FlightShell.tsx` — `#hero` section: sticky viewport, hero overlay, no-WebGL stacked-stills fallback
- `src/data/beats.ts` — `BEATS`: 13 × `{ id, assetKey, depth, label }` (the film's beat table)
- `src/components/funnel/` — `Development.tsx`, `ResidenceCollection.tsx`, `Amenities.tsx`, `LocationStrip.tsx`, `Availability.tsx`, `Trust.tsx`, `Close.tsx`, plus shared `SectionHeader.tsx`, `UnitCard.tsx`, `AvailabilityRow.tsx`, `StatBlock.tsx`
- `src/journey/photoPlanes.ts` — zero-import math: fit, crossfade weights, step-cut, poses, opacity
- `src/journey/PhotoPlane.tsx`, `src/journey/VideoPlane.tsx`, `src/journey/Backdrop.tsx` — the photo flight
- `src/journey/ready.ts` — `initPlaneReady(n)` / `markPlaneReady()` → `window.__verdePlanesReady`
- `scripts/verify-content.mjs` — static data invariants (site.ts + navigation.ts)
- `scripts/verify-plane-math.mjs` — math/coverage gate (added to `verify` chain)
- `scripts/verify-plane-resilience.mjs` — texture-abort + video-ready browser gate
- `scripts/lib/waypoints.mjs` — shared waypoint regex reader for capture/compare

**Modify**
- `src/app/globals.css` — palette tokens to spec §4
- `src/app/page.tsx` — FlightShell + funnel assembly + night-dissolve gradient
- `src/data/site.ts` — `whatsappBase`, `hours`, `availability`, `trust`, `sections.availability/trust`, contact copy, hero CTA, deletions
- `src/data/navigation.ts` — nav links, 8 chapters, WhatsApp CTA
- `src/components/Experience.tsx` — drop `CustomCursor`, mount `WhatsAppBar`
- `src/components/chrome/Navigation.tsx` — translucent→solid, WhatsApp pill
- `src/components/chrome/SiteFooter.tsx` — mobile bottom padding for the bar
- `src/journey/waypoints.ts` — 13 waypoints, dead exports removed
- `src/journey/JourneyScene.tsx` — photo planes + backdrop; procedural stripped
- `scripts/journey.mjs` — flight-relative sampling, 13-waypoint check, planes-ready wait
- `scripts/smoke.mjs` — WhatsApp bar + availability + nav assertions
- `scripts/capture-reference.mjs`, `scripts/compare-reference.mjs` — 13-pair photo gate
- `package.json` — `verify:content`, `verify:planes` in the chain; `verify:full` extended

**Delete**
- `src/components/chrome/CustomCursor.tsx`
- `src/components/journey/sections/Hero.tsx`, `…/sections/Development.tsx`, `…/sections/EditorialChapter.tsx`
- `src/journey/environment/Sky.tsx`, `environment/Atmosphere.tsx`, `environment/City.tsx`, `src/journey/TowerCluster.tsx`, `src/journey/WindowLights.tsx`, `src/journey/useDayCycle.ts`
- superseded docs at cleanup: `docs/superpowers/plans/2026-10-07-phase-2-photo-plane-journey.md`, `plan-phase-3.md`

---

### Task 1: Design tokens + chrome rework

**Files:**
- Modify: `src/app/globals.css:9-41` (`@theme` block)
- Create: `src/components/chrome/WhatsAppBar.tsx`
- Modify: `src/components/Experience.tsx:1-45`
- Modify: `src/data/site.ts` (additive: `whatsappBase`, `hours`)
- Modify: `src/data/navigation.ts:13-16` (`navigationCta`)
- Modify: `src/components/chrome/Navigation.tsx:44-57,107-115`
- Modify: `src/components/chrome/SiteFooter.tsx` (mobile bottom padding)
- Modify: `scripts/smoke.mjs` (new assertions)
- Delete: `src/components/chrome/CustomCursor.tsx`

**Interfaces:**
- Consumes: `site.phone`, existing `Button`, `cn`, `data-nav`/`data-scroll-progress`/`data-loader` attributes (capture scripts mask them — keep all three).
- Produces: `site.whatsappBase = "https://wa.me/254700000000"`, `site.hours = "Monday to Saturday, 09:00–18:00 EAT"`; `<WhatsAppBar />` renders `<a data-whatsapp-bar>` fixed bottom, `lg:hidden`, `pb-[env(safe-area-inset-bottom)]`, bronze pill style, label "WhatsApp Sales"; `navigationCta = { label: "WhatsApp", href: "https://wa.me/254700000000" }` (external — `verify-anchors` only checks `#` hrefs).

- [ ] **Step 1: Baseline, then write the failing smoke assertions**

Run `node scripts/smoke.mjs --quick` against the running server — expect existing PASS (restart :3000 first if the build changed). Then in `smoke.mjs`, in the mobile deep block after the nav-menu checks, add:

```js
// Task 1: sticky WhatsApp bar
const bar = page.locator("[data-whatsapp-bar]");
const barVisible = await bar.isVisible();
if (barVisible) {
  const href = await bar.getAttribute("href");
  if (href?.startsWith("https://wa.me/")) ok("sticky WhatsApp bar visible with wa.me link");
  else fail(`sticky bar href is "${href}"`);
} else fail("sticky WhatsApp bar not visible on mobile");
```

and in the desktop (`width >= 1024`) branch of the same block add: `ok/fail` that `barVisible === false` (bar is phones-only), plus at desktop width `header a[href^="https://wa.me/"]` count ≥ 1 (the header CTA pill — note the pill lives outside `nav[aria-label="Primary"]`).

- [ ] **Step 2: Run smoke, verify the new assertions fail**

Run: `node scripts/smoke.mjs --quick`
Expected: FAIL — "sticky WhatsApp bar not visible on mobile" (component does not exist yet).

- [ ] **Step 3: Tokens + data + chrome**

1. `globals.css` `@theme`: `--color-ink-raised: #10130f`, `--color-ivory: #e8e2d5`, `--color-bronze: #b98a45`, `--color-bronze-dim: rgba(185,138,69,.55)`, `--color-ivory-dim: rgba(232,226,213,.62)`, `--color-ivory-faint: rgba(232,226,213,.38)`, `--color-hairline: rgba(232,226,213,.12)`, `--color-hairline-strong: rgba(232,226,213,.28)`, add `--color-muted: #8f897c` and `--color-body: #a39d91`. Then `rg -n "f2efe9|a68a64|2a3f52" src` and update any remaining literals to the new palette (keep `--color-glass`/`--color-verdant` only if still referenced; they are procedural-scene leftovers — delete if unused).
2. `site.ts`: add `whatsappBase` and `hours` exactly as in Interfaces.
3. `navigation.ts`: replace `navigationCta` with the WhatsApp entry.
4. Create `WhatsAppBar.tsx` per Interfaces (client component, `fixed inset-x-0 bottom-0 z-80 lg:hidden`, solid `bg-bronze text-ink` row with `WhatsApp Sales` label + phone number, `aria-label="Contact sales on WhatsApp"`); mount it in `Experience.tsx` after `<ScrollProgress />`.
5. Delete `CustomCursor` component + its `Experience` import. Run `rg -n "CustomCursor|data-cursor" src scripts` — remaining script references to `[data-cursor]` are harmless no-ops (keep them).
6. `Navigation.tsx`: not-condensed bar → `bg-ink/60 backdrop-blur-sm`, condensed/menuOpen → `bg-ink/95 backdrop-blur-md hairline-b` (replaces `bg-ink hairline-b`). CTA pill: `bg-bronze text-ink border-transparent hover:opacity-90`.
7. `SiteFooter.tsx`: add `pb-16 lg:pb-0` to the footer root so the bar never covers footer content.
8. `ScrollProgress.tsx`: already renders the spec's thin bronze line (2 px top rule on mobile, hairline vertical rail on desktop) and adapts to `chapters` automatically — no restyle needed. Only add `data-scroll-progress` to the mobile top-rule div so capture scripts can mask it.

- [ ] **Step 4: Run full verify + smoke**

Run: `npm run verify` then restart :3000 then `node scripts/smoke.mjs --quick`
Expected: all PASS (including the new bar assertions), zero console errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: dark-cinematic tokens, WhatsApp chrome, drop custom cursor"
```

---

### Task 2: Content data + verify-content gate

**Files:**
- Modify: `src/data/site.ts` (additive only — no deletions, no href changes yet)
- Create: `scripts/verify-content.mjs`
- Modify: `package.json:11` (insert `verify:content` first in the `verify` chain)

**Interfaces:**
- Consumes: `architecture.residences` (84), `architecture.storeys` (22), `residenceTypes` (4 typologies with `id`, `interior`, `range` "From KES N.NM").
- Produces (all exported from `site.ts`, exact):

```ts
export const availability = {
  total: 84, remaining: 37, asOf: "October 2026",
  rows: [
    { unit: "A-0402", type: "studio",    floor: 4,  size: "48 m²",  price: "KES 5.4M",  priceValue: 5.4,  status: "Available" },
    { unit: "B-0905", type: "one-bed",   floor: 9,  size: "86 m²",  price: "KES 9.2M",  priceValue: 9.2,  status: "Available" },
    { unit: "C-1103", type: "two-bed",   floor: 11, size: "132 m²", price: "KES 14.5M", priceValue: 14.5, status: "On hold" },
    { unit: "A-1504", type: "one-bed",   floor: 15, size: "86 m²",  price: "KES 9.6M",  priceValue: 9.6,  status: "Available" },
    { unit: "B-1802", type: "two-bed",   floor: 18, size: "132 m²", price: "KES 15.1M", priceValue: 15.1, status: "Available" },
    { unit: "C-2101", type: "penthouse", floor: 21, size: "284 m²", price: "KES 38M",   priceValue: 38,   status: "Available" },
  ],
} as const;

export const trust = {
  founded: 2009, homes: 1240, completedProjects: 6, towersUnderConstruction: 6,
} as const;

export const sections = { /* existing keys unchanged, plus: */
  availability: { id: "availability", eyebrow: "Availability",
    headline: "37 Of 84 Still Available.",
    body: "A snapshot as of October 2026 — six representative units below. Current pricing, floor-by-floor inventory and payment terms are confirmed on WhatsApp." },
  trust: { id: "trust", eyebrow: "The Developer",
    headline: "Building In Nairobi Since 2009.",
    body: "Verde Development Partners has handed over 1,240 homes across six completed projects. Six towers are under construction today." },
} as const;
```

- Consumes later: `verify-content.mjs` exports nothing; it exits 0/1.

- [ ] **Step 1: Write the failing test `scripts/verify-content.mjs`**

```js
import { site, sections, architecture, residenceTypes, availability, trust } from "../src/data/site.ts";
import { chapters, navigation, navigationCta } from "../src/data/navigation.ts";
```

(Node 24 type-stripping; both files are import-free — that is a standing rule.) Assertions, each printing `PASS/FAIL label` like the other scripts:

1. `availability.total === architecture.residences` (84) and `availability.remaining === 37` and `remaining < total`; `asOf === "October 2026"`.
2. `rows.length` between 5 and 8 inclusive.
3. Every row: `floor` integer `1..architecture.storeys`; `type` ∈ `residenceTypes[].id`; `size` === that typology's `interior`; `priceValue` ≥ (number parsed from that typology's `range`, e.g. "From KES 5.4M" → 5.4); `status` ∈ `["Available", "On hold"]`; `price` starts with `"KES "`.
4. `trust.founded` ≤ 2026; `trust.homes === 1240`; `trust.towersUnderConstruction === 6`.
5. `/^https:\/\/wa\.me\/254\d{9}$/.test(site.whatsappBase)`; `site.hours` includes "09:00".
6. Every `chapters[].id` and every `#`-target in `navigation[].href`, `navigationCta` (if `#`), and `hero.primaryCta/secondaryCta.href` ∈ `sections.*.id` **∪ `{"hero"}`** (`hero` is the literal flight-section id, never a `sections` key — the same union `verify-anchors.mjs` accepts via rendered ids).
7. `hero.secondaryCta` exists (value still `#masterplan` at this task — membership check only; it changes in Task 4).

- [ ] **Step 2: Run it, verify it fails**

Run: `node scripts/verify-content.mjs`
Expected: FAIL — `availability`/`trust` are not defined (import error).

- [ ] **Step 3: Add the data to `site.ts` exactly as specified in Interfaces**

- [ ] **Step 4: Run it, verify it passes; wire into package.json**

Run: `node scripts/verify-content.mjs` → PASS.
`package.json`: `"verify": "npm run verify:content && npm run verify:anchors && npm run typecheck && npm run lint && npm run build"`, add `"verify:content": "node scripts/verify-content.mjs"`.

- [ ] **Step 5: Run full verify, then commit**

Run: `npm run verify` → PASS.
```bash
git add -A
git commit -m "feat: availability + trust inventory data with content gate"
```

---

### Task 3: Flight shell (Act 1 layout) + journey span re-key

**Files:**
- Create: `src/data/beats.ts`
- Create: `src/components/journey/FlightShell.tsx`
- Modify: `src/app/page.tsx:18-22` (swap `Hero` → `FlightShell`)
- Modify: `src/journey/waypoints.ts:144-146` (`JOURNEY_END_ID`)
- Modify: `scripts/journey.mjs:100-122` (flight-relative scroll sampling)
- Delete: `src/components/journey/sections/Hero.tsx`

**Interfaces:**
- Consumes: `useCanvasReady`, `useReducedMotion`, `ResponsivePicture`, `assets.heroPoster`, `site`/`hero` data, existing GSAP patterns from `Hero.tsx` (which this task absorbs and deletes).
- Produces:
  - `src/data/beats.ts`: `export type Beat = { id: string; assetKey: AssetKey; depth: number; label: string }; export const BEATS: readonly Beat[]` — 13 entries in flight order:

    | # | id | assetKey | depth | label |
    |---|----|----------|-------|-------|
    | 1 | `arrival` | `heroPoster` | 90 | Arrival |
    | 2 | `towers` | `heroTowers` | 90 | The Towers |
    | 3 | `development` | `developmentTowers` | 90 | Development View |
    | 4 | `threshold` | `entranceStreet` | 70 | Threshold |
    | 5 | `lobby` | `lobbyWide` | 130 | Lobby |
    | 6 | `lobby-detail` | `lobbyDetail` | 130 | Lobby Detail |
    | 7 | `residence` | `residenceLiving` | 130 | Residence Interior |
    | 8 | `living` | `livingRoom` | 130 | Living Room |
    | 9 | `view` | `balconySkyline` | 90 | The View |
    | 10 | `rooftop-rise` | `rooftopRise` | 90 | Rooftop Rise |
    | 11 | `rooftop-pool` | `rooftopPool` | 90 | Rooftop Pool |
    | 12 | `night-facade` | `nightFacade` | 90 | Night Facade |
    | 13 | `night` | `nightIlluminated` | 90 | Night |

    (Asset keys must be verified against `src/data/assets.ts` while writing; the video key `heroVideo` is used by Task 7, not here.)
  - `FlightShell` renders `<section id="hero">` preserving every probe contract: `data-hero-photo` poster layer (fades on `useCanvasReady()`), `data-hero-scrim`, `h1#hero-heading`, `.display-xl` two-line headline, at least one `p.body-copy`, ≥1 `<a>` inside `[data-hero-cta]` blocks, first `<img>` = poster (`ResponsivePicture`, `priority`).
  - Layout — WebGL branch (default, matches server HTML): `<div className="relative h-[800svh]"><div className="sticky top-0 h-[100svh] overflow-hidden">…viewport…</div></div>`. Viewport holds poster layer, scrim, overlay content, scroll hint (same visual structure as old `Hero`).
  - Fallback branch — `const [stack, setStack] = useState(false); useEffect(() => { if (!useWebGLSupport-result) setStack(true); }, [])` (call `useWebGLSupport()` as a hook, flip in effect — server HTML = WebGL branch, so no hydration mismatch). When `stack`: render the poster+overlay as a `min-h-[100svh]` first screen (poster layer keeps `data-hero-photo`, stays opacity 1 because `markCanvasReady` never fires) followed by the remaining 12 beats as `<figure>`s, each `h-[50vh] w-full`, `ResponsivePicture` (`loading="lazy"`) with a `caption` label from `BEATS`. Section height becomes content-driven.
  - Overlay fade: GSAP scrub over the first `120svh` — `[data-hero-content]` opacity `1→0`, and `pointer-events: none` toggled once opacity < 0.05 (so the CTA is un-clickable once faded; the journey probe reads it at scroll 0 where it is fully visible). Under reduced motion: opacity-only (no transforms), same range.
- `JOURNEY_END_ID = "hero"` (span = the flight section alone; `useScrollProgress` needs no changes).

- [ ] **Step 1: Write `src/data/beats.ts`** with the exact table above.

- [ ] **Step 2: Write `FlightShell.tsx`, swap it into `page.tsx`, delete `Hero.tsx`**

Absorb the old Hero's markup/GSAP timeline into the overlay; add the sticky wrapper, the content-fade scrub, and the fallback stack. Keep `id="hero"` on the `<section>`.

- [ ] **Step 3: Set `JOURNEY_END_ID = "hero"`** in `waypoints.ts` (update the comment: the canvas spans the flight section).

- [ ] **Step 4: Re-key journey scroll sampling to flight-relative positions**

In `scripts/journey.mjs`, replace the document-fraction sampling:

```js
const flight = await page.evaluate(() => {
  const el = document.getElementById("hero");
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: el.offsetHeight };
});
const mid = Math.round(flight.top + flight.height * 0.55);
const late = Math.round(flight.top + flight.height - 900); // last viewport of the flight → progress 1
```

Keep `scrollTo(0)` for `frameHero`. (`late` must land exactly at `progress = 1`: `end: "bottom bottom"` of the same element.)

- [ ] **Step 5: Run the suites**

Run: `npm run verify` → PASS.
Restart :3000, then: `node scripts/journey.mjs` → expect PASS — canvas mounted, hero photo faded, `frameHero ≠ frameMid ≠ frameLate`, hero CTA clickable at scroll 0, accuracy green, reduced/no-WebGL/mobile green; **no hydration errors** in the console tally (Review Focus 6).
Run: `node scripts/smoke.mjs --quick` → PASS (chapter list unchanged this task).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 800svh flight shell with sticky viewport and stacked-still fallback"
```

---

### Task 4: Act 2 funnel sections + navigation re-key + deletions

**Files:**
- Create: `src/components/funnel/` — `SectionHeader.tsx`, `UnitCard.tsx`, `AvailabilityRow.tsx`, `StatBlock.tsx`, `Development.tsx`, `ResidenceCollection.tsx`, `Amenities.tsx`, `LocationStrip.tsx`, `Availability.tsx`, `Trust.tsx`, `Close.tsx`
- Modify: `src/app/page.tsx` (full assembly)
- Modify: `src/data/site.ts` (hero CTA, contact copy, delete 7 section keys)
- Modify: `src/data/navigation.ts` (links + chapters)
- Modify: `scripts/smoke.mjs` (funnel assertions)
- Delete: `src/components/journey/sections/Development.tsx`, `…/sections/EditorialChapter.tsx`

**Interfaces:**
- Consumes: `sections.{development,residences,amenities,location,availability,trust,contact}`, `residenceTypes`, `amenitiesList`, `locationPoints`, `availability`, `trust`, `site.{whatsappBase,phone,phoneHref,hours,address}`, `assets.developmentTowers`, UI primitives `Section`-style shell classes, `Eyebrow`, `Button`, `Reveal`, `ResponsivePicture`.
- Produces:
  - **Page order:** `<FlightShell />` → `<div className="relative bg-ink">` containing the dissolve gradient `<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60svh] -translate-y-full bg-gradient-to-b from-transparent to-[#0a0c0b]" />` then `Development, ResidenceCollection, Amenities, LocationStrip, Availability, Trust, Close` → `<SiteFooter />`.
  - Every section: `<section id=…>` with `scroll-mt-[var(--nav-h)]`, `py-[clamp(4rem,12vh,9rem)]` **equal top and bottom** (audit-layout checks balance), content in `.shell` grid. IDs: `development`, `residences`, `amenities`, `location`, `availability`, `trust`, `contact` — exactly the 8 chapters incl. `hero`, no other `<section id>` anywhere on the page.
  - `navigation.ts`: `navigation = [{label:"Residences",href:"#residences"},{label:"Amenities",href:"#amenities"},{label:"Availability",href:"#availability"},{label:"Contact",href:"#contact"}]`; `chapters = [ {id:"hero",index:"01",label:"The Flight"}, {id:"development",index:"02",label:"The Development"}, {id:"residences",index:"03",label:"Residences"}, {id:"amenities",index:"04",label:"Amenities"}, {id:"location",index:"05",label:"Location"}, {id:"availability",index:"06",label:"Availability"}, {id:"trust",index:"07",label:"The Developer"}, {id:"contact",index:"08",label:"Enquire"} ]`.
  - `site.hero.secondaryCta = { label: "View Availability", href: "#availability" }`.
  - `sections.contact` replaced: `eyebrow: "Enquire"`, `headline: "Book A Viewing."`, `body: "Sales gallery on Upper Hill Road, Westlands. Open ${site.hours}. Viewings by appointment; construction tours once the towers pass Level 08."` — CTAs in the component: bronze WhatsApp pill (`site.whatsappBase`) + `tel:` link. No brochure.
  - **Development:** full-bleed `developmentTowers` band (`h-[46svh]`, `object-cover`, `loading="lazy"`), facts grid (3 towers / 22 storeys / Q4 2027 / Upper Hill Road) and the 4 `architecture.materials` as a list. Must render an `h2` and ≥1 `p` (smoke reduced-motion check probes `#development h2, p, li`).
  - **ResidenceCollection:** `UnitCard` × 4 — Bodoni name, Jost typology + interior, `range` as numeral, note as body copy. No card CTA.
  - **Amenities:** 4 groups from `amenitiesList` — eyebrow group name + `<ul>` of items. No photos.
  - **LocationStrip:** `locationPoints` as a wrap row of `label` + minute numeral. No map.
  - **Availability:** header stat `37 / 84` + `asOf` + lede; 6 `AvailabilityRow`s — each `<li data-availability-row>` with unit, typology name, floor, size, price, status chip (`Available` = `border border-bronze text-bronze`, `On hold` = `border border-hairline text-ivory-faint`), and an `<a href={site.whatsappBase + "?text=" + encodeURIComponent(\`Enquiry about ${unit} — ${type} — ${size} — ${price} at The Verde Residences.\`)}>` with visually-hidden "Enquire … on WhatsApp". Footnote: full inventory via WhatsApp.
  - **Trust:** `StatBlock` × 3 — figure over caps label: `2009 / Founded`, `1,240 / Homes handed over`, `6 / Towers under construction` + `sections.trust.body`.
  - **Close:** `sections.contact` copy + WhatsApp pill + phone link + address lines.
  - `site.ts` deletions: section keys `lobby, residence, balcony, rooftop, dayNight, exploded, masterplan`.

- [ ] **Step 1: Write the failing smoke additions**

In `smoke.mjs` deep blocks (both viewports), before the error tally:

```js
// funnel contract
const rows = await page.locator("#availability [data-availability-row]").count();
if (rows >= 5 && rows <= 8) ok(`availability rows: ${rows}`); else fail(`availability rows: ${rows}`);
const waLinks = await page.locator('#availability a[href^="https://wa.me/"]').count();
if (waLinks === rows) ok("every availability row links to WhatsApp"); else fail(`${waLinks} wa.me links for ${rows} rows`);
const navHasAvailability = await page.locator('nav[aria-label="Primary"] a[href="#availability"]').count();
if (vp.width >= 1024) { navHasAvailability === 1 ? ok("nav links Availability") : fail("nav missing #availability link"); }
```

(Existing assertions — chapter reachability, `section[id]` count === chapters length, hero h1/img, reduced-motion `#development`, webgl-disabled chapter count — re-run against the new page and must stay green.)

- [ ] **Step 2: Run smoke, verify new assertions fail**

Run: `node scripts/smoke.mjs --quick` → FAIL (no `#availability`).

- [ ] **Step 3: Build the funnel**

Create the `funnel/` components per Interfaces; assemble `page.tsx` with the dissolve gradient; update `site.ts` (hero CTA, contact replacement, 7 key deletions); update `navigation.ts`; delete old `Development.tsx` + `EditorialChapter.tsx`. Two spec checks while you are in there: (a) the shared `Eyebrow` component must render Jost caps 10 px / `.24em` tracking / bronze (spec §4 — adjust it if the current values differ); (b) `rg -n "Masterplan|LocationMap|location-map" src` and delete any leftover map/masterplan components or SVG assets (spec §5 — they may never have existed, in which case the search just comes back clean).

- [ ] **Step 4: Run the full gate battery**

Run: `npm run verify` (includes `verify-content` — its chapter check now proves the bijection) → PASS.
Restart :3000, then `node scripts/smoke.mjs` (full) → PASS, `node scripts/journey.mjs` → PASS, `node scripts/audit-layout.mjs` → PASS (watch: balanced padding, no overlaps, mobile hero CTAs above fold).
If audit flags an unequal-padding section, fix that section's `py` (keep top/bottom identical).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: buyer-funnel Act 2, availability snapshot, nav re-key"
```

---

### Task 5: Waypoints 9 → 13

**Files:**
- Modify: `src/journey/waypoints.ts` (WAYPOINTS table, dead exports)
- Modify: `scripts/journey.mjs:358-362` (count check)

**Interfaces:**
- Consumes: nothing new — `CameraRig`/`authoredToU` read `WAYPOINTS` unchanged.
- Produces: `WAYPOINTS: Waypoint[]` — 13 entries, **exact** (field order frozen):

| id | position | target | fov | t | label |
|----|----------|--------|-----|---|-------|
| `arrival` | `[-115, 60, 130]` | `[0, 37, 0]` | 40 | 0 | Far aerial — arrival drift |
| `towers` | `[-64, 46, 80]` | `[-6, 38, 4]` | 44 | 0.10 | The towers, day exterior |
| `development` | `[-48, 30, 70]` | `[-4, 30, 2]` | 46 | 0.18 | All three towers |
| `threshold` | `[-34, 12, 62]` | `[-4, 15, 6]` | 52 | 0.30 | Threshold at street level |
| `lobby` | `[10, 6, 20]` | `[4, 6, -6]` | 38 | 0.42 | Lobby — wide |
| `lobby-detail` | `[14, 5, 6]` | `[6, 7, -14]` | 34 | 0.48 | Lobby — sculptural stair |
| `residence` | `[26, 5, -4]` | `[12, 4, -22]` | 34 | 0.56 | Residence interior |
| `living` | `[30, 5, -14]` | `[16, 4, -34]` | 36 | 0.62 | Living room, second angle |
| `view` | `[30, 4, -30]` | `[4, 6, -84]` | 48 | 0.70 | Balcony — city reveal |
| `rooftop-rise` | `[18, 58, 40]` | `[2, 50, -8]` | 46 | 0.78 | Rising over the roof |
| `rooftop-pool` | `[6, 74, 26]` | `[0, 64, -6]` | 50 | 0.85 | Rooftop pool — skyline |
| `night-facade` | `[-40, 34, 74]` | `[-2, 34, 4]` | 44 | 0.93 | Night facade, fins lit |
| `night` | `[-96, 58, 118]` | `[0, 40, 0]` | 42 | 1.00 | Night — towers illuminated |

  Also: delete `CHAPTER_WAYPOINT` (dead — confirm with `rg -n "CHAPTER_WAYPOINT" src` first), delete `TOWER_STOREYS/STOREY_HEIGHT/TOWER_HEIGHT` only if Task 7 already ran (they are still used by the procedural scene until then — this task must leave them in place if the scene still imports them; run `rg -n "STOREY_HEIGHT|TOWER_" src/journey` and keep whatever is still imported). Keep `JOURNEY_START_ID`/`JOURNEY_END_ID` = `"hero"`/`"hero"` with an updated comment.

- [ ] **Step 1: Bump the journey count check (red first)**

`journey.mjs`: `check("waypoints parsed from source", authoredWaypoints.length === 13, …)`.
Run: `node scripts/journey.mjs` (server up) → FAIL with `9 found`.

- [ ] **Step 2: Rewrite `WAYPOINTS` to the exact table above**

- [ ] **Step 3: Run journey + verify**

Run: `node scripts/journey.mjs` → PASS: 13 parsed, every `camera lands on <id>` within 1 unit (data-driven accuracy), flight-change + all DOM checks green — the procedural scene renders the new path without changes.
Run: `npm run verify` → PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: re-author flight as 13 waypoints ending on night"
```

---

### Task 6: photoPlanes math + verify-plane-math gate

**Files:**
- Create: `src/journey/photoPlanes.ts` (ZERO imports — `AnchorLike` defined locally)
- Create: `scripts/verify-plane-math.mjs`
- Modify: `package.json` (`verify:planes` script + add to `verify` chain)

**Interfaces:**
- Consumes: `WAYPOINTS` (passed as an argument — the file cannot import it).
- Produces (exact signatures):

```ts
export type AnchorLike = {
  id?: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  t: number;
};
export const ASPECT: number;            // 16 / 9
export const FIT_EPSILON: number;       // 1.03
export function planeHeight(distance: number, fovDeg: number): number;  // 2·d·tan(fov/2)·1.03
export function planeWidth(distance: number, fovDeg: number): number;   // height · ASPECT
export function crossfadeWindow(a: number, b: number): [number, number]; // [a+0.4(b−a), b−0.4(b−a)]
export function weightsInto(t: number, anchorTs: readonly number[], out: number[]): number[]; // complementary ramps, Σ≥0.999, writes anchorTs.length entries
export function beatWeights(t: number, anchorTs: readonly number[]): number[]; // allocates; calls weightsInto
export function activeBeat(t: number, anchorTs: readonly number[]): number;    // argmax — reduced-motion step-cut
export function planePose(anchors: readonly AnchorLike[], beatIndex: number, depth: number):
  { position: [number, number, number]; height: number; width: number };
  // position = anchor.position + normalize(target−position)·depth; height/width from planeHeight/Width(depth, anchor.fov)
export function planeOpacity(weight: number, distanceToCamera: number): number;
  // weight · smoothstep(2, 6, distanceToCamera); 0 when weight ≤ 0.002
export function kenBurnsScale(weight: number, reduced: boolean): number; // reduced ? 1 : 1 + 0.04·smoothstep(0,1,weight)
```

  Weight construction (the crossfade law): ramp-in of segment `i→i+1` is `smoothstep` over `crossfadeWindow(ts[i], ts[i+1])`; `weight[0]` has no ramp-in, `weight[last]` no ramp-out. Inside any window exactly two weights are non-zero and complementary (`1−s`, `s`); between windows exactly one equals 1.

- [ ] **Step 1: Write the failing test `scripts/verify-plane-math.mjs`**

Imports: `import { WAYPOINTS } from "../src/journey/waypoints.ts"` and `import { … } from "../src/journey/photoPlanes.ts"`. Assertions:

1. `waypoints.ts` parse: 13 entries; `t[0] === 0`, `t[12] === 1`, strictly increasing (also guards the frozen field order — reuse the regex from `journey.mjs` so the parser itself is exercised).
2. Fit formula: `planeHeight(90, 38)` and `planeWidth(90, 38)` equal inline `2*90*Math.tan(38*Math.PI/360)*1.03` / `×16/9` within 1e-9.
3. For each `i`: `beatWeights(WAYPOINTS[i].t, ts)[i] ≥ 0.9999` and all other entries ≤ 1e-6; `activeBeat(WAYPOINTS[i].t, ts) === i`.
4. Sweep `t = 0…1 step 0.001`: `Σ weights ≥ 0.999`; `weights.filter(w => w > 0.001).length ≤ 2`; `const a = activeBeat(t, ts)` satisfies `0 ≤ a ≤ 12` and `weights[a] ≥ 0.5` (⇒ exactly one beat ≥ half-visible — the step-cut guarantee).
5. `planePose`: for every beat at its own depth (130 interiors / 70 threshold / 90 else, read from `BEATS`-equivalent table hardcoded in the test): `hypot(pose.position − anchor.position) ≈ depth` (±1e-6), unit direction dot product with `(target − position)` ≈ 1, `pose.height === planeHeight(depth, fov)`.

- [ ] **Step 2: Run it, verify it fails**

Run: `node scripts/verify-plane-math.mjs` → FAIL (module not found).

- [ ] **Step 3: Implement `src/journey/photoPlanes.ts`** per Interfaces (self-contained: local `smoothstep`, `clamp`; no imports of any kind).

- [ ] **Step 4: Run it, verify it passes; wire into package.json**

Run: `node scripts/verify-plane-math.mjs` → PASS.
`"verify": "npm run verify:content && npm run verify:anchors && npm run verify:planes && npm run typecheck && npm run lint && npm run build"`, plus `"verify:planes": "node scripts/verify-plane-math.mjs"`.

- [ ] **Step 5: Run full verify, then commit**

Run: `npm run verify` → PASS.
```bash
git add -A
git commit -m "feat: photo-plane fit/crossfade math with coverage gate"
```

---

### Task 7: The photo flight — Backdrop, PhotoPlane, VideoPlane, scene rewire, resilience

**Files:**
- Create: `src/journey/ready.ts`, `src/journey/Backdrop.tsx`, `src/journey/PhotoPlane.tsx`, `src/journey/VideoPlane.tsx`
- Create: `scripts/verify-plane-resilience.mjs`
- Modify: `src/journey/JourneyScene.tsx` (whole scene graph), `scripts/journey.mjs` (planes-ready wait)
- Modify: `package.json` (`verify:resilience` documented; run manually + in `verify:full`)
- Delete: `src/journey/environment/Sky.tsx`, `environment/Atmosphere.tsx`, `environment/City.tsx`, `src/journey/TowerCluster.tsx`, `src/journey/WindowLights.tsx`, `src/journey/useDayCycle.ts` (and now-dead exports in `waypoints.ts` + any `quality.skyline`/`useSkylineCount` plumbing)

**Interfaces:**
- Consumes: `photoPlanes.ts` math (Task 6), `BEATS` (Task 3), `WAYPOINTS`, `journey` store (`journey.progress.value`), `useReducedMotion`, `usePointerParallax`, `useFrameloopGate`, `AdaptiveQuality`, `CameraRig`, `markCanvasReady`, `journeyProbe` (`.enabled`), `assets` (incl. `assets.heroVideo`), `smoothstep`-family functions.
- Produces:
  - `ready.ts`: `initPlaneReady(expected: number)`, `markPlaneReady()` — when count ≥ expected, set `window.__verdePlanesReady = true`. `JourneyScene` calls `initPlaneReady(BEATS.length)` in an effect (children effects run before the parent's — textures are async, so the count is safe); every plane calls `markPlaneReady()` on texture load (VideoPlane on poster-texture load).
  - `Backdrop`: `<mesh>` sphere `r=800`, `side: BackSide`, unlit `MeshBasicMaterial` (`toneMapped:false`, `depthWrite:false`), map = `heroPoster` drawn to a 16×16 canvas (`THREE.CanvasTexture`); `useFrame` copies `camera.position` into the mesh position (no rotation); on image error → `material.color.set("#0A0C0B")`, no map. Renders first (behind everything), `renderOrder` low.
  - `PhotoPlane` props: `{ src: string; beatIndex: number; depth: number }`. Behavior: `useMemo` pose from `planePose(WAYPOINTS, beatIndex, depth)`; texture via `useLoader`/`TextureLoader` (`colorSpace = SRGBColorSpace`, `wrapS/T` default); per-frame in `useFrame`: weight from `weightsInto(t, …)` — compute `anchorTs` once as a module-level `const` — then `const opacity = planeOpacity(weight, camera.position.distanceTo(mesh.position))`, `mesh.visible = opacity > 0`, `scale = kenBurnsScale(weight, reduced)`; material `MeshBasicMaterial` with `transparent`, `depthWrite: false`, `toneMapped: false`, `alphaMap = featherTexture()` (module singleton: 128×128 canvas, opaque inner rect inset 6%, linear alpha ramp to transparent at each edge); texture `onError` → `mesh.visible = false` permanently (no console output). Reduced motion: `weight = (activeBeat === beatIndex) ? 1 : 0` — exactly one plane visible, Ken Burns off.
  - `VideoPlane` props: `{ src: string; poster: string; beatIndex: number; depth: number }`. Creates (off-DOM) `HTMLVideoElement` with `muted, playsInline, autoplay, loop`, `src` from `assets.heroVideo`; material map = poster texture (loaded via TextureLoader → `markPlaneReady()`) until `video.readyState >= 2` AND `!reduced` AND `play()` resolves — then swap to `THREE.VideoTexture`. Same fit/opacity/feather rules as PhotoPlane (depth 90). Probe seam: `if (journeyProbe.enabled) (window as any).__journeyVideo = video;` — `verify-plane-resilience.mjs` reads `window.__journeyVideo.readyState`.
  - `JourneyScene` final graph: `<AdaptiveQuality/> <CameraRig/> <Backdrop/>` + `BEATS.map(b => b.id === "arrival" ? <VideoPlane …/> : <PhotoPlane …/>)` + `<ReadySignal/>`; imports of Sky/Atmosphere/City/Ground/TowerCluster/WindowLights/useDayCycle/useSkylineCount/day/quality.skyline all removed. Keep `useScrollProgress`, `usePointerParallax`, `useFrameloopGate`.
  - `scripts/verify-plane-resilience.mjs`: chromium + swiftshader; context with `route("**/images/**balcony*", r => r.abort())` (aborts one beat's webp — adjust the glob to the actual ladder path); page → `/?journeyProbe=1`; wait for canvas; assertions: **zero console/page errors** (`requestfailed` for the deliberately aborted URL is expected and excluded); `window.__journeyProbe` exists; `window.__journeyVideo.readyState >= 2` within 20 s (skip-with-FAIL if the video never attaches); then a second clean context (no route) asserting `window.__verdePlanesReady === true` within 60 s.

- [ ] **Step 1: Write the failing resilience script**

Run: `node scripts/verify-plane-resilience.mjs` (server up, current build) → FAIL (no `__journeyVideo`, no planes-ready flag).

- [ ] **Step 2: Implement `ready.ts`, `Backdrop`, `PhotoPlane`, `VideoPlane`** per Interfaces.

- [ ] **Step 3: Rewire `JourneyScene` and delete the procedural files**

First `rg -n "environment/Sky|environment/Atmosphere|environment/City|TowerCluster|WindowLights|useDayCycle|STOREY_HEIGHT|TOWER_STOREYS|TOWER_HEIGHT" src` to enumerate every import to remove; delete the files; remove the dead exports from `waypoints.ts`.

- [ ] **Step 4: Add the planes-ready wait to `journey.mjs`**

After `waitForSelector("[data-journey-canvas] canvas")` in the main, reduced-motion, and probe contexts: `await page.waitForFunction(() => (window.__verdePlanesReady === true), { timeout: 60_000 })`, then keep the existing per-context settle waits (bump the main page's 3500 ms → 1000 ms post-flag; reduced/mobile 4000 → 1000 post-flag).

- [ ] **Step 5: Run the full gate battery**

Run: `node scripts/verify-plane-resilience.mjs` → PASS (video readyState, console-clean with an aborted texture, planes-ready).
Run: `npm run verify` → PASS.
Restart :3000, then `node scripts/journey.mjs` → PASS (fingerprints now taken after `__verdePlanesReady`; non-uniform frames; accuracy; reduced; no-WebGL; mobile DPR).
Run: `node scripts/smoke.mjs` and `node scripts/audit-layout.mjs` → PASS, zero failed requests (13 webps + video all load normally).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: photo-plane flight with backdrop, video arrival, resilience gate"
```

---

### Task 8: Reference gate — 13-pair capture + photo-match compare

**Files:**
- Create: `scripts/lib/waypoints.mjs`
- Modify: `scripts/capture-reference.mjs` (SHOTS), `scripts/compare-reference.mjs` (PAIRS + `--gate`)
- Run artifacts: `scripts/screenshots/reference/*.png` (13 captures + composites)

**Interfaces:**
- Consumes: waypoint ts from `waypoints.ts` (regex, same pattern as `journey.mjs`), `assets` source jpgs in `image/`, existing `analyse`/`composite` helpers in `compare-reference.mjs`, probe seam `?journeyProbe=1` + `window.__forceProgress(t)`.
- Produces:
  - `scripts/lib/waypoints.mjs`: `export async function loadWaypoints()` → `[{ id, t }]` parsed from `src/journey/waypoints.ts` (field order frozen). Used by capture and compare so shots can never drift from authored ts.
  - `capture-reference.mjs` `SHOTS` = 13 rows keyed by beat id; `t` comes from `loadWaypoints()` by id (no hand-typed t). Capture waits for `window.__verdePlanesReady === true` **and** `window.__journeyProbe` before `__forceProgress(w.t)` + screenshot `scripts/screenshots/reference/<id>.png`. Beat ids: `arrival, towers, development, threshold, lobby, lobby-detail, residence, living, view, rooftop-rise, rooftop-pool, night-facade, night`.
  - `compare-reference.mjs` `PAIRS` = 13 rows; source `stamp` (unique substring of `image/*.jpg`):

    | beat | stamp | gate |
    |------|-------|------|
    | arrival | `luxury_towers_N._20261005095409` | Pearson ≥ **0.5** (live video vs poster) |
    | towers | `luxury_towers_N._20261005095427` | ≥ 0.8 |
    | development | `development_view_20261005095613` | ≥ 0.8 |
    | threshold | `exterior_street._20261005095442` | ≥ 0.8 |
    | lobby | `lobby_interior_._20261005095500` | ≥ 0.8 |
    | lobby-detail | `Lobby_interior_with_sculptural_s._20261005095447` | ≥ 0.8 |
    | residence | `Luxury_apartment_interior_view_20261005095506` | ≥ 0.8 |
    | living | `Luxury_apartment_living_room_int._20261005095512` | ≥ 0.8 |
    | view | `Balcony_view_of_Nairobi_skyline_20261005095517` | ≥ 0.8 |
    | rooftop-rise | `Camera_rising_over_building_rooftop_20261005095523` | ≥ 0.8 |
    | rooftop-pool | `Rooftop_pool_overlooking_Nairobi._20261005095537` | ≥ 0.8 |
    | night-facade | `Building_facade_at_night_20261005095607` | ≥ 0.8 |
    | night | `Verde_Residences_illuminated_at_._20261005095550` | ≥ 0.8 |

  - `--gate` rewrite: delete the old procedural gate (bronze/ivory/band-energy); keep `analyse`/`composite`; per pair assert `pearson ≥ threshold` AND `cornerCoverage ≥ 0.5` AND `meanLuma > 12`; exit 1 with a per-pair report on failure; always write side-by-side composites for human eyeball review. `cap` filename = `<beat>.png`.

- [ ] **Step 1: Extract `scripts/lib/waypoints.mjs`** (move the proven regex; do not modify `journey.mjs`'s inline copy).

- [ ] **Step 2: Rewrite `SHOTS` + capture waits** in `capture-reference.mjs` per Interfaces.

- [ ] **Step 3: Rewrite `PAIRS` + `--gate`** in `compare-reference.mjs` per Interfaces.

- [ ] **Step 4: Rebuild, restart, capture**

Run: `npm run verify` → PASS. Kill :3000, start `npm start`, sleep 7.
Run: `node scripts/capture-reference.mjs` → 13 PNGs written.

- [ ] **Step 5: Run the gate and iterate**

Run: `node scripts/compare-reference.mjs --gate`
Expected: per-pair report. If a pair fails, adjust **only** runtime-mutable knobs — that beat's waypoint pose/depth (Task 5 table) or plane feather — never the fit formula, windows, or thresholds. Rebuild, restart, re-capture, re-gate until `reference gate green`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 13-pair photo-match reference gate"
```

---

### Task 9: Full suite, supersede docs, cleanup

**Files:**
- Modify: `package.json` (`verify:full`), `plan.md` (supersede banner)
- Modify: `.gitignore` (add `.superpowers/`)
- Delete: `docs/superpowers/plans/2026-10-07-phase-2-photo-plane-journey.md`, `plan-phase-3.md`
- Artifacts: desktop + mobile screenshots, pair composites in `scripts/screenshots/reference/`

**Interfaces:**
- Consumes: all prior tasks' scripts.
- Produces: `"verify:full": "npm run verify && node scripts/smoke.mjs && node scripts/journey.mjs && node scripts/audit-layout.mjs && node scripts/verify-plane-resilience.mjs"` (`verify` already chains content/anchors/planes/typecheck/lint/build; capture/compare stay manual — they need a fresh restart immediately before).

- [ ] **Step 1: Run the full battery**

`npm run verify` → `node scripts/smoke.mjs` → `node scripts/journey.mjs` → `node scripts/audit-layout.mjs` → `node scripts/verify-plane-math.mjs` → `node scripts/verify-plane-resilience.mjs` → capture + `compare-reference.mjs --gate` (server freshly restarted first). All green.

- [ ] **Step 2: Produce the human-review artifacts**

`node scripts/smoke.mjs --shots` (desktop/mobile hero + development + residences) and confirm `scripts/screenshots/reference/` holds the 13 captures + 13 composites. Note in the final message: composites are for eyeball review (the model cannot view images).

- [ ] **Step 3: Supersede + cleanup**

1. `plan.md`: prepend a status block — "SUPERSEDED 2026-10-07 by `docs/superpowers/specs/2026-10-07-full-site-redesign-design.md` — phases 3–10 retired; this file is historical." (Do not delete `plan.md` itself — the spec references it.)
2. Delete `plan-phase-3.md` and the old photo-plane plan.
3. `.gitignore`: add `.superpowers/`.
4. `rg -n "masterplan|day-night|EditorialChapter|CustomCursor" src scripts` → resolve any leftovers (references in prose/comments updated; dead ids gone).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: supersede old roadmap, full redesign suite green"
```

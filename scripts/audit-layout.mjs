/**
 * Computed-layout audit.
 *
 * Screenshots can't be reviewed in this environment, so the visual system is
 * verified by measuring it in a real browser: type scale, rhythm, contrast,
 * overflow and overlap.
 *
 *   node scripts/audit-layout.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";

const problems = [];
const notes = [];

function fail(message) {
  problems.push(message);
  console.log(`  FAIL  ${message}`);
}

function ok(message) {
  console.log(`  ok    ${message}`);
}

/* --- WCAG relative luminance and contrast ---------------------------------- */
function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForSelector("[data-loader]", { state: "detached", timeout: 15_000 });
await page.waitForTimeout(800);

/* --- 1. Fonts actually loaded --------------------------------------------- */
console.log("\nFonts");
const fonts = await page.evaluate(() => ({
  body: getComputedStyle(document.body).fontFamily,
  display: getComputedStyle(document.querySelector(".display-xl")).fontFamily,
  loaded: Array.from(document.fonts).map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`),
}));

if (/Jost/i.test(fonts.body)) ok(`body uses Jost`);
else fail(`body font is not Jost: ${fonts.body}`);

if (/Bodoni/i.test(fonts.display)) ok(`display scale uses Bodoni Moda`);
else fail(`display font is not Bodoni Moda: ${fonts.display}`);

const notLoaded = fonts.loaded.filter((f) => !f.includes("loaded"));
if (notLoaded.length === 0) ok(`all ${fonts.loaded.length} declared font faces loaded`);
else fail(`${notLoaded.length} font faces not loaded: ${notLoaded.join(", ")}`);

/* --- 2. Type scale is monotonic and distinct ------------------------------ */
console.log("\nType scale");
const scale = await page.evaluate(() => {
  const read = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { sel, size: parseFloat(s.fontSize), family: s.fontFamily.split(",")[0], weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing };
  };
  return [".display-xl", ".display-l", ".display-m", ".display-s", ".body-copy", ".caption", ".numeral", ".eyebrow"]
    .map(read)
    .filter(Boolean);
});

for (const entry of scale) {
  console.log(`  ${entry.sel.padEnd(12)} ${entry.size}px  ${entry.lh}  ${entry.family}`);
}

const sizes = scale.map((e) => e.size);
if (new Set(sizes).size === sizes.length) ok(`all ${sizes.length} steps are distinct sizes`);
else fail(`type scale has duplicate sizes: ${sizes.join(", ")}`);

for (let i = 1; i < sizes.length; i += 1) {
  if (sizes[i] >= sizes[i - 1]) {
    fail(`type scale not descending at step ${i}: ${sizes[i - 1]}px then ${sizes[i]}px`);
    break;
  }
}
ok("scale descends monotonically");

// Display sizes must use the serif, text sizes the sans.
const display = scale.filter((e) => e.sel.startsWith(".display"));
if (display.every((e) => /Bodoni/i.test(e.family))) ok("all display steps are serif");
else fail("a display step is not serif");

const text = scale.filter((e) => !e.sel.startsWith(".display"));
if (text.every((e) => /Jost/i.test(e.family))) ok("all text steps are sans-serif");
else fail("a text step is not sans-serif");

/* --- 3. Colour contrast on real rendered text ------------------------------ */
console.log("\nContrast (WCAG AA)");
const samples = await page.evaluate(() => {
  const parse = (value) => {
    const m = value.match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    return m.slice(0, 3).map(Number);
  };

  // Walk up for the first non-transparent background that actually paints.
  const effectiveBg = (el) => {
    let node = el;
    while (node) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      const alpha = getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
      if (bg && (!alpha || alpha.length < 4 || Number(alpha[3]) > 0.85)) return bg;
      node = node.parentElement;
    }
    return [10, 12, 11];
  };

  const targets = [
    [".body-copy", "body copy"],
    [".caption", "caption"],
    [".eyebrow", "eyebrow"],
    [".numeral", "numeral"],
    [".display-s", "display small"],
    [".display-l", "display large"],
    ["#hero p.body-copy", "hero body copy"],
  ];

  return targets
    .map(([sel, label]) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      const fg = parse(s.color);
      const bg = effectiveBg(el);
      if (!fg) return null;
      const size = parseFloat(s.fontSize);
      const weight = Number(s.fontWeight);
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      return { label, fg, bg, size, weight, large, visible: el.getClientRects().length > 0 };
    })
    .filter(Boolean);
});

for (const s of samples) {
  if (!s.visible) continue;
  const ratio = contrast(s.fg, s.bg);
  const min = s.large ? 3 : 4.5;
  const verdict = ratio >= min ? "ok  " : "FAIL";
  console.log(`  ${verdict}  ${s.label.padEnd(18)} ${ratio.toFixed(2)}:1  (needs ${min}, ${s.size}px/${s.weight})`);
  if (ratio < min) {
    fail(
      `${s.label} contrast ${ratio.toFixed(2)}:1 below AA ${min}:1 (rgb(${s.fg}) on rgb(${s.bg}))`,
    );
  }
}

/* --- 4. Rhythm: spacing lands on a consistent scale ----------------------- */
console.log("\nRhythm");
const rhythm = await page.evaluate(() => {
  const sections = Array.from(document.querySelectorAll("section[id]"));
  return sections.map((s) => {
    const style = getComputedStyle(s);
    return {
      id: s.id,
      pt: parseFloat(style.paddingTop),
      pb: parseFloat(style.paddingBottom),
    };
  });
});

for (const s of rhythm) {
  const balanced = Math.abs(s.pt - s.pb) < 0.5;
  if (!balanced) fail(`section #${s.id} has unbalanced vertical padding (${s.pt} / ${s.pb})`);
}
ok(`all ${rhythm.length} sections have balanced vertical padding`);

const uniqPadding = [...new Set(rhythm.map((s) => s.pt))];
if (uniqPadding.length <= 3) ok(`section padding uses ${uniqPadding.length} distinct values: ${uniqPadding.join(", ")}px`);
else notes.push(`${uniqPadding.length} distinct section paddings: ${uniqPadding.join(", ")}`);

/* --- 5. No overlap between stacked blocks --------------------------------- */
console.log("\nOverlap");
const overlaps = await page.evaluate(() => {
  const out = [];
  const sections = Array.from(document.querySelectorAll("section[id]"));
  for (let i = 0; i < sections.length - 1; i += 1) {
    const a = sections[i].getBoundingClientRect();
    const b = sections[i + 1].getBoundingClientRect();
    // Sections are stacked; negative gap means they actually overlap.
    const gap = b.top - a.bottom;
    if (gap < -1) out.push({ pair: `${sections[i].id}/${sections[i + 1].id}`, gap: Math.round(gap) });
  }
  return out;
});

if (overlaps.length === 0) ok("no sections overlap");
else for (const o of overlaps) fail(`sections ${o.pair} overlap by ${Math.abs(o.gap)}px`);

/* --- 6. Touch targets ------------------------------------------------------ */
console.log("\nTouch targets");
const small = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("a, button")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    // WCAG 2.2 SC 2.5.8 allows a smaller target when the equivalent inline or
    // 24px-spacing exception applies. Measure the effective target: the
    // element's own hit area, plus any spacing its siblings leave around it.
    let effectiveH = r.height;
    let effectiveW = r.width;

    if (r.height < 24) {
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((n) => n !== el);
        const pRect = parent.getBoundingClientRect();
        // Vertical gap to the nearest sibling boundary within this stack.
        let gapAbove = r.top - pRect.top;
        let gapBelow = pRect.bottom - r.bottom;
        for (const sib of siblings) {
          const s = sib.getBoundingClientRect();
          if (s.bottom <= r.top + 1) gapAbove = Math.min(gapAbove, r.top - s.bottom);
          if (s.top >= r.bottom - 1) gapBelow = Math.min(gapBelow, s.top - r.bottom);
        }
        const spacing = Math.min(gapAbove, gapBelow);
        // A 24px-diameter circle centred on the target must not collide.
        effectiveH = Math.min(24, r.height + spacing);
      }
    }

    // Inline links in running text are exempt (SC 2.5.8 has an inline
    // exception); only flag block-level and standalone controls.
    const inline = getComputedStyle(el).display === "inline";

    if (!inline && (effectiveH < 24 || effectiveW < 24)) {
      out.push({
        tag: el.tagName,
        text: (el.textContent ?? "").trim().slice(0, 24),
        h: Math.round(r.height),
        w: Math.round(r.width),
        effectiveH: Math.round(effectiveH),
        inline,
      });
    }
  }
  return out;
});

console.log(`  (inline links in running text are exempt from target size)`);

if (small.length === 0) ok("every standalone control has an effective target of at least 24px");
else
  for (const s of small.slice(0, 8)) {
    fail(`small target: <${s.tag}> "${s.text}" rendered ${s.w}x${s.h}, effective height ${s.effectiveH}px`);
  }

/* --- 7. Hero type does not collide at mobile width ------------------------- */
console.log("\nMobile hero");
const mob = await browser.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3 });
await mob.goto(BASE, { waitUntil: "networkidle" });
await mob.waitForSelector("[data-loader]", { state: "detached", timeout: 15_000 });
await mob.waitForTimeout(800);

const mobHero = await mob.evaluate(() => {
  const display = document.querySelector("#hero .display-xl");
  const ctas = Array.from(document.querySelectorAll("#hero [data-hero-cta] a"));
  const section = document.querySelector("#hero");

  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) };
  };

  return {
    sectionHeight: section.getBoundingClientRect().height,
    viewport: window.innerHeight,
    display: box(display),
    displaySize: parseFloat(getComputedStyle(display).fontSize),
    ctas: ctas.map(box),
    ctaLabels: ctas.map((c) => (c.textContent ?? "").trim()),
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});

console.log(`  display-xl at 360px = ${mobHero.displaySize}px`);
if (mobHero.display.right <= 360) ok("headline fits within 360px viewport");
else fail(`headline overflows: right edge ${mobHero.display.right}px`);

if (mobHero.overflowX <= 1) ok("no horizontal overflow at 360px");
else fail(`horizontal overflow ${mobHero.overflowX}px at 360px`);

// CTAs must not sit on top of each other or spill below the fold.
for (let i = 0; i < mobHero.ctas.length; i += 1) {
  for (let j = i + 1; j < mobHero.ctas.length; j += 1) {
    const a = mobHero.ctas[i];
    const b = mobHero.ctas[j];
    const intersects = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    if (intersects) fail(`hero CTAs overlap: "${mobHero.ctaLabels[i]}" and "${mobHero.ctaLabels[j]}"`);
  }
}
if (mobHero.ctas.every((c) => c.bottom <= mobHero.viewport + 1)) {
  ok(`all ${mobHero.ctas.length} hero CTAs fit above the fold at 360px`);
} else {
  fail(`hero CTAs spill below the fold at 360px: ${JSON.stringify(mobHero.ctas)}`);
}

await browser.close();

console.log(`\n${"=".repeat(64)}`);
for (const note of notes) console.log(`note  ${note}`);

if (problems.length > 0) {
  console.log(`\nAUDIT FAILED — ${problems.length} problem(s)`);
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exit(1);
}

console.log("AUDIT PASSED");
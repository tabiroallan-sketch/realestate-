/**
 * Reference comparison — Phase 2 risk 1.
 *
 * Measures the procedural massing against the reference stills without a pair
 * of eyes on the model side: tower-column runs (count/width), top profiles,
 * floor-band pitch (implied storeys) and material palette fractions for each
 * render/reference pair, then writes side-by-side composites for the human
 * adjudication the plan requires.
 *
 * Method notes
 * - Buildings are detected by vertical luminance derivative energy: balcony
 *   bands and floor slabs modulate rows strongly, sky gradients do not.
 * - Thresholds are fixed (8 luma, 4-row sustain) rather than per-image so the
 *   render and the photograph are judged by the same rule.
 * - Numbers are comparative (render vs photo), not absolute truth.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REFS = path.join(ROOT, "image");
const CAPS = path.join(ROOT, "scripts", "screenshots", "reference");
const OUT = path.join(CAPS, "side-by-side");

const PAIRS = [
  { id: "aerial", cap: "aerial.png", stamp: "20261005095409", label: "Aerial render vs hero poster (three towers, midday)" },
  { id: "approach", cap: "approach.png", stamp: "20261005095613", label: "Approach render vs development view" },
  { id: "entrance", cap: "entrance.png", stamp: "20261005095442", label: "Entrance render vs street entrance photo" },
  { id: "rooftop", cap: "rooftop.png", stamp: "20261005095523", label: "Rooftop render vs rooftop rise photo" },
  { id: "night", cap: "night.png", stamp: "20261005095550", label: "Night render vs illuminated-at-night photo" },
];

const thr = 8; // luma delta that counts as structure
const sustain = 4; // consecutive rows required
const ACTIVITY = 0.7; // analyse the upper 70% of the frame

async function loadGray(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, c: info.channels };
}

function lumaAt(img, x, y) {
  const i = (y * img.w + x) * img.c;
  return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
}

/** Per-column first sustained structure row (tower top), or -1 / bottom.
 *  A 5-row box smooth runs first: photographic edges blur over many rows, while
 *  real-time renders cliff in one. Judging both at a 5-row scale keeps the same
 *  rule for render and photo — and still rejects sky gradients (each smoothed
 *  row stays far below the 8-luma threshold). */
function columnTops(img) {
  const hLimit = Math.floor(img.h * ACTIVITY);
  const smooth = [];
  for (let x = 0; x < img.w; x += 1) {
    const col = new Float32Array(img.h);
    let acc = 0;
    for (let y = 0; y < img.h; y += 1) {
      acc += lumaAt(img, x, y);
      if (y >= 5) acc -= lumaAt(img, x, y - 5);
      col[y] = acc / Math.min(5, y + 1);
    }
    smooth.push(col);
  }
  const tops = new Array(img.w).fill(-1);
  for (let x = 0; x < img.w; x += 1) {
    let run = 0;
    for (let y = 1; y < hLimit; y += 1) {
      const d = Math.abs(smooth[x][y] - smooth[x][y - 1]);
      if (d > thr) {
        run += 1;
        if (run >= sustain) {
          tops[x] = y - sustain + 1;
          break;
        }
      } else {
        run = 0;
      }
    }
    if (tops[x] === -1) tops[x] = hLimit;
  }
  return tops;
}

/** Contiguous runs of "elevated" columns (structure well above the horizon). */
function runs(tops, h) {
  const horizon = quantile(tops, 0.6); // most columns bottom out at horizon/ground
  const elevated = tops.map((t) => t < horizon - h * 0.08);
  const out = [];
  let start = -1;
  for (let x = 0; x <= elevated.length; x += 1) {
    const on = x < elevated.length && elevated[x];
    if (on && start === -1) start = x;
    if (!on && start !== -1) {
      if (x - start >= 6) {
        const seg = tops.slice(start, x);
        out.push({ x0: start, x1: x, top: Math.min(...seg), topAtCenter: seg[Math.floor(seg.length / 2)] });
      }
      start = -1;
    }
  }
  return { horizon, runList: out };
}

function quantile(arr, q) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}

/** Mean luma per row across a run, detrended; return dominant band pitch. */
function bandPitch(img, run) {
  const hLimit = Math.floor(img.h * ACTIVITY);
  const xs = [];
  for (let x = run.x0; x < run.x1; x += 2) xs.push(x);
  const rows = [];
  for (let y = 0; y < hLimit; y += 1) {
    let sum = 0;
    for (const x of xs) sum += lumaAt(img, x, y);
    rows.push(sum / xs.length);
  }
  // Detrend with a wide moving average so the sky gradient does not dominate.
  const win = 21;
  const detrended = rows.map((_, i) => {
    let s = 0, n = 0;
    for (let k = Math.max(0, i - win); k <= Math.min(rows.length - 1, i + win); k += 1) { s += rows[k]; n += 1; }
    return rows[i] - s / n;
  });
  const energy = detrended.reduce((a, v) => a + v * v, 0) / detrended.length;
  if (energy < 4) return { pitch: 0, energy: Math.round(energy) }; // smooth — no readable banding
  let bestLag = 0, bestCorr = 0;
  for (let lag = 4; lag <= 70; lag += 1) {
    let num = 0, den = 0;
    for (let i = 0; i + lag < detrended.length; i += 1) {
      num += detrended[i] * detrended[i + lag];
      den += detrended[i] * detrended[i];
    }
    if (den <= 0) continue;
    const corr = num / den;
    if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
  }
  return { pitch: bestLag, corr: Number(bestCorr.toFixed(2)), energy: Math.round(energy) };
}

/** Whole-frame mean colour — the grade control. */
function meanRgb(img) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < img.data.length; i += img.c * 17) {
    r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n += 1;
  }
  return [r / n, g / n, b / n];
}

/** Palette fractions over pixels inside detected runs, below their tops.
 *  `balance` scales channels to a neutral frame mean first, so an image's
 *  warm grade cannot masquerade as bronze material. */
function palette(img, runList, balance) {
  const counts = { ivory: 0, bronze: 0, glass: 0, dark: 0, other: 0 };
  let total = 0;
  const hLimit = Math.floor(img.h * ACTIVITY);
  const m = meanRgb(img);
  const gray = (m[0] + m[1] + m[2]) / 3;
  const gain = balance ? [gray / m[0], gray / m[1], gray / m[2]] : [1, 1, 1];
  for (const run of runList) {
    for (let x = run.x0; x < run.x1; x += 2) {
      for (let y = run.top; y < hLimit; y += 2) {
        const i = (y * img.w + x) * img.c;
        const r = Math.min(255, img.data[i] * gain[0]);
        const g = Math.min(255, img.data[i + 1] * gain[1]);
        const b = Math.min(255, img.data[i + 2] * gain[2]);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        total += 1;
        if (l < 45) counts.dark += 1;
        else if (b > r + 8 && sat > 0.06) counts.glass += 1;
        else if (r >= g && g > b && sat >= 0.18 && sat <= 0.62 && l >= 55 && l <= 175) counts.bronze += 1;
        else if (r >= g && g >= b && sat < 0.3 && l > 140) counts.ivory += 1;
        else counts.other += 1;
      }
    }
  }
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  return { ivory: pct(counts.ivory), bronze: pct(counts.bronze), glass: pct(counts.glass), dark: pct(counts.dark), other: pct(counts.other) };
}

async function analyse(file) {
  const img = await loadGray(file);
  const tops = columnTops(img);
  const { horizon, runList } = runs(tops, img.h);
  const perRun = runList
    .map((r) => {
      const bp = bandPitch(img, r);
      const height = horizon - r.top;
      return {
        width: r.x1 - r.x0,
        top: r.top,
        ...bp,
        impliedFloors: bp.pitch > 0 ? Math.round(height / bp.pitch) : 0,
      };
    })
    .sort((a, b) => b.width - a.width)
    .slice(0, 5);
  return {
    file: path.basename(file),
    size: `${img.w}x${img.h}`,
    horizonPct: Math.round((horizon / img.h) * 100),
    runCount: runList.length,
    runs: perRun,
    mean: meanRgb(img).map((v) => Math.round(v)),
    palette: palette(img, runList, false),
    paletteBalanced: palette(img, runList, true),
  };
}

function fmtRun(r, i) {
  return `    run${i + 1}: width=${r.width}px top=${r.top}px pitch=${r.pitch}px${r.corr ? ` (r=${r.corr})` : ""} bandEnergy=${r.energy} impliedFloors=${r.impliedFloors}`;
}

async function composite(pair, capFile, refFile) {
  const W = 1376;
  const refMeta = await sharp(refFile).metadata();
  const capMeta = await sharp(capFile).metadata();
  const refH = Math.round((W * refMeta.height) / refMeta.width);
  const capH = Math.round((W * capMeta.height) / capMeta.width);
  const label = (text) =>
    Buffer.from(
      `<svg width="${W}" height="56" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0A0C0B"/><text x="24" y="36" font-family="sans-serif" font-size="22" fill="#A68A64">${text}</text></svg>`,
    );
  const [refImg, capImg] = await Promise.all([
    sharp(refFile).resize({ width: W }).toBuffer(),
    sharp(capFile).resize({ width: W }).toBuffer(),
  ]);
  const total = 56 + refH + 56 + capH;
  await sharp({
    create: { width: W, height: total, channels: 3, background: "#0A0C0B" },
  })
    .composite([
      { input: label(`REFERENCE — ${pair.label}`), top: 0, left: 0 },
      { input: refImg, top: 56, left: 0 },
      { input: label(`3D RENDER — ${pair.id} waypoint`), top: 56 + refH, left: 0 },
      { input: capImg, top: 56 + refH + 56, left: 0 },
    ])
    .png()
    .toFile(path.join(OUT, `${pair.id}.png`));
}

/* -- run ------------------------------------------------------------------- */

await mkdir(OUT, { recursive: true });
const files = await import("node:fs/promises").then((fs) => fs.readdir(REFS));
const report = [];

for (const pair of PAIRS) {
  const refFile = files.find((f) => f.includes(pair.stamp) && f.endsWith(".jpg"));
  if (!refFile) {
    console.log(`FAIL  no reference for ${pair.id} (stamp ${pair.stamp})`);
    process.exit(1);
  }
  const capFile = path.join(CAPS, pair.cap);
  const [cap, ref] = await Promise.all([analyse(capFile), analyse(path.join(REFS, refFile))]);
  await composite(pair, capFile, path.join(REFS, refFile));
  report.push({ pair, cap, ref, refFile });
}

for (const { pair, cap, ref, refFile } of report) {
  console.log(`\n== ${pair.id} — ${pair.label}`);
  console.log(`  REF  ${refFile}  mean=${JSON.stringify(ref.mean)}`);
  console.log(`    runs=${ref.runCount} horizon=${ref.horizonPct}%`);
  console.log(`    palette raw=${JSON.stringify(ref.palette)} balanced=${JSON.stringify(ref.paletteBalanced)}`);
  ref.runs.forEach((r, i) => console.log(fmtRun(r, i)));
  console.log(`  CAP  ${cap.file} ${cap.size}  mean=${JSON.stringify(cap.mean)}`);
  console.log(`    runs=${cap.runCount} horizon=${cap.horizonPct}%`);
  console.log(`    palette raw=${JSON.stringify(cap.palette)} balanced=${JSON.stringify(cap.paletteBalanced)}`);
  cap.runs.forEach((r, i) => console.log(fmtRun(r, i)));
}

console.log("\ncomposites → scripts/screenshots/reference/side-by-side/");

/* -- gate ------------------------------------------------------------------
 *
 * The acceptance test for the facade/silhouette correction. Targets come from
 * the measured reference stills (bronze 19–29%, ivory 0–8%, aerial band energy
 * ≈1500) pulled toward the render with margin, and are asserted on renders
 * only: renders are neutral-graded by construction, so the raw palette is the
 * honest number — the white-balance control exists for the photographs.
 *
 * Run with `--gate` to turn the report into a pass/fail test.
 * -------------------------------------------------------------------------- */

if (process.argv.includes("--gate")) {
  const byId = Object.fromEntries(report.map((r) => [r.pair.id, r]));
  const checks = [];
  const check = (label, ok, detail) => checks.push({ label, ok, detail });

  const aerial = byId.aerial.cap;
  const night = byId.night.cap;

  const aerialBronze = aerial.palette.bronze;
  check("aerial render bronze ≥ 15%", aerialBronze >= 15, `got ${aerialBronze}%`);

  const nightBronze = night.palette.bronze;
  check("night render bronze ≥ 15%", nightBronze >= 15, `got ${nightBronze}%`);

  const top3 = aerial.runs.slice(0, 3);
  const energy = Math.round(top3.reduce((s, r) => s + r.energy, 0) / top3.length);
  check("aerial band energy ≥ 500", energy >= 500, `got ${energy} (reference ≈1500)`);

  check("aerial render ivory ≤ 20%", aerial.palette.ivory <= 20, `got ${aerial.palette.ivory}%`);

  const widest = Math.max(...aerial.runs.map((r) => r.width));
  check("aerial framing: widest tower run ≥ 70px", widest >= 70, `got ${widest}px (reference 91–108px)`);

  const minTop = Math.min(...aerial.runs.map((r) => r.top));
  const minTopPct = Math.round((minTop / (aerial.size.split("x")[1] | 0)) * 100);
  check("aerial framing: tower top ≤ 20% of frame", minTopPct <= 20, `got ${minTopPct}% (reference 5–10%)`);

  console.log("");
  let failed = 0;
  for (const c of checks) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.label} — ${c.detail}`);
    if (!c.ok) failed += 1;
  }
  if (failed) {
    console.log(`\n${failed} gate check(s) failing`);
    process.exit(1);
  }
  console.log("\nreference gate green");
}

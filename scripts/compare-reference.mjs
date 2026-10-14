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

import { loadWaypoints } from "./lib/waypoints.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REFS = path.join(ROOT, "image");
const CAPS = path.join(ROOT, "scripts", "screenshots", "reference");
const OUT = path.join(CAPS, "side-by-side");

const PAIRS = [
  { id: "arrival", stamp: "luxury_towers_N._20261005095409", threshold: 0.5, label: "Arrival — aerial video vs towers poster" },
  { id: "towers", stamp: "luxury_towers_N._20261005095427", threshold: 0.8, label: "The towers, day exterior" },
  { id: "development", stamp: "development_view_20261005095613", threshold: 0.8, label: "All three towers" },
  { id: "threshold", stamp: "exterior_street._20261005095442", threshold: 0.8, label: "Threshold at street level" },
  { id: "lobby", stamp: "lobby_interior_._20261005095500", threshold: 0.8, label: "Lobby — wide" },
  { id: "lobby-detail", stamp: "Lobby_interior_with_sculptural_s._20261005095447", threshold: 0.8, label: "Lobby — sculptural stair" },
  { id: "residence", stamp: "Luxury_apartment_interior_view_20261005095506", threshold: 0.8, label: "Residence interior" },
  { id: "living", stamp: "Luxury_apartment_living_room_int._20261005095512", threshold: 0.8, label: "Living room, second angle" },
  { id: "view", stamp: "Balcony_view_of_Nairobi_skyline_20261005095517", threshold: 0.8, label: "Balcony — city reveal" },
  { id: "rooftop-rise", stamp: "Camera_rising_over_building_rooftop_20261005095523", threshold: 0.8, label: "Rising over the roof" },
  { id: "rooftop-pool", stamp: "Rooftop_pool_overlooking_Nairobi._20261005095537", threshold: 0.8, label: "Rooftop pool — skyline" },
  { id: "night-facade", stamp: "Building_facade_at_night_20261005095607", threshold: 0.8, label: "Night facade, fins lit" },
  { id: "night", stamp: "Verde_Residences_illuminated_at_._20261005095550", threshold: 0.8, label: "Night — towers illuminated" },
];

const GRID_W = 32;
const GRID_H = 18;
const VISIBLE = 0.934;
const CORNER_W = 8;
const CORNER_H = 5;
const CORNER_FLOOR = 0.25;
const FLAT_STD = 15;
const FLAT_LUMA = 25;
const LUMA_FLOOR = 12;

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

function normalizedName(name) {
  return name.replace(/\u2026/g, ".");
}

async function grid(file, cover) {
  let pipeline = sharp(file).removeAlpha();
  if (cover && cover !== 1) {
    const meta = await sharp(file).metadata();
    const width = Math.round(meta.width * cover);
    const height = Math.round(meta.height * cover);
    pipeline = pipeline.extract({
      left: Math.round((meta.width - width) / 2),
      top: Math.round((meta.height - height) / 2),
      width,
      height,
    });
  }
  const { data } = await pipeline
    .resize(GRID_W, GRID_H, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

function correlation(a, b, indices) {
  const n = indices.length;
  let sa = 0;
  let sb = 0;
  for (const i of indices) {
    sa += a[i];
    sb += b[i];
  }
  const ma = sa / n;
  const mb = sb / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (const i of indices) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const den = Math.sqrt(da * db);
  return den > 0 ? num / den : 0;
}

function patchStats(values) {
  let sum = 0;
  for (const value of values) sum += value;
  const mean = sum / values.length;
  let sq = 0;
  for (const value of values) sq += (value - mean) * (value - mean);
  return { mean, std: Math.sqrt(sq / values.length) };
}

function indices(x0, y0, w, h) {
  const out = [];
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) out.push(y * GRID_W + x);
  }
  return out;
}

const ALL = indices(0, 0, GRID_W, GRID_H);

function cornerCoverage(cap, ref) {
  const blocks = [
    indices(0, 0, CORNER_W, CORNER_H),
    indices(GRID_W - CORNER_W, 0, CORNER_W, CORNER_H),
    indices(0, GRID_H - CORNER_H, CORNER_W, CORNER_H),
    indices(GRID_W - CORNER_W, GRID_H - CORNER_H, CORNER_W, CORNER_H),
  ];
  let covered = 0;
  for (const block of blocks) {
    const capStats = patchStats(block.map((i) => cap[i]));
    const refStats = patchStats(block.map((i) => ref[i]));
    if (Math.min(capStats.std, refStats.std) < FLAT_STD) {
      if (Math.abs(capStats.mean - refStats.mean) <= FLAT_LUMA) covered += 1;
    } else if (correlation(cap, ref, block) >= CORNER_FLOOR) {
      covered += 1;
    }
  }
  return covered / blocks.length;
}

function meanLuma(cap) {
  let sum = 0;
  for (const value of cap) sum += value;
  return sum / cap.length;
}

/* -- run ------------------------------------------------------------------- */

await mkdir(OUT, { recursive: true });
const files = await import("node:fs/promises").then((fs) => fs.readdir(REFS));
const waypoints = await loadWaypoints();
const authoredIds = waypoints.map((w) => w.id).join(",");
const pairedIds = PAIRS.map((p) => p.id).join(",");
if (authoredIds !== pairedIds) {
  console.log("FAIL  PAIRS ids do not match authored waypoints");
  process.exit(1);
}
const report = [];

for (const pair of PAIRS) {
  const refFile = files.find((f) => normalizedName(f).includes(pair.stamp) && f.endsWith(".jpg"));
  if (!refFile) {
    console.log(`FAIL  no reference for ${pair.id} (stamp ${pair.stamp})`);
    process.exit(1);
  }
  const capFile = path.join(CAPS, `${pair.id}.png`);
  const refPath = path.join(REFS, refFile);
  const capGrid = await grid(capFile, 1);
  const refGrid = await grid(refPath, VISIBLE);
  const pearson = correlation(capGrid, refGrid, ALL);
  const coverage = cornerCoverage(capGrid, refGrid);
  const luma = meanLuma(capGrid);
  await composite(pair, capFile, refPath);
  report.push({ pair, refFile, pearson, coverage, luma });
}

for (const { pair, refFile, pearson, coverage, luma } of report) {
  console.log(`\n== ${pair.id} — ${pair.label}`);
  console.log(`  REF  ${refFile}`);
  console.log(
    `  pearson=${pearson.toFixed(3)} (≥${pair.threshold})  cornerCoverage=${coverage.toFixed(2)} (≥0.5)  meanLuma=${luma.toFixed(1)} (>${LUMA_FLOOR})`,
  );
}

console.log("\ncomposites → scripts/screenshots/reference/side-by-side/");

if (process.argv.includes("--gate")) {
  console.log("");
  let failed = 0;
  for (const { pair, pearson, coverage, luma } of report) {
    const okPearson = pearson >= pair.threshold;
    const okCoverage = coverage >= 0.5;
    const okLuma = luma > LUMA_FLOOR;
    const ok = okPearson && okCoverage && okLuma;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${pair.id.padEnd(13)} pearson=${pearson.toFixed(3)}/${pair.threshold}  cornerCoverage=${coverage.toFixed(2)}/0.50  meanLuma=${luma.toFixed(1)}/${LUMA_FLOOR}`,
    );
    if (!ok) failed += 1;
  }
  if (failed) {
    console.log(`\n${failed} gate check(s) failing`);
    process.exit(1);
  }
  console.log("\nreference gate green");
}

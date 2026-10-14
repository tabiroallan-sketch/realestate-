/**
 * Reference comparison capture — Phase 3.
 *
 * Stands the camera at each authored waypoint (via the journeyProbe seam) and
 * takes a clipped screenshot of the canvas region with the DOM chrome and hero
 * overlay hidden, so the photo-plane flight can be compared side by side with
 * the reference stills in ./image.
 *
 * The camera parameter is never hand-typed here: it is resolved from
 * `waypoints.ts` through `loadWaypoints()`, so a capture can never drift from
 * the authored flight.
 *
 * Requires `npm start` on :3000.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadWaypoints } from "./lib/waypoints.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts", "screenshots", "reference");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const BEAT_IDS = [
  "arrival",
  "towers",
  "development",
  "threshold",
  "lobby",
  "lobby-detail",
  "residence",
  "living",
  "view",
  "rooftop-rise",
  "rooftop-pool",
  "night-facade",
  "night",
];

const waypoints = await loadWaypoints();
const tById = new Map(waypoints.map((w) => [w.id, w.t]));

const SHOTS = BEAT_IDS.map((id) => {
  if (!tById.has(id)) {
    console.error(`FAIL  no authored waypoint for beat "${id}"`);
    process.exit(1);
  }
  return { id, t: tById.get(id) };
});

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(`${BASE}/?journeyProbe=1`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("[data-journey-canvas] canvas", { state: "attached", timeout: 60_000 });

const planesReady = await page
  .waitForFunction(() => window.__verdePlanesReady === true && !!window.__journeyProbe, {
    timeout: 120_000,
  })
  .then(() => true)
  .catch(() => false);
if (!planesReady) {
  console.error("FAIL  planes/probe seam never resolved (__verdePlanesReady + __journeyProbe)");
  await browser.close();
  process.exit(1);
}

const probeReady = await page.evaluate(() => typeof window.__forceProgress === "function");
if (!probeReady) {
  console.error("FAIL  __forceProgress not published — probe flag not active");
  await browser.close();
  process.exit(1);
}

// Hide everything sitting above the canvas: nav, loader, cursor, hero overlay
// (photo, scrim, type). Purely a capture-time mask — no source changes.
await page.addStyleTag({
  content: `[data-nav], [data-loader], [data-cursor], #hero, [data-scroll-progress] { visibility: hidden !important; }`,
});
await page.waitForTimeout(300);

const box = await page.evaluate(() => {
  const canvas = document.querySelector("[data-journey-canvas] canvas");
  const rect = canvas.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
});

async function shoot(file) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.screenshot({ path: file, clip: box, animations: "allow", timeout: 120_000 });
      return;
    } catch (error) {
      lastError = error;
      console.log(`warn  ${path.basename(file)} screenshot attempt ${attempt} failed: ${error.message}`);
    }
  }
  throw lastError;
}

for (const shot of SHOTS) {
  await page.evaluate((t) => window.__forceProgress(t), shot.t);
  const startFrame = await page.evaluate(() => window.__journeyProbe.frame);
  try {
    await page.waitForFunction(
      (from) => window.__journeyProbe.frame - from >= 14,
      startFrame,
      { timeout: 60_000, polling: 100 },
    );
  } catch {
    console.log(`warn  ${shot.id}: frame wait timed out — capturing anyway`);
  }
  const reading = await page.evaluate(() => ({ t: window.__journeyProbe.t, camera: { ...window.__journeyProbe.camera } }));
  await shoot(path.join(OUT, `${shot.id}.png`));
  console.log(
    `ok    ${shot.id} t=${shot.t} (probe t=${reading.t.toFixed(3)} cam=${reading.camera.x.toFixed(1)},${reading.camera.y.toFixed(1)},${reading.camera.z.toFixed(1)})`,
  );
}

if (errors.length) {
  console.log(`FAIL  console/page errors: ${errors.slice(0, 5).join(" | ")}`);
  await browser.close();
  process.exit(1);
}

console.log(`captured ${SHOTS.length} frames → scripts/screenshots/reference/`);
await browser.close();

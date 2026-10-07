/**
 * Reference comparison capture — Phase 2 risk 1.
 *
 * Stands the camera at each exterior waypoint (via the journeyProbe seam) and
 * takes a clipped screenshot of the canvas region with the DOM chrome and hero
 * overlay hidden, so the procedural massing can be compared side by side with
 * the reference stills in ./image.
 *
 * Requires `npm start` on :3000.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts", "screenshots", "reference");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const SHOTS = [
  { id: "aerial", t: 0, ref: "heroPoster" },
  { id: "approach", t: 0.14, ref: "developmentTowers" },
  { id: "entrance", t: 0.3, ref: "entranceStreet" },
  { id: "rooftop", t: 0.82, ref: "rooftopRise" },
  { id: "night", t: 0.91, ref: "nightIlluminated" },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(`${BASE}/?journeyProbe=1`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("[data-journey-canvas] canvas", { state: "attached", timeout: 60_000 });
await page.waitForTimeout(4000);

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
  await page.screenshot({ path: path.join(OUT, `${shot.id}.png`), clip: box, animations: "allow" });
  console.log(
    `ok    ${shot.id} t=${shot.t} (probe t=${reading.t.toFixed(3)} cam=${reading.camera.x.toFixed(1)},${reading.camera.y.toFixed(1)},${reading.camera.z.toFixed(1)}) ref=${shot.ref}`,
  );
}

if (errors.length) {
  console.log(`FAIL  console/page errors: ${errors.slice(0, 5).join(" | ")}`);
  await browser.close();
  process.exit(1);
}

console.log(`captured ${SHOTS.length} frames → scripts/screenshots/reference/`);
await browser.close();

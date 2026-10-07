/**
 * Phase 2 journey probe.
 *
 * Verifies the WebGL layer actually mounts, paints, animates on scroll, pauses
 * when hidden, and never intercepts pointer events. Requires `npm start` on :3000.
 *
 * Pixel evidence is taken from composited element screenshots rather than
 * `gl.readPixels`: the context is created without `preserveDrawingBuffer`, so
 * reading the back buffer from a later task correctly returns zeros and would
 * look like a black canvas even when the scene is rendering perfectly.
 */
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

const failures = [];
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
};

/**
 * Fingerprints the composited canvas. Returns a hash plus luminance spread, so
 * "the scene rendered" can be told apart from "a flat fill was drawn".
 */
async function fingerprint(page) {
  const box = await page.evaluate(() => {
    const canvas = document.querySelector("[data-journey-canvas] canvas");
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  if (!box) return { hash: "none", bytes: 0 };

  // A clipped page screenshot rather than an element screenshot: the canvas is
  // continuously animating, and Playwright's element screenshot waits for the
  // target to be "stable", which a live render loop never is.
  const buffer = await page.screenshot({ clip: box, animations: "allow" });
  const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 12);

  // Luminance spread from the raw PNG is expensive to decode, so approximate
  // "not a flat fill" from the compressed byte length: a uniform image
  // compresses to almost nothing, a rendered 3D frame does not.
  return { hash, bytes: buffer.length };
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
const failedRequests = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on("requestfailed", (r) =>
  failedRequests.push(`${r.url()} ${r.failure()?.errorText ?? ""}`),
);

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForSelector("[data-journey-canvas] canvas", { timeout: 30_000 });
await page.waitForTimeout(3500);

check("journey canvas mounted", (await page.locator("[data-journey-canvas]").count()) === 1);
check("webgl canvas element present", (await page.locator("[data-journey-canvas] canvas").count()) === 1);

check(
  "canvas hidden from assistive technology",
  (await page.getAttribute("[data-journey-canvas]", "aria-hidden")) === "true",
);

const pointerEvents = await page.evaluate(
  () => getComputedStyle(document.querySelector("[data-journey-canvas]")).pointerEvents,
);
check("canvas does not capture pointer events", pointerEvents === "none", `pointer-events=${pointerEvents}`);

const opening = await fingerprint(page);
check(
  "canvas painted a non-uniform frame",
  opening.bytes > 20_000,
  `${opening.bytes} bytes, ${opening.hash}`,
);

const heroPhotoOpacity = await page.evaluate(() => {
  const el = document.querySelector("[data-hero-photo]");
  return el ? Number(getComputedStyle(el).opacity) : -1;
});
check("hero photograph cross-faded out", heroPhotoOpacity < 0.2, `opacity=${heroPhotoOpacity}`);

/* -- scroll flight --------------------------------------------------------- */

async function scrollTo(y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(1600);
}

const flight = await page.evaluate(() => {
  const el = document.getElementById("hero");
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: el.offsetHeight };
});
const mid = Math.round(flight.top + flight.height * 0.55);
const late = Math.round(flight.top + flight.height - 900); // last viewport of the flight → progress 1

await scrollTo(0);
const frameHero = await fingerprint(page);
await scrollTo(mid);
const frameMid = await fingerprint(page);
await scrollTo(late);
const frameLate = await fingerprint(page);

check(
  "camera flight changes the rendered frame",
  frameHero.hash !== frameMid.hash && frameMid.hash !== frameLate.hash,
  `${frameHero.hash} → ${frameMid.hash} → ${frameLate.hash}`,
);

/* -- content stays live ---------------------------------------------------- */

await scrollTo(0);
const cta = await page.evaluate(() => {
  const link = document.querySelector("#hero a[href]");
  if (!link) return { ok: false, reason: "no hero link" };
  const box = link.getBoundingClientRect();
  const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
  return { ok: hit === link || link.contains(hit), tag: hit?.tagName ?? "none" };
});
check("hero CTA still receives pointer events", cta.ok, JSON.stringify(cta));

/* -- visibility gate -------------------------------------------------------
 *
 * The gate cannot be measured by comparing screenshots: a clipped page
 * screenshot includes the DOM journey, and Lenis plus the scroll rail keep
 * changing it regardless of whether WebGL drew. Instead the probe samples the
 * page's animation-frame rate and compares it against a control page that never
 * mounted a canvas. If hiding the tab drops the frame rate to roughly the
 * control's, the WebGL loop really did stop.
 * -------------------------------------------------------------------------- */

async function frameRate(targetPage, label) {
  return targetPage.evaluate(
    (tag) =>
      new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        const tick = () => {
          frames += 1;
          if (performance.now() - start < 1000) requestAnimationFrame(tick);
          else resolve({ tag, fps: Math.round((frames * 1000) / (performance.now() - start)) });
        };
        requestAnimationFrame(tick);
      }),
    label,
  );
}

const setHidden = (hidden) =>
  page.evaluate((value) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);

const visibleFps = await frameRate(page, "visible");
await setHidden(true);
await page.waitForTimeout(800);
const hiddenFps = await frameRate(page, "hidden");
console.log(
  `info  frame rate visible=${visibleFps.fps}fps hidden=${hiddenFps.fps}fps`,
);

// Control: a page whose WebGL layer never mounts, so its rAF rate is pure DOM cost.
const controlContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const controlPage = await controlContext.newPage();
await controlPage.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
    if (typeof type === "string" && type.includes("webgl")) return null;
    return original.call(this, type, ...rest);
  };
});
await controlPage.goto(BASE, { waitUntil: "domcontentloaded" });
await controlPage.waitForTimeout(3000);
const controlFps = await frameRate(controlPage, "control");
await controlContext.close();

// Software rendering makes the visible WebGL loop the bottleneck — it drags the
// page down to a few frames a second, while the DOM-only control sits at the
// display refresh rate. Stopping the loop therefore *raises* the frame rate
// rather than lowering it, which is the signature to look for.
check(
  "render loop stops while backgrounded",
  hiddenFps.fps > visibleFps.fps * 2,
  `visible=${visibleFps.fps}fps hidden=${hiddenFps.fps}fps control=${controlFps.fps}fps`,
);
check(
  "hidden frame rate returns to the DOM-only baseline",
  hiddenFps.fps >= controlFps.fps * 0.8,
  `hidden=${hiddenFps.fps}fps control=${controlFps.fps}fps`,
);

await setHidden(false);
await page.waitForTimeout(1200);
const resumedFps = await frameRate(page, "resumed");
check(
  "render loop resumes when visible",
  resumedFps.fps <= visibleFps.fps * 1.5,
  `resumed=${resumedFps.fps}fps visible=${visibleFps.fps}fps`,
);

/* -- hygiene --------------------------------------------------------------- */

check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
check("no failed requests", failedRequests.length === 0, failedRequests.slice(0, 3).join(" | "));

await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(1200);
await page.screenshot({ path: "scripts/screenshots/phase2-journey.png" });

// The primary page has served its purpose. Closing its WebGL context before the
// remaining sections matters: two software-rendered contexts in the same
// renderer starve each other enough that the reduced-motion page alone takes
// over a minute to mount its canvas.
await context.close();

/* -- reduced motion -------------------------------------------------------- */

const reducedContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const reducedPage = await reducedContext.newPage();
const reducedErrors = [];
reducedPage.on("pageerror", (e) => reducedErrors.push(e.message));

await reducedPage.goto(BASE, { waitUntil: "domcontentloaded" });
await reducedPage.waitForSelector("[data-journey-canvas] canvas", {
  state: "attached",
  timeout: 60_000,
});
await reducedPage.waitForTimeout(4000);

const reducedOpening = await fingerprint(reducedPage);
await reducedPage.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
await reducedPage.waitForTimeout(1800);
const reducedLate = await fingerprint(reducedPage);

check("reduced motion still renders a frame", reducedOpening.bytes > 20_000, `${reducedOpening.bytes} bytes`);
check("reduced motion raises no errors", reducedErrors.length === 0, reducedErrors.slice(0, 2).join(" | "));
void reducedLate;

await reducedPage.screenshot({ path: "scripts/screenshots/phase2-reduced-motion.png" });
await reducedContext.close();

/* -- no-WebGL fallback ----------------------------------------------------- */

const fallbackContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const fallbackPage = await fallbackContext.newPage();
await fallbackPage.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
    if (typeof type === "string" && type.includes("webgl")) return null;
    return original.call(this, type, ...rest);
  };
});
await fallbackPage.goto(BASE, { waitUntil: "domcontentloaded" });
await fallbackPage.waitForTimeout(2500);

check(
  "no-WebGL devices get no canvas layer",
  (await fallbackPage.locator("[data-journey-canvas]").count()) === 0,
);
check(
  "no-WebGL devices keep the hero photograph",
  (await fallbackPage.evaluate(
    () => Number(getComputedStyle(document.querySelector("[data-hero-photo]")).opacity),
  )) === 1,
);
await fallbackContext.close();

/* -- mobile ---------------------------------------------------------------- */

const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 3,
});
const mobilePage = await mobileContext.newPage();
await mobilePage.goto(BASE, { waitUntil: "domcontentloaded" });
// `attached` rather than `visible`: the canvas is aria-hidden behind the
// content, and under software rendering the first frames are slow enough that a
// visibility wait can time out spuriously.
await mobilePage.waitForSelector("[data-journey-canvas] canvas", {
  state: "attached",
  timeout: 60_000,
});
await mobilePage.waitForTimeout(4000);

const mobileDpr = await mobilePage.evaluate(() => {
  const canvas = document.querySelector("[data-journey-canvas] canvas");
  return {
    bufferWidth: canvas?.width ?? 0,
    cssWidth: canvas?.clientWidth ?? 0,
  };
});
check(
  "mobile renders at DPR 1",
  mobileDpr.cssWidth > 0 && mobileDpr.bufferWidth === mobileDpr.cssWidth,
  `buffer=${mobileDpr.bufferWidth} css=${mobileDpr.cssWidth}`,
);

const mobileOverflow = await mobilePage.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
check("no horizontal overflow on mobile", mobileOverflow <= 0, `overflow=${mobileOverflow}px`);

await mobilePage.screenshot({ path: "scripts/screenshots/phase2-mobile.png" });
await mobileContext.close();

/* -- camera lands where the data says ---------------------------------------
 *
 * The strongest claim this site makes about its camera is that the authored `t`
 * values mean something. If the rig samples the flight by arc length rather than
 * by waypoint, the authored weights are silently discarded and the camera drifts
 * up to 20% of the journey away from the waypoint it was composed for — which no
 * screenshot of the flight reveals, because the flight still looks like a smooth
 * camera move either way.
 *
 * So this stands the camera at each authored `t` and measures it against the
 * authored position. The seam exposes a frame counter because software rendering
 * runs at roughly 4fps: polling on wall-clock alone can read a frame from before
 * the requested `t` was ever sampled, which reads as tens of units of error that
 * does not exist.
 * -------------------------------------------------------------------------- */

const waypointSource = await readFile(
  path.join(ROOT, "src", "journey", "waypoints.ts"),
  "utf8",
);

const authoredWaypoints = [
  ...waypointSource.matchAll(
    /id:\s*"([^"]+)",\s*position:\s*\[\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\],[\s\S]*?fov:\s*([\d.]+),\s*t:\s*([\d.]+)/g,
  ),
].map(([, id, x, y, z, fov, t]) => ({
  id,
  position: [Number(x), Number(y), Number(z)],
  fov: Number(fov),
  t: Number(t),
}));

check(
  "waypoints parsed from source",
  authoredWaypoints.length >= 9,
  `${authoredWaypoints.length} found`,
);

const probeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const probePage = await probeContext.newPage();
const probeErrors = [];
probePage.on("pageerror", (e) => probeErrors.push(e.message));
probePage.on("console", (m) => {
  if (m.type() === "error") probeErrors.push(m.text());
});

await probePage.goto(`${BASE}/?journeyProbe=1`, { waitUntil: "domcontentloaded" });
await probePage.waitForSelector("[data-journey-canvas] canvas", {
  state: "attached",
  timeout: 60_000,
});
await probePage.waitForTimeout(2500);

const cameraMarks = [];

for (const w of authoredWaypoints) {
  await probePage.evaluate((t) => window.__forceProgress(t), w.t);
  const startFrame = await probePage.evaluate(() => window.__journeyProbe.frame);

  let reading = { frame: startFrame, camera: { x: 0, y: 0, z: 0 } };
  try {
    // Twelve frames is well past damping convergence at 4.2/s.
    await probePage.waitForFunction(
      (from) => window.__journeyProbe.frame - from >= 12,
      startFrame,
      { timeout: 30_000, polling: 100 },
    );
    reading = await probePage.evaluate(() => ({
      frame: window.__journeyProbe.frame,
      camera: { ...window.__journeyProbe.camera },
    }));
  } catch {
    // Left at the zero reading; the assertion below reports it as a miss.
  }

  const [wx, wy, wz] = w.position;
  const off = Math.hypot(reading.camera.x - wx, reading.camera.y - wy, reading.camera.z - wz);
  cameraMarks.push({ id: w.id, t: w.t, off });

  check(`camera lands on ${w.id}`, off <= 1, `t=${w.t} off=${off.toFixed(2)} units`);
}

const worstMark = cameraMarks.reduce((a, b) => (b.off > a.off ? b : a));
console.log(
  `info  waypoint accuracy — worst ${worstMark.id} at ${worstMark.off.toFixed(2)} units`,
);

check("probe raised no errors", probeErrors.length === 0, probeErrors.slice(0, 2).join(" | "));
await probeContext.close();

await browser.close();

console.log("");
if (failures.length) {
  console.log(`${failures.length} FAILED: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("phase 2 journey probe green");

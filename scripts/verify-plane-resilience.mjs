/**
 * Photo-plane resilience gate.
 *
 * The flight is not a mesh scene any more: it is a run of thirteen planes whose
 * textures arrive over the network while the visitor is already scrolling. The
 * two failures worth gating are a texture that never arrives (a beat must drop,
 * not crash) and a video that never produces a decodable frame (the arrival
 * beat must fall back to its poster).
 *
 * One context deliberately aborts a single beat's ladder webp and asserts the
 * page stays console-clean while the video still reaches a decodable frame. A
 * second, clean context asserts every plane reported ready through the
 * `window.__verdePlanesReady` seam.
 *
 *   node scripts/verify-plane-resilience.mjs
 *
 * Requires `npm start` on :3000.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

// The ladder path for the aborted beat (the balcony "view" plane). Verified
// against public/assets/lifestyle/balcony-skyline-*.webp.
const ABORT_GLOB = "**/assets/lifestyle/balcony-skyline*";

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

const failures = [];
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(label);
};

const isAbortMessage = (value) => /balcony-skyline/.test(value);
const isAbortConsole = (message) =>
  isAbortMessage(message.text) || isAbortMessage(message.url);

/* -- context 1: one beat's texture aborted, probe on ----------------------- */

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
const pageErrors = [];
const abortedRequests = [];

page.on("console", (m) => {
  if (m.type() !== "error") return;
  // Chromium reports a blocked subresource as "Failed to load resource" without
  // the URL in the text — the resource lives on the message location.
  consoleErrors.push({ text: m.text(), url: m.location()?.url ?? "" });
});
page.on("pageerror", (e) => pageErrors.push(e.message));
page.on("requestfailed", (r) => {
  const url = r.url();
  if (isAbortMessage(url)) abortedRequests.push(url);
  else pageErrors.push(`requestfailed: ${url} — ${r.failure()?.errorText ?? ""}`);
});

await context.route(ABORT_GLOB, (route) => route.abort());

await page.goto(`${BASE}/?journeyProbe=1`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("[data-journey-canvas] canvas", {
  state: "attached",
  timeout: 60_000,
});

check(
  "probe seam present",
  await page.evaluate(
    () => typeof window.__journeyProbe === "object" && window.__journeyProbe !== null,
  ),
);

let videoReady = -1;
try {
  await page.waitForFunction(
    () => Boolean(window.__journeyVideo) && window.__journeyVideo.readyState >= 2,
    { timeout: 20_000, polling: 200 },
  );
  videoReady = await page.evaluate(() => window.__journeyVideo.readyState);
} catch {
  videoReady = await page.evaluate(() =>
    window.__journeyVideo ? window.__journeyVideo.readyState : -1,
  );
}
check(
  "arrival video reaches readyState >= 2 within 20s",
  videoReady >= 2,
  `readyState=${videoReady}`,
);

check(
  "aborted beat texture was actually intercepted",
  abortedRequests.length > 0,
  `${abortedRequests.length} aborted`,
);

const unexpectedConsole = consoleErrors.filter((message) => !isAbortConsole(message));
check(
  "no console errors (aborted request excluded)",
  unexpectedConsole.length === 0,
  unexpectedConsole
    .slice(0, 3)
    .map((message) => message.text)
    .join(" | "),
);
check("no page errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));

await context.close();

/* -- context 2: clean load, every plane reports ready ---------------------- */

const cleanContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const cleanPage = await cleanContext.newPage();
await cleanPage.goto(BASE, { waitUntil: "domcontentloaded" });
await cleanPage.waitForSelector("[data-journey-canvas] canvas", {
  state: "attached",
  timeout: 60_000,
});

let planesReady = false;
try {
  await cleanPage.waitForFunction(() => window.__verdePlanesReady === true, {
    timeout: 60_000,
    polling: 250,
  });
  planesReady = true;
} catch {
  planesReady = false;
}
check("all planes report ready within 60s", planesReady);

await cleanContext.close();
await browser.close();

console.log("");
if (failures.length) {
  console.log(`${failures.length} FAILED: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("plane resilience gate green");

/**
 * Phase 1 gate — Playwright suite.
 *
 * Boots the built site in Chromium and asserts the foundation actually works:
 * the loader exits, real assets resolve, every chapter anchor scrolls into view,
 * the journey stays console-clean, and the layout holds across the required
 * widths (320 / 375 / 430 / 1440) plus with WebGL disabled.
 *
 *   node scripts/smoke.mjs              full run
 *   node scripts/smoke.mjs --shots      also write screenshots + failure report
 *   node scripts/smoke.mjs --quick      1440 + 375 only (faster inner loop)
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const SHOTS = process.argv.includes("--shots");
const QUICK = process.argv.includes("--quick");
const SHOT_DIR = path.join(ROOT, "scripts", "screenshots");

// Read the chapter list from source rather than importing TypeScript, so this
// script runs on plain Node without a loader.
const navSource = await readFile(path.join(ROOT, "src", "data", "navigation.ts"), "utf8");
const chapters = [...navSource.matchAll(/id:\s*"([^"]+)"\s*,\s*index:\s*"([^"]+)"/g)].map(
  ([, id, index]) => ({ id, index }),
);

/** Deep run: every assertion plus interaction coverage. */
const DEEP = [
  { name: "desktop", width: 1440, height: 900, dsf: 2, deep: true },
  { name: "mobile", width: 375, height: 812, dsf: 3, deep: true },
];

/** Gate widths that only need the responsive invariants. */
const SHALLOW = [
  { name: "tablet", width: 834, height: 1112, dsf: 2, deep: false },
  { name: "w320", width: 320, height: 640, dsf: 2, deep: false },
  { name: "w430", width: 430, height: 932, dsf: 3, deep: false },
];

const VIEWPORTS = QUICK ? DEEP : [...DEEP, ...SHALLOW];

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
  console.log(`  FAIL  ${message}`);
}

function ok(message) {
  console.log(`  ok    ${message}`);
}

function unique(list, n = 4) {
  return [...new Set(list)].slice(0, n);
}

async function newPage(browser, vp, { webgl = true, reducedMotion = "no-preference" } = {}) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    reducedMotion,
  });

  if (!webgl) {
    // Simulate a device where WebGL is unavailable — the journey must degrade
    // to the DOM-only experience rather than failing.
    await context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
        if (typeof type === "string" && type.includes("webgl")) return null;
        return original.call(this, type, ...rest);
      };
    });
  }

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.url()} — ${req.failure()?.errorText}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.url()} — HTTP ${res.status()}`);
  });

  return { context, page, consoleErrors, pageErrors, failedRequests };
}

// Sanity-check the reading of navigation.ts before spending a browser on it.
if (chapters.length === 0) {
  console.error("FAIL  could not parse any chapters from src/data/navigation.ts");
  process.exit(1);
}

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  console.log(`\n${vp.name} ${vp.width}x${vp.height} @${vp.dsf}x${vp.deep ? "" : " (shallow)"}`);

  const { context, page, consoleErrors, pageErrors, failedRequests } = await newPage(browser, vp);

  await page.goto(BASE, { waitUntil: "networkidle" });

  // --- Loader must exit on its own -----------------------------------------
  try {
    await page.waitForSelector("[data-loader]", { state: "detached", timeout: 12_000 });
    ok("loader exits without user interaction");
  } catch {
    fail("loader never exited");
  }

  // --- Hero photograph actually decoded ------------------------------------
  const heroImg = page.locator("#hero img").first();
  await heroImg.waitFor({ state: "visible", timeout: 10_000 });
  const heroBox = await heroImg.boundingBox();
  if (heroBox && heroBox.width > vp.width * 0.9) {
    ok(`hero photograph fills viewport (${Math.round(heroBox.width)}px)`);
  } else {
    fail(`hero photograph too small: ${JSON.stringify(heroBox)}`);
  }

  const naturalWidth = await heroImg.evaluate((img) => img.naturalWidth);
  if (naturalWidth > 0) ok(`hero photograph decoded (naturalWidth ${naturalWidth})`);
  else fail("hero photograph never decoded");

  // AVIF is the preferred source; confirm the browser actually took it.
  const servedFormat = await page.evaluate(() => {
    const img = document.querySelector("#hero img");
    const sources = Array.from(img?.closest("picture")?.querySelectorAll("source") ?? []);
    for (const s of sources) {
      if (img.currentSrc.includes(new URL(s.srcset.split(" ")[0], location.origin).pathname)) {
        return s.type;
      }
    }
    return img?.currentSrc.split(".").pop() ?? "unknown";
  });
  if (/avif|webp/.test(servedFormat)) ok(`hero served as ${servedFormat}`);
  else fail(`unexpected hero format: ${servedFormat}`);

  // --- Headline is real, visible text --------------------------------------
  const h1 = (await page.locator("h1").first().innerText()).trim();
  if (h1.length > 10) ok(`h1 reads "${h1.replace(/\s+/g, " ")}"`);
  else fail(`h1 missing or too short: "${h1}"`);

  // --- No horizontal overflow ----------------------------------------------
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow <= 1) ok("no horizontal overflow");
  else fail(`horizontal overflow of ${overflow}px`);

  // --- Every chapter anchor resolves and can be scrolled to ----------------
  const chapterProblems = [];
  for (const chapter of chapters) {
    const target = page.locator(`#${chapter.id}`);
    if ((await target.count()) === 0) {
      chapterProblems.push(`chapter ${chapter.index} (#${chapter.id}) not in the DOM`);
      continue;
    }

    // Scrolled through the DOM rather than via Playwright's actionability helper:
    // that helper waits for the element to be "stable", and a continuously
    // animating WebGL layer behind the page means it never settles.
    await target.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }));
    await page.waitForTimeout(180);

    const inView = await target.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });

    if (!inView) chapterProblems.push(`chapter ${chapter.index} (#${chapter.id}) did not scroll into view`);
  }
  for (const problem of chapterProblems) fail(problem);
  if (chapterProblems.length === 0) ok(`all ${chapters.length} chapters reachable by anchor`);

  if (vp.deep) {
    // --- Nav behaviour -----------------------------------------------------
    if (vp.width >= 1024) {
      const bar = page.locator("[data-whatsapp-bar]");
      const barVisible = await bar.isVisible();
      if (barVisible === false) ok("sticky WhatsApp bar hidden on desktop");
      else fail("sticky WhatsApp bar should be hidden on desktop");
      const headerWa = page.locator('header a[href^="https://wa.me/"]');
      if ((await headerWa.count()) >= 1) ok("header WhatsApp CTA present");
      else fail(`expected header WhatsApp CTA, found ${await headerWa.count()}`);
      const cta = page.locator('nav[aria-label="Primary"] a', { hasText: "Residences" });
      if ((await cta.count()) === 1) ok("primary nav links present");
      else fail(`expected 1 primary nav Residences link, found ${await cta.count()}`);
    } else {
      // The bar retracts on downward scroll, so return to the top before
      // operating it — otherwise the trigger is genuinely off-screen.
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(600);

      // Task 1: sticky WhatsApp bar
      const bar = page.locator("[data-whatsapp-bar]");
      const barVisibleMobile = await bar.isVisible();
      if (barVisibleMobile) {
        const href = await bar.getAttribute("href");
        if (href?.startsWith("https://wa.me/")) ok("sticky WhatsApp bar visible with wa.me link");
        else fail(`sticky bar href is "${href}"`);
      } else fail("sticky WhatsApp bar not visible on mobile");

      const trigger = page.locator('button[aria-controls="mobile-menu"]');
      await trigger.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
      await trigger.click({ timeout: 15_000 });
      await page.waitForTimeout(700);

      const menuVisible = await page.locator("#mobile-menu a").first().isVisible();
      if (menuVisible) ok("mobile menu opens");
      else fail("mobile menu did not open");

      const locked = await page.evaluate(() => getComputedStyle(document.body).overflow);
      if (locked === "hidden") ok("page scroll locked behind menu");
      else fail(`body overflow is "${locked}" with menu open`);

      // Focus must land inside the panel, not stay on the trigger.
      const focusInPanel = await page.evaluate(() => {
        const panel = document.getElementById("mobile-menu");
        return panel?.contains(document.activeElement) ?? false;
      });
      if (focusInPanel) ok("focus moved into the menu panel");
      else fail("focus did not move into the menu panel");

      await page.keyboard.press("Escape");
      await page.waitForTimeout(600);

      const restored = await page.evaluate(() => document.body.style.overflow);
      if (restored !== "hidden") ok("scroll lock released on close");
      else fail("scroll lock not released on close");

      const focusReturned = await page.evaluate(() => {
        const triggerEl = document.querySelector('button[aria-controls="mobile-menu"]');
        return triggerEl === document.activeElement;
      });
      if (focusReturned) ok("focus returned to the trigger after close");
      else fail("focus not returned to the trigger after close");
    }

    // funnel contract
    const rows = await page.locator("#availability [data-availability-row]").count();
    if (rows >= 5 && rows <= 8) ok(`availability rows: ${rows}`); else fail(`availability rows: ${rows}`);
    const waLinks = await page.locator('#availability a[href^="https://wa.me/"]').count();
    if (waLinks === rows) ok("every availability row links to WhatsApp"); else fail(`${waLinks} wa.me links for ${rows} rows`);
    const navHasAvailability = await page.locator('nav[aria-label="Primary"] a[href="#availability"]').count();
    if (vp.width >= 1024) { navHasAvailability === 1 ? ok("nav links Availability") : fail("nav missing #availability link"); }
  }

  // --- Error tally ---------------------------------------------------------
  if (consoleErrors.length > 0) fail(`console errors: ${unique(consoleErrors).join(" | ")}`);
  else ok("no console errors");

  if (pageErrors.length > 0) fail(`uncaught page errors: ${unique(pageErrors).join(" | ")}`);
  else ok("no uncaught exceptions");

  if (failedRequests.length > 0) fail(`failed requests: ${unique(failedRequests, 6).join(" | ")}`);
  else ok("no failed requests");

  // --- Screenshots ---------------------------------------------------------
  if (SHOTS) {
    await mkdir(SHOT_DIR, { recursive: true });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-loader]", { state: "detached", timeout: 12_000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(SHOT_DIR, `${vp.name}-hero.png`) });

    for (const [id, label] of [
      ["development", "development"],
      ["residences", "residences"],
    ]) {
      await page.locator(`#${id}`).evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }));
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(SHOT_DIR, `${vp.name}-${label}.png`) });
    }

    notes.push(`${vp.name}: 3 screenshots written`);
  }

  await context.close();
}

/* --- Reduced motion: content must never stay hidden ------------------------ */
console.log(`\nreduced-motion`);
{
  const { context, page } = await newPage(browser, DEEP[0], { reducedMotion: "reduce" });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-loader]", { state: "detached", timeout: 12_000 });

  await page.locator("#development").evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "start" }));
  await page.waitForTimeout(400);

  // Reveal from-states are applied by GSAP at runtime; with motion reduced they
  // must render in the final state, with no element left at opacity 0.
  const invisible = await page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll("#development h2, #development p, #development li"),
    );
    return nodes.filter((n) => Number(getComputedStyle(n).opacity) < 0.9).length;
  });
  if (invisible === 0) ok("all development content visible under prefers-reduced-motion");
  else fail(`${invisible} elements still hidden under prefers-reduced-motion`);

  await context.close();
}

/* --- WebGL disabled: the journey must still render ------------------------ */
console.log(`\nwebgl-disabled`);
{
  const { context, page, consoleErrors, failedRequests } = await newPage(browser, DEEP[0], {
    webgl: false,
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-loader]", { state: "detached", timeout: 12_000 });

  const readable = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    return {
      h1: (h1?.textContent ?? "").trim().length,
      chapters: document.querySelectorAll("section[id]").length,
      heroDecoded: (document.querySelector("#hero img")?.naturalWidth ?? 0) > 0,
    };
  });

  if (readable.h1 > 10) ok("headline still readable without WebGL");
  else fail("headline missing without WebGL");

  if (readable.chapters === chapters.length) ok(`all ${readable.chapters} chapters present without WebGL`);
  else fail(`expected ${chapters.length} chapters without WebGL, found ${readable.chapters}`);

  if (readable.heroDecoded) ok("hero photograph still decodes without WebGL");
  else fail("hero photograph failed without WebGL");

  if (consoleErrors.length > 0) fail(`console errors without WebGL: ${unique(consoleErrors).join(" | ")}`);
  else ok("no console errors without WebGL");

  if (failedRequests.length > 0) fail(`failed requests without WebGL: ${unique(failedRequests, 4).join(" | ")}`);
  else ok("no failed requests without WebGL");

  await context.close();
}

await browser.close();

console.log(`\n${"=".repeat(64)}`);
for (const note of notes) console.log(note);

if (failures.length > 0) {
  console.log(`\nSMOKE FAILED — ${failures.length} problem(s)`);
  for (const failure of failures) console.log(`  - ${failure}`);

  await mkdir(SHOT_DIR, { recursive: true });
  await writeFile(path.join(SHOT_DIR, "smoke-report.txt"), failures.join("\n"), "utf8");
  console.log(`\nreport + screenshots: ${path.relative(ROOT, SHOT_DIR)}`);
  process.exit(1);
}

console.log("SMOKE PASSED");
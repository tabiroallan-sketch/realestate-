/**
 * Anchor integrity check.
 *
 * The scroll rail, mobile menu and `useActiveSection` all navigate by fragment,
 * so a chapter id that no longer exists on a rendered section silently breaks
 * navigation. This parses the chapter list and confirms every id is rendered.
 *
 *   node scripts/verify-anchors.mjs
 */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = path.join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full)));
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

const navSource = await readFile(path.join(SRC, "data", "navigation.ts"), "utf8");

const chapters = [...navSource.matchAll(/id:\s*"([^"]+)"\s*,\s*index:\s*"([^"]+)"/g)].map(
  ([, id, index]) => ({ id, index }),
);

if (chapters.length === 0) {
  console.error("FAIL  could not parse any chapters from navigation.ts");
  process.exit(1);
}

// ids referenced by the primary navigation and CTAs
const navHrefs = [...navSource.matchAll(/href:\s*"(#[^"]+)"/g)].map(([, href]) => href.slice(1));

const files = await walk(SRC);
const sources = new Map();
for (const file of files) {
  sources.set(path.relative(ROOT, file), await readFile(file, "utf8"));
}

/**
 * Ids reach the DOM two ways: written literally on a <section>, or passed as a
 * prop from `site.ts` into components that spread it onto an element
 * (`EditorialChapter` does `id={id}`). Collect both.
 */
const renderedIds = new Set();
for (const source of sources.values()) {
  for (const match of source.matchAll(/\bid="([a-z0-9-]+)"/g)) renderedIds.add(match[1]);
}

const siteSource = await readFile(path.join(SRC, "data", "site.ts"), "utf8");

// `sections` entries declare their anchor as `id: "lobby"` inside the data file.
const declaredSectionIds = new Set();
for (const match of siteSource.matchAll(/^\s+id:\s*"([a-z0-9-]+)"/gm)) {
  declaredSectionIds.add(match[1]);
  renderedIds.add(match[1]);
}

const problems = [];

for (const chapter of chapters) {
  if (!renderedIds.has(chapter.id)) {
    problems.push(`chapter ${chapter.index} "${chapter.id}" has no rendered section id`);
  }
}

const heroBlock = siteSource.match(/export const hero = \{[\s\S]*?\n\} as const;/)?.[0] ?? "";
const targets = new Set([...navHrefs]);

// Hero CTAs only — `footer.links` point at legal pages that ship as separate
// routes in a later phase and are deliberately not section anchors.
for (const [, href] of heroBlock.matchAll(/href:\s*"(#[^"]+)"/g)) targets.add(href.slice(1));

for (const target of targets) {
  if (!renderedIds.has(target)) {
    problems.push(`navigation or CTA targets "#${target}" but no element declares that id`);
  }
}

// Warn, but never fail: these are forward references to pages, not anchors.
const legal = [...siteSource.matchAll(/\{ label: "(\w+)", href: "#[^"]+" \}/g)].map(
  ([, label]) => label,
);
if (legal.length > 0) {
  console.log(`note  ${legal.length} legal links point to routes not yet built: ${legal.join(", ")}`);
}

console.log(
  `Anchors — ${chapters.length} chapters, ${declaredSectionIds.size} data-driven sections, ${renderedIds.size} total ids`,
);

if (problems.length > 0) {
  console.error("\nFAIL");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log("PASS  every chapter and navigation target resolves");
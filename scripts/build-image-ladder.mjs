/**
 * Builds a responsive WebP/AVIF ladder from the provided source imagery.
 *
 * Source files live in ./image with timestamp suffixes and literal U+2026
 * characters. This script reads scripts/assets.manifest.json, transcodes each
 * source into canonical public names across a width ladder, and writes a
 * LQIP blur placeholder per asset.
 *
 *   node scripts/build-image-ladder.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "image");
const OUT_ROOT = path.join(ROOT, "public", "assets");
const MANIFEST = path.join(ROOT, "scripts", "assets.manifest.json");

/** Width ladder. Sources are 1376px wide; 1728 covers 1440p displays at 1.2x. */
const WIDTHS = [640, 960, 1376, 1728];

/** LQIP: rendered at this width, inlined as a base64 data URI. */
const LQIP_WIDTH = 24;

async function buildOne(asset, manifest) {
  const sourcePath = path.join(SOURCE_DIR, asset.source);

  if (!existsSync(sourcePath)) {
    console.warn(`  ! missing source: ${asset.source}`);
    return { key: asset.key, dir: asset.dir, name: asset.name, wrote: 0, missing: true };
  }

  const outDir = path.join(OUT_ROOT, asset.dir);
  await mkdir(outDir, { recursive: true });

  // Never upscale — anything beyond the intrinsic width is dead weight.
  const meta = await sharp(sourcePath).metadata();
  const intrinsicWidth = meta.width ?? manifest.width;
  const widths = WIDTHS.filter((w) => w <= intrinsicWidth);
  if (widths.length === 0) widths.push(intrinsicWidth);

  const pipeline = sharp(sourcePath, { failOn: "none" });

  let written = 0;

  for (const width of widths) {
    await pipeline
      .clone()
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 52, effort: 6 })
      .toFile(path.join(outDir, `${asset.name}-${width}.avif`));

    await pipeline
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 74, effort: 5 })
      .toFile(path.join(outDir, `${asset.name}-${width}.webp`));

    written += 2;
  }

  // LQIP for blur-up placeholders.
  const lqip = await pipeline
    .clone()
    .resize({ width: LQIP_WIDTH })
    .webp({ quality: 32, alphaQuality: 40 })
    .toBuffer();

  return {
    key: asset.key,
    dir: asset.dir,
    name: asset.name,
    wrote: written,
    blurDataURL: `data:image/webp;base64,${lqip.toString("base64")}`,
    widths,
    intrinsicWidth,
    intrinsicHeight: meta.height ?? manifest.height,
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));

  // Fail loudly rather than silently reusing an image across sections — a
  // duplicated source means two chapters show the same photograph.
  const seen = new Map();
  for (const asset of manifest.images) {
    if (seen.has(asset.source)) {
      throw new Error(
        `Duplicate source "${asset.source}" used by both "${seen.get(asset.source)}" and "${asset.key}". ` +
          `Each source image must back exactly one section.`,
      );
    }
    seen.set(asset.source, asset.key);

    if (!existsSync(path.join(SOURCE_DIR, asset.source))) {
      throw new Error(`Missing source file for "${asset.key}": ${asset.source}`);
    }
  }

  console.log(`\nImage ladder — ${manifest.images.length} assets (all sources unique and present)\n`);

  const results = [];
  for (const asset of manifest.images) {
    process.stdout.write(`  ${asset.name.padEnd(22)}`);
    const result = await buildOne(asset, manifest);
    results.push(result);
    console.log(result.missing ? "missing" : `ok (${result.wrote} files)`);
  }

  /**
   * Emit the generated metadata so the app never has to hardcode it.
   *
   * `srcSetBase` is the public path without extension or width, from which the
   * app derives `${base}-${width}.${format}`. The prebuilt AVIF/WebP ladder is
   * served directly via `<picture>` — running it back through `next/image`
   * would re-encode assets that are already optimised.
   */
  const out = Object.fromEntries(
    results
      .filter((r) => !r.missing)
      .map((r) => [
        r.key,
        {
          srcSetBase: `/assets/${r.dir}/${r.name}`,
          widths: r.widths,
          formats: ["avif", "webp"],
          width: r.intrinsicWidth,
          height: r.intrinsicHeight,
          blurDataURL: r.blurDataURL,
        },
      ]),
  );

  await writeFile(
    path.join(ROOT, "scripts", "generated", "image-meta.json"),
    JSON.stringify(out, null, 2),
  );

  console.log(`\nDone. Wrote scripts/generated/image-meta.json\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
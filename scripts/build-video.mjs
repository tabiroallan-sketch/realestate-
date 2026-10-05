/**
 * Transcodes the provided aerial clip into web-ready formats.
 *
 * The source carries an AAC audio track (never used) and sits at 5.5 Mbps.
 * This script strips audio, emits WebM (VP9) + trimmed MP4 (H.264), and
 * extracts poster frames at key moments.
 *
 *   node scripts/build-video.mjs
 */
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const run = promisify(execFile);

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "image");
const OUT_ROOT = path.join(ROOT, "public", "assets");
const MANIFEST = path.join(ROOT, "scripts", "assets.manifest.json");

const ffmpeg = "ffmpeg";
const ffprobe = "ffprobe";

/** Where the seamless loop starts (skips the clip's settling beat). */
const LOOP_START = 0.6;

/** Frames trimmed from the end so the loop restarts mid-motion. */
const LOOP_TAIL = 0.4;

async function ffmpegRun(args) {
  return run(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    maxBuffer: 1024 * 1024 * 32,
  });
}

async function probeDuration(file) {
  const { stdout } = await run(ffprobe, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    file,
  ]);
  return Number.parseFloat(stdout.trim());
}

async function sizeOf(file) {
  const { stat } = await import("node:fs/promises");
  return (await stat(file)).size;
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const video = manifest.video;
  const sourcePath = path.join(SOURCE_DIR, video.source);

  if (!existsSync(sourcePath)) {
    console.warn(`\n  ! missing source: ${video.source}\n`);
    return;
  }

  const outDir = path.join(OUT_ROOT, video.dir);
  await mkdir(outDir, { recursive: true });

  console.log(`\nVideo — ${video.name}`);
  console.log(`  source: ${video.source}`);
  console.log(`  duration: ${(await probeDuration(sourcePath)).toFixed(2)}s\n`);

  // Trim the first beat (camera settles) and the final frames so the loop
  // restarts mid-motion rather than on a cut.
  const clipLength = Math.max(1, video.duration - LOOP_START - LOOP_TAIL);

  const inputs = [
    "-ss",
    String(LOOP_START),
    "-t",
    String(clipLength),
    "-i",
    sourcePath,
  ];

  // VP9 / WebM — preferred by modern browsers. CRF 40 targets ~1MB for this
  // 9s 720p background clip; VP9 needs far higher CRF than x264 for parity.
  const webmPath = path.join(outDir, `${video.name}.webm`);
  await ffmpegRun([
    ...inputs,
    "-an", // strip the unused AAC track
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "40",
    "-b:v",
    "0",
    "-row-mt",
    "1",
    "-cpu-used",
    "3",
    "-deadline",
    "good",
    "-pix_fmt",
    "yuv420p",
    webmPath,
  ]);
  console.log(`  webm  ${(await sizeOf(webmPath) / 1024).toFixed(0)} KB`);

  // H.264 / MP4 — universal fallback, same trimmed range.
  const mp4Path = path.join(outDir, `${video.name}.mp4`);
  await ffmpegRun([
    ...inputs,
    "-an",
    "-c:v",
    "libx264",
    "-crf",
    "26",
    "-preset",
    "slow",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4Path,
  ]);
  console.log(`  mp4   ${(await sizeOf(mp4Path) / 1024).toFixed(0)} KB`);

  // Poster frame — the still shown before playback and under reduced motion.
  const posterPath = path.join(outDir, `${video.name}-poster.webp`);
  await ffmpegRun([
    "-ss",
    String(LOOP_START + 0.2),
    "-i",
    sourcePath,
    "-frames:v",
    "1",
    "-c:v",
    "libwebp",
    "-q:v",
    "72",
    posterPath,
  ]);
  console.log(`  poster ${(await sizeOf(posterPath) / 1024).toFixed(0)} KB`);

  await writeFile(
    path.join(ROOT, "scripts", "generated", "video-meta.json"),
    JSON.stringify(
      {
        key: video.key,
        webm: `/assets/${video.dir}/${video.name}.webm`,
        mp4: `/assets/${video.dir}/${video.name}.mp4`,
        poster: `/assets/${video.dir}/${video.name}-poster.webp`,
        width: video.width,
        height: video.height,
      },
      null,
      2,
    ),
  );

  console.log("\nDone. Wrote scripts/generated/video-meta.json\n");
}

main().catch((error) => {
  console.error(error.stderr ?? error);
  process.exit(1);
});
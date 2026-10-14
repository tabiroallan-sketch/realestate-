import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WAYPOINTS_PATH = path.join(ROOT, "src", "journey", "waypoints.ts");

const waypointsSource = await readFile(WAYPOINTS_PATH, "utf8");

const waypointRegex = /id:\s*"([^"]+)",\s*position:\s*\[\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\],[\s\S]*?fov:\s*([\d.]+),\s*t:\s*([\d.]+)/g;
const waypoints = [];
for (const match of waypointsSource.matchAll(waypointRegex)) {
  waypoints.push({ id: match[1], t: Number.parseFloat(match[6]) });
}

if (waypoints.length !== 13) {
  console.error(`FAIL  expected 13 waypoints, found ${waypoints.length}`);
  process.exit(1);
}
if (Math.abs(waypoints[0].t - 0) > 1e-12 || Math.abs(waypoints[12].t - 1) > 1e-12) {
  console.error("FAIL  t[0] and t[12] must be 0 and 1");
  process.exit(1);
}
for (let i = 1; i < waypoints.length; i += 1) {
  if (waypoints[i].t <= waypoints[i - 1].t) {
    console.error(`FAIL  waypoints not strictly increasing at index ${i}`);
    process.exit(1);
  }
}

const { WAYPOINTS } = await import("../src/journey/waypoints.ts");
const {
  ASPECT,
  FIT_EPSILON,
  planeHeight,
  planeWidth,
  crossfadeWindow,
  weightsInto,
  beatWeights,
  activeBeat,
  planePose,
  planeOpacity,
  kenBurnsScale,
} = await import("../src/journey/photoPlanes.ts");

const ts = WAYPOINTS.map((w) => w.t);

if (Math.abs(ASPECT - 16 / 9) > 1e-12) {
  console.error("FAIL  ASPECT");
  process.exit(1);
}
if (Math.abs(FIT_EPSILON - 1.03) > 1e-12) {
  console.error("FAIL  FIT_EPSILON");
  process.exit(1);
}

const d = 90;
const fov = 38;
const hExpected = 2 * d * Math.tan((fov * Math.PI) / 360) * 1.03;
const wExpected = hExpected * (16 / 9);
if (Math.abs(planeHeight(d, fov) - hExpected) > 1e-9) {
  console.error("FAIL  planeHeight formula");
  process.exit(1);
}
if (Math.abs(planeWidth(d, fov) - wExpected) > 1e-9) {
  console.error("FAIL  planeWidth formula");
  process.exit(1);
}

for (let i = 0; i < ts.length; i += 1) {
  const bw = beatWeights(ts[i], ts);
  if (bw[i] < 0.9999) {
    console.error(`FAIL  beatWeight at anchor ${i}`);
    process.exit(1);
  }
  for (let j = 0; j < ts.length; j += 1) {
    if (i === j) continue;
    if (bw[j] > 1e-6) {
      console.error(`FAIL  beatWeight contamination at ${i},${j}`);
      process.exit(1);
    }
  }
  if (activeBeat(ts[i], ts) !== i) {
    console.error(`FAIL  activeBeat at anchor ${i}`);
    process.exit(1);
  }
}

for (let t = 0; t <= 1; t += 0.001) {
  const w = beatWeights(t, ts);
  let sum = 0;
  for (let i = 0; i < w.length; i += 1) sum += w[i];
  if (sum < 0.999) {
    console.error(`FAIL  sum weights < 0.999 at t=${t}`);
    process.exit(1);
  }
  let count = 0;
  for (let i = 0; i < w.length; i += 1) {
    if (w[i] > 0.001) count += 1;
  }
  if (count > 2) {
    console.error(`FAIL  too many active weights at t=${t}`);
    process.exit(1);
  }
  const a = activeBeat(t, ts);
  if (a < 0 || a > 12) {
    console.error(`FAIL  activeBeat out of range at t=${t}`);
    process.exit(1);
  }
  if (w[a] < 0.5) {
    console.error(`FAIL  activeBeat not dominant at t=${t}`);
    process.exit(1);
  }
}

const poseAnchors = WAYPOINTS.map((w) => ({
  id: w.id,
  position: w.position,
  target: w.target,
  fov: w.fov,
  t: w.t,
}));

for (let i = 0; i < poseAnchors.length; i += 1) {
  const anchor = poseAnchors[i];
  let depth;
  if (i >= 4 && i <= 8) {
    depth = 130;
  } else if (i === 3) {
    depth = 70;
  } else {
    depth = 90;
  }
  const pose = planePose(poseAnchors, i, depth);
  const p = pose.position;
  const ap = anchor.position;
  const dist = Math.hypot(p[0] - ap[0], p[1] - ap[1], p[2] - ap[2]);
  if (Math.abs(dist - depth) > 1e-6) {
    console.error(`FAIL  planePose distance at ${i}`);
    process.exit(1);
  }
  const dx = anchor.target[0] - ap[0];
  const dy = anchor.target[1] - ap[1];
  const dz = anchor.target[2] - ap[2];
  const tlen = Math.hypot(dx, dy, dz);
  if (tlen > 0) {
    const tdirx = dx / tlen;
    const tdiry = dy / tlen;
    const tdirz = dz / tlen;
    const dirx = p[0] - ap[0];
    const diry = p[1] - ap[1];
    const dirz = p[2] - ap[2];
    const dlen = Math.hypot(dirx, diry, dirz);
    if (dlen > 0) {
      const dot = (dirx / dlen) * tdirx + (diry / dlen) * tdiry + (dirz / dlen) * tdirz;
      if (Math.abs(dot - 1) > 1e-6) {
        console.error(`FAIL  planePose direction at ${i}`);
        process.exit(1);
      }
    }
  }
  if (Math.abs(pose.height - planeHeight(depth, anchor.fov)) > 1e-9) {
    console.error(`FAIL  planePose height at ${i}`);
    process.exit(1);
  }
  const q = pose.quaternion;
  const qlen = Math.hypot(q[0], q[1], q[2], q[3]);
  if (Math.abs(qlen - 1) > 1e-9) {
    console.error(`FAIL  planePose quaternion not unit at ${i}`);
    process.exit(1);
  }
  const nlen = Math.hypot(ap[0] - p[0], ap[1] - p[1], ap[2] - p[2]);
  if (nlen > 0) {
    const nx = (ap[0] - p[0]) / nlen;
    const ny = (ap[1] - p[1]) / nlen;
    const nz = (ap[2] - p[2]) / nlen;
    const rotatedX = 2 * (q[0] * q[2] + q[3] * q[1]);
    const rotatedY = 2 * (q[1] * q[2] - q[3] * q[0]);
    const rotatedZ = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    const facing = rotatedX * nx + rotatedY * ny + rotatedZ * nz;
    if (Math.abs(facing - 1) > 1e-6) {
      console.error(`FAIL  planePose orientation at ${i}`);
      process.exit(1);
    }
  }
}

function smoothstepLocal(a, b, t) {
  if (b <= a) return t <= a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

const s4 = smoothstepLocal(2, 6, 4);
if (Math.abs(planeOpacity(0.5, 4) - 0.5 * s4) > 1e-9) {
  console.error("FAIL  planeOpacity");
  process.exit(1);
}
if (planeOpacity(0.001, 5) !== 0) {
  console.error("FAIL  planeOpacity weight threshold low");
  process.exit(1);
}
if (planeOpacity(0.002, 5) !== 0) {
  console.error("FAIL  planeOpacity weight threshold boundary");
  process.exit(1);
}
if (kenBurnsScale(0.5, true) !== 1) {
  console.error("FAIL  kenBurnsScale reduced");
  process.exit(1);
}
const s05 = smoothstepLocal(0, 1, 0.5);
if (Math.abs(kenBurnsScale(0.5, false) - (1 + 0.04 * s05)) > 1e-9) {
  console.error("FAIL  kenBurnsScale");
  process.exit(1);
}

console.log("PASS  photo-plane math verified");

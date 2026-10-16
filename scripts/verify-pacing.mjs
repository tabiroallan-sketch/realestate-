import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const { WAYPOINTS } = await import("../src/journey/waypoints.ts");
const { createFlightPacing, makeMonotoneInterpolant } = await import("../src/journey/pacing.ts");

function fail(message, detail) {
  console.error(`FAIL  ${message}${detail === undefined ? "" : ` — ${detail}`}`);
  process.exit(1);
}

const pacing = createFlightPacing(WAYPOINTS);
const out = new THREE.Vector3();

function distanceTo(tuple, point) {
  return Math.hypot(tuple[0] - point.x, tuple[1] - point.y, tuple[2] - point.z);
}

for (const waypoint of WAYPOINTS) {
  pacing.positionAt(waypoint.t, out);
  const positionError = distanceTo(waypoint.position, out);
  if (positionError > 1e-6) fail(`position at knot ${waypoint.id}`, `${positionError} units`);

  pacing.targetAt(waypoint.t, out);
  const targetError = distanceTo(waypoint.target, out);
  if (targetError > 1e-6) fail(`target at knot ${waypoint.id}`, `${targetError} units`);

  const fovError = Math.abs(pacing.fovAt(waypoint.t) - waypoint.fov);
  if (fovError > 1e-9) fail(`fov at knot ${waypoint.id}`, `${fovError} deg`);
}

pacing.positionAt(-0.5, out);
if (distanceTo(WAYPOINTS[0].position, out) > 1e-9) fail("clamp below 0");
pacing.positionAt(1.5, out);
if (distanceTo(WAYPOINTS[WAYPOINTS.length - 1].position, out) > 1e-9) fail("clamp above 1");

const h = 1e-3;
const speed = (t) => {
  const before = new THREE.Vector3();
  const after = new THREE.Vector3();
  const t0 = Math.max(0, t - h);
  const t1 = Math.min(1, t + h);
  pacing.positionAt(t0, before);
  pacing.positionAt(t1, after);
  return before.distanceTo(after) / (t1 - t0);
};

const grid = [];
for (let t = 0; t <= 1; t += 0.001) grid.push({ t, v: speed(t) });
grid.push({ t: 1, v: speed(1) });

const speeds = grid.map((sample) => sample.v).sort((a, b) => a - b);
const minSpeed = speeds[0];
const maxSpeed = speeds[speeds.length - 1];
const medianSpeed = speeds[Math.floor(speeds.length / 2)];

if (!(minSpeed > 0)) fail("flight stalls", `min speed ${minSpeed}`);
const minRatio = minSpeed / medianSpeed;
if (minRatio < 0.05) fail("flight nearly stalls", `min/median speed ratio ${minRatio.toFixed(4)}`);

let maxJump = 0;
for (const waypoint of WAYPOINTS) {
  if (waypoint.t === 0 || waypoint.t === 1) continue;
  const left = (waypoint) => {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    pacing.positionAt(waypoint.t - h, a);
    pacing.positionAt(waypoint.t, b);
    return a.distanceTo(b) / h;
  };
  const right = (waypoint) => {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    pacing.positionAt(waypoint.t, a);
    pacing.positionAt(waypoint.t + h, b);
    return b.distanceTo(a) / h;
  };
  const vLeft = left(waypoint);
  const vRight = right(waypoint);
  const jump = Math.abs(vRight - vLeft) / Math.max(vLeft, vRight);
  if (jump > maxJump) maxJump = jump;
  if (jump > 0.1) fail(`speed jump at waypoint ${waypoint.id}`, `${(jump * 100).toFixed(1)}%`);
}

const fovs = WAYPOINTS.map((waypoint) => waypoint.fov);
const minFov = Math.min(...fovs);
const maxFov = Math.max(...fovs);
for (const sample of grid) {
  const fov = pacing.fovAt(sample.t);
  if (fov < minFov - 0.01 || fov > maxFov + 0.01) {
    fail("fov overshoot", `${fov.toFixed(2)} outside [${minFov - 0.01}, ${maxFov + 0.01}]`);
  }
}

const xs = [0, 0.1, 0.3, 0.7, 1];
const ys = [0, 0.05, 0.4, 0.9, 1];
const interpolant = makeMonotoneInterpolant(xs, ys);
for (let i = 0; i < xs.length; i += 1) {
  if (Math.abs(interpolant(xs[i]) - ys[i]) > 1e-12) fail(`interpolant exactness at ${xs[i]}`);
}
let previous = -Infinity;
for (let x = 0; x <= 1; x += 1e-3) {
  const y = interpolant(x);
  if (y < previous - 1e-12) fail(`interpolant regressed at x=${x}`, `${y} < ${previous}`);
  if (y < -1e-12 || y > 1 + 1e-12) fail(`interpolant overshoot at x=${x}`, y);
  previous = y;
}
if (interpolant(-1) !== 0 || interpolant(2) !== 1) fail("interpolant clamp");

const turning = makeMonotoneInterpolant([0, 1, 2, 3], [0, 1, 0, 1]);
for (let x = 0; x <= 3; x += 1e-3) {
  const y = turning(x);
  if (y < -1e-12 || y > 1 + 1e-12) fail(`turning-point overshoot at x=${x}`, y);
}

try {
  makeMonotoneInterpolant([0], [0]);
  fail("interpolant accepts a single stop");
} catch {
  // expected
}

console.log(
  `PASS  camera pacing verified (knot jumps ≤ ${(maxJump * 100).toFixed(1)}%, ` +
    `min/median speed ${minRatio.toFixed(3)}, speed range ${minSpeed.toFixed(1)}–${maxSpeed.toFixed(1)})`,
);

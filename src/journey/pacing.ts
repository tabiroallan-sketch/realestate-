/**
 * Camera path pacing — how authored scroll `t` becomes distance flown.
 *
 * Each channel (position, look-at) is one Catmull-Rom curve fitted through the
 * authored waypoints, but a curve's own parameter is a fraction of the
 * *waypoint sequence*: an aerial leg of 90m and a lobby step of 12m get the
 * same slice of scroll, so world speed jumps the instant the camera passes a
 * waypoint. Sampling by arc length alone (`getPointAt`) fixes the speed but
 * discards the authored `t` weights, which is fatal to shot composition —
 * measured drift before the old index-space remap existed was 136.8 units off
 * the balcony waypoint.
 *
 * This remap does both at once. Authored `t` is mapped onto normalised arc
 * length read from the curve's own arc-length table, so waypoint `i` lands on
 * the exact entry `getPointAt` reads back and framing at every waypoint is
 * preserved to floating point. The table is then interpolated with a monotone
 * cubic Hermite (Fritsch–Carlson): C1, so speed is continuous across every
 * waypoint; strictly positive, so the flight never stops; and free of
 * overshoot, so the camera never doubles back. The lens rides the same
 * interpolant, so FOV moves in phase with the camera instead of easing to a
 * stop at each waypoint as the old per-segment `easeInOutSine` did.
 *
 * `createFlightPacing` builds both channels and the lens together so
 * `CameraRig` and `scripts/verify-pacing.mjs` read identical numbers.
 */

import * as THREE from "three";

/** Waypoint fields pacing needs — structurally satisfied by `Waypoint`. */
export type PacingWaypoint = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  t: number;
};

export type FlightPacing = {
  /** Camera position at normalised journey `t`, written into `out`. */
  positionAt: (t: number, out: THREE.Vector3) => void;
  /** Look-at target at normalised journey `t`, written into `out`. */
  targetAt: (t: number, out: THREE.Vector3) => void;
  /** Vertical field of view at normalised journey `t`. */
  fovAt: (t: number) => number;
};

/**
 * Arc-length table resolution, in divisions per waypoint segment. Each
 * waypoint must sit exactly on a table entry (the curve's segment count is
 * `waypoints.length - 1`), so a waypoint index maps to `i * this` with no
 * interpolation between entries.
 */
const ARC_SAMPLES_PER_SEGMENT = 256;

/**
 * Build the flight's position, look-at and lens interpolation from the
 * authored waypoints. Curves, arc-length tables and interpolants are
 * constructed once; the returned closures are allocation-free per call.
 */
export function createFlightPacing(waypoints: readonly PacingWaypoint[]): FlightPacing {
  const count = waypoints.length;
  if (count < 2) throw new Error("createFlightPacing: need at least two waypoints");

  const ts = waypoints.map((waypoint) => waypoint.t);

  const positionCurve = new THREE.CatmullRomCurve3(
    waypoints.map((waypoint) => new THREE.Vector3(...waypoint.position)),
    false,
    "centripetal",
    0.5,
  );
  const targetCurve = new THREE.CatmullRomCurve3(
    waypoints.map((waypoint) => new THREE.Vector3(...waypoint.target)),
    false,
    "centripetal",
    0.5,
  );

  // Built before any `getPointAt`: the table warmed here is the one the
  // per-frame arc-length lookup reads, so sampling and pacing share it.
  const divisions = (count - 1) * ARC_SAMPLES_PER_SEGMENT;
  positionCurve.arcLengthDivisions = divisions;
  targetCurve.arcLengthDivisions = divisions;
  const positionLengths = positionCurve.getLengths();
  const targetLengths = targetCurve.getLengths();

  const positionProgress = makeMonotoneInterpolant(
    ts,
    waypoints.map((_, i) => positionLengths[i * ARC_SAMPLES_PER_SEGMENT] / positionLengths[divisions]),
  );
  const targetProgress = makeMonotoneInterpolant(
    ts,
    waypoints.map((_, i) => targetLengths[i * ARC_SAMPLES_PER_SEGMENT] / targetLengths[divisions]),
  );
  const fovInterpolant = makeMonotoneInterpolant(
    ts,
    waypoints.map((waypoint) => waypoint.fov),
  );

  return {
    positionAt(t, out) {
      positionCurve.getPointAt(positionProgress(t), out);
    },
    targetAt(t, out) {
      targetCurve.getPointAt(targetProgress(t), out);
    },
    fovAt(t) {
      return fovInterpolant(t);
    },
  };
}

/**
 * Monotone cubic Hermite interpolation (Fritsch–Carlson).
 *
 * Passes exactly through every `(x, y)` stop, so anchors are exact. Is C1 —
 * the derivative is continuous across stops, which is what removes the speed
 * jerk at waypoints. Monotone data stays monotone with no overshoot; turning
 * points in non-monotone data (the FOV stops) get a zero derivative, so the
 * lens eases into an extreme instead of cutting through it.
 */
export function makeMonotoneInterpolant(
  xs: readonly number[],
  ys: readonly number[],
): (x: number) => number {
  const n = xs.length;
  if (n !== ys.length || n < 2) {
    throw new Error("makeMonotoneInterpolant: need matching stops, at least two");
  }

  const spans: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    spans[i] = xs[i + 1] - xs[i];
    slopes[i] = (ys[i + 1] - ys[i]) / spans[i];
  }

  const tangents: number[] = new Array(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      const before = spans[i - 1];
      const after = spans[i];
      tangents[i] = (slopes[i - 1] * after + slopes[i] * before) / (before + after);
    }
  }

  // Fritsch–Carlson limiter: scale any tangent whose derivative ellipse
  // escapes the unit circle that guarantees monotonicity. Turning points are
  // already flat and skipped (also avoiding division by a zero slope).
  for (let i = 0; i < n; i += 1) {
    const before = i > 0 ? slopes[i - 1] : slopes[0];
    const after = i < n - 1 ? slopes[i] : slopes[n - 2];
    if (before * after <= 0) continue;
    const alpha = tangents[i] / before;
    const beta = tangents[i] / after;
    const extent = Math.hypot(alpha, beta);
    if (extent > 3) tangents[i] *= 3 / extent;
  }

  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];

    let i = 0;
    while (x > xs[i + 1]) i += 1;

    const span = spans[i];
    const s = (x - xs[i]) / span;
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * ys[i] +
      (s3 - 2 * s2 + s) * span * tangents[i] +
      (-2 * s3 + 3 * s2) * ys[i + 1] +
      (s3 - s2) * span * tangents[i + 1]
    );
  };
}

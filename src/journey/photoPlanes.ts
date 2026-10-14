export type AnchorLike = {
  id?: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  t: number;
};

export const ASPECT = 16 / 9;
export const FIT_EPSILON = 1.03;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function smoothstep(a: number, b: number, t: number): number {
  if (b <= a) return t <= a ? 0 : 1;
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function planeHeight(distance: number, fovDeg: number): number {
  const d = Math.max(0, distance);
  return 2 * d * Math.tan(toRad(fovDeg) / 2) * FIT_EPSILON;
}

export function planeWidth(distance: number, fovDeg: number): number {
  return planeHeight(distance, fovDeg) * ASPECT;
}

export function crossfadeWindow(a: number, b: number): [number, number] {
  return [a + 0.4 * (b - a), b - 0.4 * (b - a)];
}

export function weightsInto(
  t: number,
  anchorTs: readonly number[],
  out: number[],
): number[] {
  const len = anchorTs.length;
  for (let i = 0; i < len; i += 1) out[i] = 0;
  if (len === 0) return out;
  if (len === 1) {
    out[0] = 1;
    return out;
  }
  if (t <= anchorTs[0]) {
    out[0] = 1;
    return out;
  }
  if (t >= anchorTs[len - 1]) {
    out[len - 1] = 1;
    return out;
  }
  for (let i = 0; i < len - 1; i += 1) {
    const a = anchorTs[i];
    const b = anchorTs[i + 1];
    if (t >= a && t <= b) {
      const [wStart, wEnd] = crossfadeWindow(a, b);
      if (t <= wStart) {
        out[i] = 1;
        out[i + 1] = 0;
      } else if (t >= wEnd) {
        out[i] = 0;
        out[i + 1] = 1;
      } else {
        const s = smoothstep(wStart, wEnd, t);
        out[i] = 1 - s;
        out[i + 1] = s;
      }
      let sum = 0;
      for (let k = 0; k < len; k += 1) sum += out[k];
      if (sum < 0.999) {
        const delta = 0.999 - sum;
        let bestIdx = 0;
        let bestVal = out[0];
        for (let k = 1; k < len; k += 1) {
          if (out[k] > bestVal) {
            bestVal = out[k];
            bestIdx = k;
          }
        }
        out[bestIdx] += delta;
      }
      return out;
    }
  }
  let best = 0;
  let bestVal = -1;
  for (let i = 0; i < len; i += 1) {
    const d = Math.abs(t - anchorTs[i]);
    if (d < bestVal || bestVal < 0) {
      bestVal = d;
      best = i;
    }
  }
  out[best] = 1;
  return out;
}

export function beatWeights(t: number, anchorTs: readonly number[]): number[] {
  const out = new Array(anchorTs.length).fill(0);
  return weightsInto(t, anchorTs, out);
}

export function activeBeat(t: number, anchorTs: readonly number[]): number {
  if (anchorTs.length === 0) return -1;
  if (anchorTs.length === 1) return 0;
  if (t <= anchorTs[0]) return 0;
  if (t >= anchorTs[anchorTs.length - 1]) return anchorTs.length - 1;
  for (let i = 0; i < anchorTs.length - 1; i += 1) {
    const a = anchorTs[i];
    const b = anchorTs[i + 1];
    if (t >= a && t <= b) {
      const [wStart, wEnd] = crossfadeWindow(a, b);
      if (t < wStart) return i;
      if (t > wEnd) return i + 1;
      const s = smoothstep(wStart, wEnd, t);
      return s >= 0.5 ? i + 1 : i;
    }
  }
  let best = 0;
  let bestVal = Math.abs(t - anchorTs[0]);
  for (let i = 1; i < anchorTs.length; i += 1) {
    const d = Math.abs(t - anchorTs[i]);
    if (d < bestVal) {
      bestVal = d;
      best = i;
    }
  }
  return best;
}

export function planePose(
  anchors: readonly AnchorLike[],
  beatIndex: number,
  depth: number,
): {
  position: [number, number, number];
  height: number;
  width: number;
} {
  const anchor = anchors[beatIndex];
  const pos = anchor.position;
  const tgt = anchor.target;
  const dx = tgt[0] - pos[0];
  const dy = tgt[1] - pos[1];
  const dz = tgt[2] - pos[2];
  const len = Math.hypot(dx, dy, dz);
  const dirx = len > 0 ? dx / len : 0;
  const diry = len > 0 ? dy / len : 0;
  const dirz = len > 0 ? dz / len : -1;
  const d = Math.max(0, depth);
  const position: [number, number, number] = [
    pos[0] + dirx * d,
    pos[1] + diry * d,
    pos[2] + dirz * d,
  ];
  const height = planeHeight(d, anchor.fov);
  const width = planeWidth(d, anchor.fov);
  return { position, height, width };
}

export function planeOpacity(weight: number, distanceToCamera: number): number {
  if (weight <= 0.002) return 0;
  const dist = Math.max(0, distanceToCamera);
  const v = smoothstep(2, 6, dist);
  return weight * v;
}

export function kenBurnsScale(weight: number, reduced: boolean): number {
  if (reduced) return 1;
  const w = clamp(weight, 0, 1);
  return 1 + 0.04 * smoothstep(0, 1, w);
}

/**
 * Journey waypoints.
 *
 * The camera path is authored as data, not as imperative motion. Each waypoint
 * is a real place in the scene; `CameraRig` fits a curve through them so a
 * single normalised scroll value drives the entire flight.
 *
 * Positions are in world units where 1 unit ≈ 1 metre, with the site centred
 * on the origin and +Y up. The complex occupies roughly 90m × 60m.
 */

export type Waypoint = {
  id: string;
  /** World-space camera position. */
  position: [number, number, number];
  /** World-space look-at target — decoupled from position for a camera-operator feel. */
  target: [number, number, number];
  /**
   * Vertical field of view in degrees. Wide for establishing aerial work,
   * long-lens for interiors so the space compresses rather than distorts.
   */
  fov: number;
  /** Normalised position along the journey, 0 → 1. */
  t: number;
  label: string;
};

/**
 * Thirteen waypoints per the camera architecture. `t` values are deliberately
 * uneven: the aerial establishing shots get more scroll distance than the
 * threshold, which is a moment the camera should pass through quickly. The
 * journey ends on `night` — the towers illuminated.
 */
export const WAYPOINTS: Waypoint[] = [
  {
    id: "arrival",
    position: [-115, 60, 130],
    target: [0, 37, 0],
    fov: 40,
    t: 0,
    label: "Far aerial — arrival drift",
  },
  {
    id: "towers",
    position: [-64, 46, 80],
    target: [-6, 38, 4],
    fov: 44,
    t: 0.10,
    label: "The towers, day exterior",
  },
  {
    id: "development",
    position: [-48, 30, 70],
    target: [-4, 30, 2],
    fov: 46,
    t: 0.18,
    label: "All three towers",
  },
  {
    id: "threshold",
    position: [-34, 12, 62],
    target: [-4, 15, 6],
    fov: 52,
    t: 0.30,
    label: "Threshold at street level",
  },
  {
    id: "lobby",
    position: [10, 6, 20],
    target: [4, 6, -6],
    fov: 38,
    t: 0.42,
    label: "Lobby — wide",
  },
  {
    id: "lobby-detail",
    position: [14, 5, 6],
    target: [6, 7, -14],
    fov: 34,
    t: 0.48,
    label: "Lobby — sculptural stair",
  },
  {
    id: "residence",
    position: [26, 5, -4],
    target: [12, 4, -22],
    fov: 34,
    t: 0.56,
    label: "Residence interior",
  },
  {
    id: "living",
    position: [30, 5, -14],
    target: [16, 4, -34],
    fov: 36,
    t: 0.62,
    label: "Living room, second angle",
  },
  {
    id: "view",
    position: [30, 4, -30],
    target: [4, 6, -84],
    fov: 48,
    t: 0.70,
    label: "Balcony — city reveal",
  },
  {
    id: "rooftop-rise",
    position: [18, 58, 40],
    target: [2, 50, -8],
    fov: 46,
    t: 0.78,
    label: "Rising over the roof",
  },
  {
    id: "rooftop-pool",
    position: [6, 74, 26],
    target: [0, 64, -6],
    fov: 50,
    t: 0.85,
    label: "Rooftop pool — skyline",
  },
  {
    id: "night-facade",
    position: [-40, 34, 74],
    target: [-2, 34, 4],
    fov: 44,
    t: 0.93,
    label: "Night facade, fins lit",
  },
  {
    id: "night",
    position: [-96, 58, 118],
    target: [0, 40, 0],
    fov: 42,
    t: 1.00,
    label: "Night — towers illuminated",
  },
];

/**
 * Map an authored `t` onto the curve's own parameter.
 *
 * `THREE.CatmullRomCurve3.getPoint(u)` treats `u` as a fraction of the *waypoint
 * sequence* — 0.5 is the midpoint between points 4 and 5. `getPointAt(u)` instead
 * re-parameterises by arc length, so 0.5 is the point 394 units along a 788-unit
 * path. Those are different numbers, and they only coincide when every segment
 * happens to be the same length.
 *
 * `WAYPOINTS[].t` is authored as the waypoint sequence, with deliberately uneven
 * spacing: the aerial establishing shots get more scroll than the threshold,
 * which the camera should pass through quickly. Sampling with `getPointAt`
 * therefore does not just shift the camera — it throws the authored weights away.
 * Measured drift before this existed: the camera stood 136.8 units from the
 * authored balcony waypoint and 154.0 units from the rooftop, 20.4% of the
 * journey. That is invisible on an exterior fly-past and fatal the moment a shot
 * has to be composed against a specific building.
 *
 * This remap is the whole fix: preserve the authored weights, sample by parameter.
 */
export function authoredToU(t: number): number {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  const last = WAYPOINTS.length - 1;

  for (let i = 0; i < last; i += 1) {
    const a = WAYPOINTS[i].t;
    const b = WAYPOINTS[i + 1].t;
    if (clamped >= a && clamped <= b) {
      const local = b === a ? 0 : (clamped - a) / (b - a);
      return (i + local) / last;
    }
  }

  return 1;
}

/** The whole flight is driven by the single hero section. */
export const JOURNEY_START_ID = "hero";
export const JOURNEY_END_ID = "hero";

/** Tallest tower height, in storeys — shared by geometry and camera framing. */
export const TOWER_STOREYS = 22;
export const STOREY_HEIGHT = 3.6;
export const TOWER_HEIGHT = TOWER_STOREYS * STOREY_HEIGHT;

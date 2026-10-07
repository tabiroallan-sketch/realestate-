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
 * Nine waypoints per the camera architecture. `t` values are deliberately
 * uneven: the aerial establishing shots get more scroll distance than the
 * threshold, which is a moment the camera should pass through quickly.
 */
export const WAYPOINTS: Waypoint[] = [
  {
    id: "aerial",
    position: [-115, 60, 130],
    target: [0, 37, 0],
    fov: 40,
    t: 0,
    label: "Far aerial — establishing scale",
  },
  {
    id: "approach",
    position: [-64, 46, 80],
    target: [-6, 38, 4],
    fov: 44,
    t: 0.14,
    label: "Approaching the development",
  },
  {
    id: "entrance",
    position: [-34, 12, 62],
    target: [-4, 15, 6],
    fov: 52,
    t: 0.3,
    label: "Entrance at ground level",
  },
  {
    id: "lobby",
    position: [10, 6, 20],
    target: [4, 6, -6],
    fov: 38,
    t: 0.44,
    label: "Lobby — architectural framing",
  },
  {
    id: "apartment",
    position: [26, 5, -4],
    target: [12, 4, -22],
    fov: 34,
    t: 0.58,
    label: "Apartment — depth layering",
  },
  {
    id: "balcony",
    position: [30, 4, -30],
    target: [4, 6, -84],
    fov: 48,
    t: 0.7,
    label: "Balcony — city reveal",
  },
  {
    id: "rooftop",
    position: [6, 74, 26],
    target: [0, 64, -6],
    fov: 50,
    t: 0.82,
    label: "Rooftop — vertical rise",
  },
  {
    id: "night",
    position: [-96, 58, 118],
    target: [0, 40, 0],
    fov: 42,
    t: 0.91,
    label: "Night exterior, illuminated",
  },
  {
    id: "masterplan",
    position: [-168, 176, 196],
    target: [0, 30, 0],
    fov: 48,
    t: 1,
    label: "Masterplan — pull back to the site",
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

/** Which chapters drive the canvas. The canvas spans 01 → 08. */
export const JOURNEY_START_ID = "hero";
export const JOURNEY_END_ID = "day-night";

/** Waypoint each chapter settles on, used by reduced-motion snapping. */
export const CHAPTER_WAYPOINT: Record<string, string> = {
  hero: "aerial",
  development: "approach",
  lobby: "entrance",
  residence: "apartment",
  balcony: "balcony",
  rooftop: "rooftop",
  "day-night": "night",
  architecture: "masterplan",
};

/** Tallest tower height, in storeys — shared by geometry and camera framing. */
export const TOWER_STOREYS = 22;
export const STOREY_HEIGHT = 3.6;
export const TOWER_HEIGHT = TOWER_STOREYS * STOREY_HEIGHT;

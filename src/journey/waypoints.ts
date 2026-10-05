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
    position: [-210, 132, 232],
    target: [0, 46, 0],
    fov: 46,
    t: 0,
    label: "Far aerial — establishing scale",
  },
  {
    id: "approach",
    position: [-128, 84, 158],
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

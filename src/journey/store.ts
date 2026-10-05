/**
 * The journey store.
 *
 * A single mutable object shared by the whole journey, deliberately outside
 * React. Scroll progress and pointer position are written on every scroll tick
 * and read inside the render loop; routing either through state or through refs
 * threaded as props would mean either 60 re-renders a second or a graph of ref
 * plumbing that the React Compiler lint rules reject outright.
 *
 * There is exactly one journey per document — the canvas is a singleton WebGL
 * context — so a module-level store has no teardown concerns and no cross-request
 * leakage: it is only ever read inside `useFrame`, which never runs on the
 * server.
 */

export type JourneyProgress = {
  /** Normalised scroll position across the journey span, 0 → 1. */
  value: number;
  /** Chapter id currently in control of the canvas. */
  chapter: string;
  /** True while the canvas is inside its scroll span. */
  active: boolean;
};

export type Parallax = {
  /** Damped pointer position in normalised device coords, roughly -1 → 1. */
  x: number;
  y: number;
};

export const journey: {
  progress: JourneyProgress;
  parallax: Parallax;
} = {
  progress: { value: 0, chapter: "hero", active: true },
  parallax: { x: 0, y: 0 },
};

/** Resets to the opening state. Used when the journey unmounts. */
export function resetJourney() {
  journey.progress.value = 0;
  journey.progress.chapter = "hero";
  journey.progress.active = true;
  journey.parallax.x = 0;
  journey.parallax.y = 0;
}

/* -------------------------------------------------------------------------- *
 * Canvas readiness
 *
 * The photograph in the hero cross-fades out once WebGL has actually drawn a
 * frame. This one flag crosses a component boundary that React does not own —
 * the canvas lives in a fixed-position layer, the hero in normal flow — so it is
 * published through a tiny external store rather than threaded as a prop through
 * `main`.
 * -------------------------------------------------------------------------- */

type ReadySnapshot = { ready: boolean };

let readySnapshot: ReadySnapshot = { ready: false };
const readyListeners = new Set<() => void>();

export function markCanvasReady() {
  if (readySnapshot.ready) return;
  readySnapshot = { ready: true };
  for (const listener of readyListeners) listener();
}

export function subscribeCanvasReady(listener: () => void) {
  readyListeners.add(listener);
  return () => {
    readyListeners.delete(listener);
  };
}

export function canvasReadySnapshot(): ReadySnapshot {
  return readySnapshot;
}

/** False on the server, so markup agrees before hydration. */
export function canvasReadyServerSnapshot(): ReadySnapshot {
  return NOT_READY;
}

const NOT_READY: ReadySnapshot = { ready: false };
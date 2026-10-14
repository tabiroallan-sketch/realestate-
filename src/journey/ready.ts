/**
 * Plane-readiness seam.
 *
 * The flight is a run of photo planes whose textures arrive over the network.
 * Exterior tooling (the journey probe, the reference capture) needs to know when
 * the whole set is decoded before it fingerprints a frame — otherwise it
 * measures a half-loaded flight and reads flat fills.
 *
 * A module-level counter rather than React state: the writes happen from
 * asynchronous texture callbacks, never during render, and nothing in the UI
 * reacts to the value. The only observer is the browser automation seam.
 */

let expected = 0;
let loaded = 0;
let published = false;

/**
 * Arms the counter for one journey. Called once per scene mount, before any
 * texture callback can land.
 */
export function initPlaneReady(count: number) {
  expected = count;
  loaded = 0;
  published = false;
}

/** Marks one plane's texture decoded. Publishes the flag once all have landed. */
export function markPlaneReady() {
  loaded += 1;
  if (published || expected <= 0 || loaded < expected) return;
  published = true;

  if (typeof window !== "undefined") {
    Object.defineProperty(window, "__verdePlanesReady", {
      value: true,
      configurable: true,
    });
  }
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { easeInOutSine } from "@/animations/easing";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { enableJourneyProbe, journeyProbe } from "@/journey/probe";
import { journey } from "@/journey/store";
import { authoredToU, WAYPOINTS, type Waypoint } from "@/journey/waypoints";

/**
 * The single owner of camera state.
 *
 * Nothing else in the scene may touch the camera. Scroll progress selects a
 * point on two independent curves — one for position, one for look-at — and
 * `useFrame` eases the real camera toward that state. The damping here is what
 * produces the inertial follow; ScrollTrigger only ever writes a number, so
 * scrubbed scrolling never snaps the camera.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const reduced = useReducedMotion();

  // Position and target are separate curves. Sharing one curve makes the camera
  // stare straight down its own path; decoupling produces the operator feel.
  const { positionCurve, targetCurve, fovStops } = useMemo(() => {
    const points = WAYPOINTS.map((w) => new THREE.Vector3(...w.position));
    const looks = WAYPOINTS.map((w) => new THREE.Vector3(...w.target));

    return {
      positionCurve: new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5),
      targetCurve: new THREE.CatmullRomCurve3(looks, false, "centripetal", 0.5),
      fovStops: WAYPOINTS.map((w) => ({ t: w.t, fov: w.fov })),
    };
  }, []);

  // Scratch vectors — allocating per frame in useFrame triggers GC churn that
  // shows up as stutter during scroll.
  const scratch = useRef({
    desiredPosition: new THREE.Vector3(),
    desiredTarget: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    pointerOffset: new THREE.Vector3(),
    waypointPosition: new THREE.Vector3(),
    waypointTarget: new THREE.Vector3(),
  });

  // The camera is a mutable engine object. Everything below writes through this
  // ref inside the frame loop, which is the only sanctioned way to move a
  // Three.js object that React handed us: no mutation happens during render or
  // in an effect, so the compiler sees an opaque value it never has to reason
  // about.
  const cameraRef = useRef(camera);

  useEffect(() => {
    enableJourneyProbe();
  }, []);

  /**
   * Map curve parameter t to a field of view by interpolating between the
   * nearest waypoint stops. Sampling the curve directly cannot express this:
   * FOV is per-waypoint intent, not a function of arc length.
   */
  const fovAt = (t: number): number => {
    const stops = fovStops;
    for (let i = 0; i < stops.length - 1; i += 1) {
      const a = stops[i];
      const b = stops[i + 1];
      if (t >= a.t && t <= b.t) {
        const local = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
        return THREE.MathUtils.lerp(a.fov, b.fov, easeInOutSine(local));
      }
    }
    return stops[stops.length - 1].fov;
  };

  useFrame((_, delta) => {
    const view = cameraRef.current as THREE.PerspectiveCamera;
    const target = scratch.current;
    const t = THREE.MathUtils.clamp(journey.progress.value, 0, 1);

    if (reduced) {
      // Collapse the flight: hold the nearest waypoint instead of sweeping the
      // full 400m path. The DOM content carries the narrative.
      const nearest = nearestWaypoint(t);
      target.waypointPosition.set(...nearest.position);
      target.waypointTarget.set(...nearest.target);

      view.position.copy(target.waypointPosition);
      view.lookAt(target.waypointTarget);
      applyFov(view, nearest.fov);
      return;
    }

    // `getPoint`, not `getPointAt`. `getPointAt` re-parameterises by arc length,
    // which makes t mean "fraction of path distance" and silently discards the
    // authored `t` weights in WAYPOINTS. `authoredToU` maps the authored value
    // onto the curve's own parameter so t means "fraction of the waypoint
    // sequence", which is what the data says it means.
    const u = authoredToU(t);
    positionCurve.getPoint(u, target.desiredPosition);
    targetCurve.getPoint(u, target.desiredTarget);

    // Pointer parallax is a small offset perpendicular to the view direction,
    // not a translation along world axes — otherwise it swings the frame
    // sideways when the camera faces along X.
    const pointer = journey.parallax;
    const distance = target.desiredPosition.distanceTo(target.desiredTarget);
    const offsetAmount = Math.min(3.4, distance * 0.06);
    target.pointerOffset
      .set(pointer.x * offsetAmount, pointer.y * offsetAmount * 0.6, 0)
      .applyQuaternion(view.quaternion);
    target.desiredPosition.add(target.pointerOffset);

    // Frame-rate independent damping. Without the delta correction the camera
    // lags further on high-refresh displays and on struggling devices.
    const damping = 1 - Math.exp(-3.2 * Math.min(delta, 0.1));
    view.position.lerp(target.desiredPosition, damping);

    target.lookAt.lerp(target.desiredTarget, damping);
    view.lookAt(target.lookAt);

    applyFov(view, fovAt(t));

    // Reported after damping, so the probe measures where the camera actually
    // settled rather than where it was asked to go.
    if (journeyProbe.enabled) {
      journeyProbe.frame += 1;
      journeyProbe.t = t;
      journeyProbe.desired.x = target.desiredPosition.x;
      journeyProbe.desired.y = target.desiredPosition.y;
      journeyProbe.desired.z = target.desiredPosition.z;
      journeyProbe.target.x = target.desiredTarget.x;
      journeyProbe.target.y = target.desiredTarget.y;
      journeyProbe.target.z = target.desiredTarget.z;
      journeyProbe.camera.x = view.position.x;
      journeyProbe.camera.y = view.position.y;
      journeyProbe.camera.z = view.position.z;
    }
  });

  return null;
}

function applyFov(camera: THREE.PerspectiveCamera, fov: number) {
  if (Math.abs(camera.fov - fov) < 0.01) return;
  camera.fov = fov;
  camera.updateProjectionMatrix();
}

function nearestWaypoint(t: number): Waypoint {
  let best = WAYPOINTS[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const waypoint of WAYPOINTS) {
    const distance = Math.abs(waypoint.t - t);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = waypoint;
    }
  }

  return best;
}
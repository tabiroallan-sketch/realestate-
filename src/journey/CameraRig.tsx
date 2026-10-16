"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { createFlightPacing } from "@/journey/pacing";
import { enableJourneyProbe, journeyProbe } from "@/journey/probe";
import { journey } from "@/journey/store";
import { WAYPOINTS, type Waypoint } from "@/journey/waypoints";

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
  // `createFlightPacing` owns both curves plus the lens curve, so the frame
  // loop and the pacing gate read identical numbers.
  const pacing = useMemo(() => createFlightPacing(WAYPOINTS), []);

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

    // Pacing maps authored `t` onto normalised arc length with a C1 monotone
    // interpolant: distance is covered at continuous speed, so there is no jerk
    // where the camera passes a waypoint, while the authored `t` weights are
    // preserved and every waypoint is met exactly. Sampling a raw `getPointAt`
    // would throw those weights away — see pacing.ts.
    pacing.positionAt(t, target.desiredPosition);
    pacing.targetAt(t, target.desiredTarget);

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

    applyFov(view, pacing.fovAt(t));

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
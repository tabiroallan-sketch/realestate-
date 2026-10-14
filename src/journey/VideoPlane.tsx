"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  activeBeat,
  kenBurnsScale,
  planeOpacity,
  planePose,
  weightsInto,
} from "@/journey/photoPlanes";
import { journeyProbe } from "@/journey/probe";
import { markPlaneReady } from "@/journey/ready";
import { journey } from "@/journey/store";
import { WAYPOINTS } from "@/journey/waypoints";

/** Authored beat parameters, read every frame — hoisted out of the render. */
const anchorTs = WAYPOINTS.map((waypoint) => waypoint.t);

let feather: THREE.CanvasTexture | null = null;

/** The soft-edge mask shared by the video plane — see PhotoPlane. */
function featherTexture(): THREE.CanvasTexture {
  if (feather) return feather;

  const size = 128;
  const inset = size * 0.06;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (context) {
    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = Math.min(x, size - 1 - x);
        const dy = Math.min(y, size - 1 - y);
        const ramp = Math.max(0, Math.min(1, Math.min(dx, dy) / inset));
        const value = Math.round(255 * ramp);
        const index = (y * size + x) * 4;
        image.data[index] = value;
        image.data[index + 1] = value;
        image.data[index + 2] = value;
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }

  feather = new THREE.CanvasTexture(canvas);
  return feather;
}

type VideoPlaneProps = {
  src: string;
  poster: string;
  beatIndex: number;
  depth: number;
};

/**
 * The arrival beat: a looping aerial clip over its poster.
 *
 * The poster is the honest first frame — it carries the whole beat until the
 * clip has a decodable frame *and* playback is actually running. If it never
 * starts (codec, autoplay policy, reduced motion) the poster simply stays, and
 * if the poster itself fails the beat drops like any other plane.
 */
export function VideoPlane({ src, poster, beatIndex, depth }: VideoPlaneProps) {
  const reduced = useReducedMotion();

  const pose = useMemo(() => planePose(WAYPOINTS, beatIndex, depth), [beatIndex, depth]);

  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const swapped = useRef(false);
  const weights = useRef(new Array(anchorTs.length).fill(0));

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      poster,
      (texture) => {
        // The poster and the live clip race. Whichever lands second must not
        // clobber the first — but every outcome still counts the plane ready.
        if (!active || swapped.current) {
          texture.dispose();
          if (active) markPlaneReady();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = materialRef.current;
        if (material) {
          material.map = texture;
          material.needsUpdate = true;
        }
        markPlaneReady();
      },
      undefined,
      () => {
        if (active) markPlaneReady();
      },
    );

    return () => {
      active = false;
    };
  }, [poster]);

  useEffect(() => {
    swapped.current = false;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.preload = "auto";
    video.src = src;
    videoRef.current = video;

    if (journeyProbe.enabled) {
      Object.defineProperty(window, "__journeyVideo", {
        value: video,
        configurable: true,
      });
    }

    let cancelled = false;

    // Swap to the live texture only once a frame is decodable *and* playback is
    // actually under way. Reduced motion keeps the poster forever.
    const trySwap = () => {
      if (cancelled || reduced || video.readyState < 2) return;

      const swap = () => {
        if (cancelled) return;
        swapped.current = true;
        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = materialRef.current;
        if (material) {
          material.map = texture;
          material.needsUpdate = true;
        }
      };

      const started = video.play();
      if (started && typeof started.then === "function") {
        started.then(swap).catch(() => {});
      } else {
        swap();
      }
    };

    video.addEventListener("loadeddata", trySwap);
    video.addEventListener("canplay", trySwap);
    video.load();
    trySwap();

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", trySwap);
      video.removeEventListener("canplay", trySwap);
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoRef.current = null;
    };
  }, [reduced, src]);

  useFrame((state) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    const t = Math.max(0, Math.min(1, journey.progress.value));

    let weight: number;
    if (reduced) {
      weight = activeBeat(t, anchorTs) === beatIndex ? 1 : 0;
    } else {
      weight = weightsInto(t, anchorTs, weights.current)[beatIndex];
    }

    const opacity = planeOpacity(weight, state.camera.position.distanceTo(mesh.position));
    mesh.visible = material.map !== null && opacity > 0;
    if (!mesh.visible) return;

    material.opacity = opacity;
    mesh.scale.setScalar(kenBurnsScale(weight, reduced));
  });

  return (
    <mesh ref={meshRef} position={pose.position} visible={false} frustumCulled={false}>
      <planeGeometry args={[pose.width, pose.height]} />
      <meshBasicMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        toneMapped={false}
        alphaMap={featherTexture()}
        opacity={0}
      />
    </mesh>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type CursorState = "default" | "view" | "explore" | "drag" | "link";

const LABELS: Record<CursorState, string> = {
  default: "",
  view: "View",
  explore: "Explore",
  drag: "Drag",
  link: "Open",
};

const RING_SIZE: Record<CursorState, number> = {
  default: 32,
  view: 68,
  explore: 82,
  drag: 52,
  link: 52,
};

/**
 * Desktop cursor follower.
 *
 * The native OS cursor is deliberately left visible — replacing it would make
 * the interface harder to use, which the brief explicitly forbids. This is an
 * *augmentation*: a trailing ring that responds to elements carrying a
 * `data-cursor` attribute. Fully unmounted on touch devices and under
 * `prefers-reduced-motion`.
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<CursorState>("default");
  const [active, setActive] = useState(false);

  const isTouch = useMediaQuery("(hover: none) and (pointer: coarse)");
  const reduced = useReducedMotion();

  useEffect(() => {
    if (isTouch || reduced) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!ring || !dot || !label) return;

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let dotX = ringX;
    let dotY = ringY;
    let frame = 0;
    let shown = false;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      dotX = event.clientX;
      dotY = event.clientY;

      if (!shown) {
        shown = true;
        ringX = dotX;
        ringY = dotY;
        setActive(true);
      }

      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    };

    const tick = () => {
      frame = 0;
      // Ring lags the dot — that gap is what reads as weight.
      ringX += (dotX - ringX) * 0.16;
      ringY += (dotY - ringY) * 0.16;

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
    };

    const onOver = (event: Event) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-cursor], a, button, [role='button']",
      );
      if (!target) return;

      const declared = target.dataset.cursor as CursorState | undefined;
      const next: CursorState = declared ?? "link";
      if (next === stateRef.current) return;

      stateRef.current = next;
      const size = RING_SIZE[next];

      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.dataset.state = next;
      label.textContent = LABELS[next];
      label.style.opacity = next === "default" ? "0" : "1";
    };

    const onLeave = () => {
      shown = false;
      setActive(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [isTouch, reduced]);

  if (isTouch || reduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-100 hidden lg:block"
      data-visible={active}
    >
      <div
        ref={ringRef}
        data-state="default"
        className="fixed top-0 left-0 flex items-center justify-center border border-bronze/60 opacity-0 transition-[width,height,opacity,background-color] duration-[var(--duration-ui)] ease-[var(--ease-out-expo)] data-[visible=true]:opacity-100 data-[state=view]:h-[68px] data-[state=explore]:h-[82px] data-[state=link]:h-[52px] data-[state=drag]:h-[52px]"
        style={{ width: 32, height: 32 }}
      >
        <span
          ref={labelRef}
          className="font-sans text-[0.5rem] font-medium tracking-[0.18em] text-ivory uppercase opacity-0 transition-opacity duration-[var(--duration-ui)]"
        />
      </div>

      <div
        ref={dotRef}
        className="fixed top-0 left-0 h-1 w-1 bg-ivory opacity-0 transition-opacity duration-[var(--duration-ui)]"
      />
    </div>
  );
}
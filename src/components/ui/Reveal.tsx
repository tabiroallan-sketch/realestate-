"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, registerGsap } from "@/animations/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

registerGsap();

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Travel distance in px. Keep small so it reads as a fade, not a slide. */
  y?: number;
  delay?: number;
  /** Fraction of the viewport the element must cross before revealing. */
  start?: string;
  as?: "div" | "span" | "li" | "section";
  index?: number;
};

/**
 * Scroll-triggered entrance reveal.
 *
 * Deliberately contains **no hidden state in CSS** — the from-state is applied
 * by GSAP at runtime. If the bundle never executes, content stays visible and
 * fully crawlable. Under `prefers-reduced-motion` the animation is skipped
 * entirely and the final state renders immediately.
 */
export function Reveal({
  children,
  className,
  y = 16,
  delay = 0,
  start = "top 88%",
  as: Tag = "div",
  index = 0,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      gsap.from(ref.current, {
        opacity: 0,
        y,
        duration: 0.9,
        delay,
        ease: "expo.out",
        scrollTrigger: {
          trigger: ref.current,
          start,
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: ref, dependencies: [reduced, y, delay, start] },
  );

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={className}
      data-reveal={index}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggers direct children. Capped at 8 children — beyond that the last item
 * feels laggy and the DOM cost outweighs the effect.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  y = 20,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  as?: "div" | "ul" | "ol";
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const items = ref.current?.children;
      if (!items || items.length === 0) return;

      if (reduced) {
        // The hydration pass renders with the server snapshot (motion allowed),
        // so a from-tween may already have applied opacity-0. Undo it explicitly
        // rather than only skipping — otherwise these children stay invisible.
        gsap.set(items, { clearProps: "opacity,transform" });
        return;
      }

      gsap.from(items, {
        opacity: 0,
        y,
        duration: 0.6,
        stagger: Math.min(stagger, 0.1),
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
        },
      });
    },
    { scope: ref, dependencies: [reduced, stagger, y] },
  );

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className}>
      {children}
    </Tag>
  );
}

export { ScrollTrigger };
"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

import { ScrollTrigger, gsap, registerGsap } from "@/animations/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

registerGsap();

export type LenisHandle = Lenis | null;

/**
 * Premium smooth scrolling, synchronised with GSAP ScrollTrigger.
 *
 * - `autoRaf: false` — Lenis is driven from `gsap.ticker` so there is exactly
 *   one rAF loop on the page and no competing frames.
 * - `lagSmoothing(0)` prevents GSAP from time-warping after a long task, which
 *   otherwise makes scroll-linked camera motion stutter.
 * - Under `prefers-reduced-motion` Lenis is never constructed and the browser
 *   falls back to native scrolling.
 */
export function useLenis(enabled = true) {
  const lenisRef = useRef<LenisHandle>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!enabled || reduced) return;

    const lenis = new Lenis({
      duration: 1.4,
      lerp: 0.065,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      autoRaf: false,
    });

    lenisRef.current = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Anchor links must route through Lenis, otherwise the browser jumps and
    // desynchronises every ScrollTrigger on the page.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!anchor) return;

      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: 0 });
      history.replaceState(null, "", id);
    };

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled, reduced]);

  return lenisRef;
}
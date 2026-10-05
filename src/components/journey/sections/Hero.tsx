"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "@/animations/gsap";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import { assets } from "@/data/assets";
import { architecture, hero, site } from "@/data/site";
import { useCanvasReady } from "@/hooks/useCanvasReady";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

/**
 * Section 01 — Cinematic hero.
 *
 * Phase 1 ships the photographic layer plus the full typographic and CTA
 * treatment. The WebGL arrival flight is layered over this in Phase 2, so the
 * DOM composition here is the one that survives into the final build — the
 * canvas is additive, never a replacement for real content.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const canvasReady = useCanvasReady();
  const poster = assets.heroPoster;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      if (reduced) {
        // Skip the choreography but guarantee the final state, since the
        // hydration pass ran with the server snapshot (motion allowed).
        gsap.set(
          "[data-hero-eyebrow], [data-hero-line], [data-hero-meta], [data-hero-cta]",
          { clearProps: "opacity,transform" },
        );
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      tl.fromTo("[data-hero-eyebrow]", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7 }, 0.1)
        .fromTo(
          "[data-hero-line]",
          { yPercent: 115 },
          { yPercent: 0, duration: 1.2, stagger: 0.09 },
          0.2,
        )
        .fromTo("[data-hero-meta]", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, 0.7)
        .fromTo("[data-hero-cta]", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.85);

      // Slow counter-move on the photograph gives the static image real depth
      // until the WebGL layer arrives in Phase 2.
      gsap.to("[data-hero-media]", {
        yPercent: 12,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      id="hero"
      ref={rootRef}
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
    >
      {/* Photograph — the WebGL layer cross-fades over it. The image is never
          removed, only faded, so a device without WebGL keeps the full hero. */}
      <div
        data-hero-photo
        className={cn(
          "absolute inset-0 -z-10 overflow-hidden transition-opacity duration-1000",
          canvasReady && "pointer-events-none opacity-0",
        )}
      >
        <div data-hero-media className="h-full w-full will-change-transform">
          <ResponsivePicture
            source={poster}
            alt={poster.alt}
            width={poster.width}
            height={poster.height}
            blurDataURL={poster.blurDataURL}
            priority
            sizes="100vw"
            className="h-full w-full"
            style={{ aspectRatio: "auto" }}
          />
        </div>

        {/* Legibility scrim — measured against the photographic luminance, not
            applied as a decorative gradient. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-ink/45"
          style={{
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 38%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.92) 100%)",
          }}
        />
      </div>

      {/* Scrim for the WebGL layer, kept separate from the photograph so the
          headline keeps its contrast once the canvas takes over. The 3D sky is
          far brighter than the photograph, so it needs a heavier wash — the same
          gradient at a higher opacity, applied only when WebGL is live. */}
      <div
        data-hero-scrim
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10 bg-ink/70 transition-opacity duration-1000",
          canvasReady ? "opacity-100" : "opacity-0",
        )}
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.4) 62%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      <div className="shell flex flex-1 flex-col justify-between pb-10 pt-[calc(var(--nav-h)+2rem)] md:pb-14">
        {/* Developer label */}
        <p data-hero-meta className="caption text-ivory-faint">
          {site.developer}
        </p>

        {/* Headline block */}
        <div className="max-w-[16ch] md:max-w-none">
          <div data-hero-eyebrow>
            <Eyebrow className="mb-6 md:mb-8">{hero.eyebrow}</Eyebrow>
          </div>

          <h1 id="hero-heading" className="sr-only">
            {site.name} — {hero.headline} {site.location}
          </h1>

          <p aria-hidden="true" className="display-xl">
            {["Live Above", "The Ordinary."].map((line) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <span data-hero-line className="block will-change-transform">
                  {line}
                </span>
              </span>
            ))}
          </p>

          {/* Announced once, visible decoration suppressed above. */}
          <p className="visually-hidden">{hero.headline}</p>
        </div>

        {/* Supporting row */}
        <div className="mt-10 grid-12 items-end gap-y-8 md:mt-14">
          <p data-hero-meta className="body-copy col-span-4 md:col-span-3 lg:col-span-3">
            {architecture.towers} interconnected {architecture.storeys}-storey towers on Upper
            Hill Road — {architecture.residences} residences above the city.
          </p>

          <div data-hero-cta className="col-span-4 flex flex-wrap items-center gap-x-8 gap-y-4 md:col-span-3">
            <Button href={hero.primaryCta.href} variant="solid" size="lg" withArrow>
              {hero.primaryCta.label}
            </Button>
            <Button href={hero.secondaryCta.href} variant="link" size="lg">
              {hero.secondaryCta.label}
            </Button>
          </div>

          <div
            data-hero-cta
            className="col-span-4 hidden justify-self-end text-right md:col-span-6 lg:col-span-3 lg:block"
          >
            <p className="numeral text-ivory-faint">Completed {architecture.completion}</p>
            <p className="numeral mt-1 text-bronze-dim">{site.location}</p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-10 left-1/2 hidden -translate-x-1/2",
          "flex-col items-center gap-3 md:flex",
        )}
      >
        <span className="numeral text-ivory-faint">{hero.scrollHint}</span>
        <span className="relative h-12 w-px overflow-hidden bg-hairline">
          <span className="absolute inset-x-0 top-0 h-4 animate-[scrollHint_2.4s_ease-in-out_infinite] bg-bronze" />
        </span>
      </div>

      <style>{`
        @keyframes scrollHint {
          0% { transform: translateY(-100%); }
          60%,100% { transform: translateY(300%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[scrollHint_2\\.4s_ease-in-out_infinite\\] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
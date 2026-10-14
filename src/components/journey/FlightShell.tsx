"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";

import { gsap, registerGsap } from "@/animations/gsap";
import { FlightChapters } from "@/components/journey/FlightChapters";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import { BEATS } from "@/data/beats";
import { assets } from "@/data/assets";
import { architecture, hero, site } from "@/data/site";
import { useCanvasReady } from "@/hooks/useCanvasReady";
import { useMounted } from "@/hooks/useMounted";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { cn } from "@/lib/cn";

registerGsap();

export function FlightShell() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const canvasReady = useCanvasReady();
  const supported = useWebGLSupport();
  const mounted = useMounted();
  const stack = mounted && !supported;
  const poster = assets.heroPoster;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || stack) return;

      const content = root.querySelector<HTMLElement>("[data-hero-content]");
      if (content) {
        gsap.to(content, {
          opacity: 0,
          ease: "none",
          onUpdate: () => {
            content.style.pointerEvents =
              Number(gsap.getProperty(content, "opacity")) < 0.05 ? "none" : "";
          },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "15% top",
            scrub: 1,
          },
        });
      }

      if (reduced) {
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
        .fromTo(
          "[data-hero-cta]",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
          0.85,
        );

      gsap.to("[data-hero-media]", {
        yPercent: 12,
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    },
    { scope: rootRef, dependencies: [reduced, stack] },
  );

  const photoLayer = (
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

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/45"
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 38%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.92) 100%)",
        }}
      />
    </div>
  );

  const scrim = (
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
  );

  const overlay = (
    <div data-hero-content className="flex flex-1 flex-col">
      <div className="shell flex flex-1 flex-col justify-between pb-10 pt-[calc(var(--nav-h)+2rem)] md:pb-14">
        <p data-hero-meta className="caption text-ivory-faint">
          {site.developer}
        </p>

        <div className="max-w-[16ch] md:max-w-none">
          <div data-hero-eyebrow>
            <p className="numeral mb-3 text-bronze">
              01<span aria-hidden="true"> / {BEATS.length}</span>
            </p>
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

          <p className="visually-hidden">{hero.headline}</p>
        </div>

        <div className="mt-10 grid-12 items-end gap-y-8 md:mt-14">
          <p data-hero-meta className="body-copy col-span-4 md:col-span-3 lg:col-span-3">
            {architecture.towers} interconnected {architecture.storeys}-storey towers on Upper
            Hill Road — {architecture.residences} residences above the city.
          </p>

          <div
            data-hero-cta
            className="col-span-4 flex flex-wrap items-center gap-x-8 gap-y-4 md:col-span-3"
          >
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
    </div>
  );

  const stackFigures = BEATS.slice(1).map((beat) => {
    const image = assets[beat.assetKey];
    return (
      <figure key={beat.id} className="relative h-[50vh] w-full overflow-hidden">
        <ResponsivePicture
          source={image}
          alt={image.alt}
          width={image.width}
          height={image.height}
          blurDataURL={image.blurDataURL}
          sizes="100vw"
          className="h-full w-full"
          style={{ aspectRatio: "auto" }}
        />
        <figcaption className="caption absolute bottom-4 left-4 text-ivory-faint">
          {beat.label}
        </figcaption>
      </figure>
    );
  });

  return (
    <section id="hero" ref={rootRef} aria-labelledby="hero-heading" className="relative isolate">
      {stack ? (
        <div key="stack">
          <div className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
            {photoLayer}
            {scrim}
            {overlay}
          </div>
          {stackFigures}
        </div>
      ) : (
        <div key="flight" className="relative h-[800svh]">
          <div className="sticky top-0 h-[100svh] overflow-hidden">
            <div className="relative isolate flex h-full flex-col justify-end">
              {photoLayer}
              {scrim}
              {overlay}
              <FlightChapters />
            </div>
          </div>
        </div>
      )}

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

"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "@/animations/gsap";
import { Eyebrow, IndexMarker } from "@/components/ui/Eyebrow";
import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { assets } from "@/data/assets";
import { architecture, sections } from "@/data/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Section 02 — The Development.
 *
 * Slow counter-parallax between the photograph and the copy establishes depth
 * without any 3D. The camera-orbit reading is added in Phase 4; the type
 * hierarchy and grid established here are final.
 */
export function Development() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const view = assets.developmentTowers;
  const detail = assets.heroTowers;

  useGSAP(
    () => {
      if (reduced) return;

      // Two layers moving at different rates — this is what makes a flat
      // photograph read as a space.
      gsap.fromTo(
        "[data-dev-back]",
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "bottom top", scrub: 1 },
        },
      );

      gsap.fromTo(
        "[data-dev-front]",
        { yPercent: 8 },
        {
          yPercent: -8,
          ease: "none",
          scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "bottom top", scrub: 1.5 },
        },
      );
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <section
      id="development"
      ref={rootRef}
      aria-labelledby="development-heading"
      className="relative py-[clamp(6rem,14vh,12rem)]"
    >
      <div className="shell">
        <div className="grid-12 items-end gap-y-10">
          <div className="col-span-4 md:col-span-6">
            <Reveal>
              <Eyebrow>{sections.development.eyebrow}</Eyebrow>
            </Reveal>
          </div>

          <div className="col-span-4 md:col-span-4 lg:col-span-6">
            <Reveal y={24}>
              <h2 id="development-heading" className="display-l">
                {sections.development.headline}
              </h2>
            </Reveal>
          </div>

          <div className="col-span-4 md:col-span-2">
            <Reveal delay={0.1}>
              <p className="numeral text-ivory-faint">
                {architecture.towers} towers · {architecture.storeys} storeys
              </p>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Layered architectural view */}
      <div className="relative mt-[clamp(3rem,8vh,6rem)] overflow-hidden">
        <div data-dev-back className="relative h-[62vh] min-h-[22rem] w-full will-change-transform">
          <ResponsivePicture
            source={view}
            alt={view.alt}
            width={view.width}
            height={view.height}
            blurDataURL={view.blurDataURL}
            sizes="100vw"
            className="h-full w-full"
            style={{ aspectRatio: "auto" }}
          />
        </div>

        {/* Foreground detail plate — offset, smaller, slower. */}
        <div className="shell">
          <div
            data-dev-front
            className="relative -mt-[clamp(4rem,12vh,9rem)] ml-auto w-[62%] max-w-xl will-change-transform md:w-[38%]"
          >
            <div className="border border-hairline bg-ink">
              <div className="relative overflow-hidden">
                <ResponsivePicture
                  source={detail}
                  alt={detail.alt}
                  width={detail.width}
                  height={detail.height}
                  blurDataURL={detail.blurDataURL}
                  sizes="(max-width: 768px) 62vw, 38vw"
                  style={{ aspectRatio: "4 / 5" }}
                />
              </div>
              <div className="p-6">
                <p className="caption">{detail.alt}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Materials */}
      <div className="shell mt-[clamp(5rem,12vh,10rem)]">
        <RevealGroup as="ul" className="grid-12 gap-y-8" stagger={0.07}>
          {architecture.materials.map((material, index) => (
            <li key={material.name} className="col-span-4 border-t border-hairline pt-5 md:col-span-3">
              <div className="flex items-baseline gap-3">
                <IndexMarker>{String(index + 1).padStart(2, "0")}</IndexMarker>
                <h3 className="display-s">{material.name}</h3>
              </div>
              <p className="caption mt-3">{material.detail}</p>
            </li>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
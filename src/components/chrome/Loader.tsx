"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/animations/gsap";
import { site } from "@/data/site";
import { useAssetPreload } from "@/hooks/useAssetPreload";

type LoaderProps = {
  /** Critical first-viewport assets. Progress reflects these only. */
  assets: { src: string; weight?: number }[];
  onComplete: () => void;
};

const WORDMARK = ["THE VERDE", "RESIDENCES"];

/**
 * Brand loading screen. Progress is driven by real asset completion — there is
 * no simulated delay. Exits with a vertical mask wipe rather than a fade, so it
 * reads as an architectural reveal.
 */
export function Loader({ assets, onComplete }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState(false);
  const progress = useAssetPreload(assets);

  useEffect(() => {
    if (progress < 1 || exiting) return;

    // Let the final frame of the progress rule paint before wiping.
    const hold = window.setTimeout(() => setExiting(true), 220);
    return () => window.clearTimeout(hold);
  }, [progress, exiting]);

  useGSAP(
    () => {
      if (!exiting) return;

      const tl = gsap.timeline({
        defaults: { ease: "expo.inOut" },
        onComplete: onComplete,
      });

      tl.to("[data-loader-line]", { yPercent: -105, duration: 0.9, stagger: 0.07 }, 0)
        .to("[data-loader-meta]", { opacity: 0, duration: 0.5 }, 0)
        .to(rootRef.current, { yPercent: -100, duration: 1.1 }, 0.45);
    },
    { dependencies: [exiting, onComplete] },
  );

  const percent = Math.round(progress * 100);

  return (
    <div
      ref={rootRef}
      data-loader
      className="fixed inset-0 z-100 flex flex-col bg-ink"
      role="progressbar"
      aria-label="Loading The Verde Residences"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="flex flex-1 flex-col justify-center px-[var(--gutter)]">
        <p data-loader-meta className="eyebrow mb-8">
          {site.location}
        </p>

        <h1 className="sr-only">
          {site.name} — {site.location}
        </h1>

        <div aria-hidden="true">
          {WORDMARK.map((line, lineIndex) => (
            <span key={line} className="block overflow-hidden">
              <span
                data-loader-line
                className="display-l block will-change-transform"
                style={{ marginLeft: `calc(var(--gutter) * -1 + ${lineIndex * 1.5}rem)` }}
              >
                {line}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div
        data-loader-meta
        className="shell flex items-end justify-between gap-6 pb-10 md:pb-14"
      >
        <p className="caption max-w-[24ch]">
          Three interconnected towers · Upper Hill Road
        </p>
        <span className="numeral text-ivory tabular-nums" aria-hidden="true">
          {String(percent).padStart(2, "0")}
        </span>
      </div>

      <div className="h-px w-full bg-hairline">
        <div
          ref={barRef}
          className="h-px origin-left bg-ivory"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </div>
  );
}
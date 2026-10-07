"use client";

import { chapters } from "@/data/navigation";
import { useScrollPosition } from "@/hooks/useScrollPosition";

/**
 * Scroll progress rail.
 *
 * Desktop: a hairline vertical rule on the trailing edge with a bronze fill,
 * plus the current chapter index. Mobile: a 2px top rule only — the chapter
 * readout would compete with content on a small screen.
 */
export function ScrollProgress() {
  const { progress, activeId } = useScrollPosition();

  const activeIndex = chapters.findIndex((c) => c.id === activeId);
  const chapter = chapters[activeIndex] ?? chapters[0];

  return (
    <>
      {/* Mobile — minimal top rule */}
      <div
        data-scroll-progress
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-95 h-0.5 bg-hairline lg:hidden"
      >
        <div
          className="h-full origin-left bg-bronze"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {/* Desktop — trailing vertical rail */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed right-6 top-1/2 z-95 hidden -translate-y-1/2 flex-col items-center gap-6 lg:flex xl:right-10"
      >
        <span className="numeral rotate-180 text-ivory-faint [writing-mode:vertical-rl]">
          {chapter.index} / {String(chapters.length).padStart(2, "0")}
        </span>

        <div className="relative h-40 w-px bg-hairline">
          <div
            className="absolute inset-x-0 top-0 origin-top bg-bronze"
            style={{ height: `${progress * 100}%` }}
          />
        </div>

        <span className="numeral text-ivory-faint [writing-mode:vertical-rl]">
          {chapter.label}
        </span>
      </div>
    </>
  );
}
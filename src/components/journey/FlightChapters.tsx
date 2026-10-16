"use client";

import { useEffect, useRef } from "react";

import { gsap, registerGsap } from "@/animations/gsap";
import { BEATS } from "@/data/beats";
import { flight } from "@/data/site";
import { activeBeat } from "@/journey/photoPlanes";
import { journey } from "@/journey/store";
import { WAYPOINTS } from "@/journey/waypoints";

registerGsap();

const anchorTs = WAYPOINTS.map((waypoint) => waypoint.t);
const total = BEATS.length;
type Chapter = (typeof flight.chapters)[number];
const chapterById = new Map<string, Chapter>(
  flight.chapters.map((chapter) => [chapter.id, chapter]),
);

/** Chapters 2 → 13; the hero itself is chapter 1. */
const chapters = BEATS.slice(1).map((beat, index) => {
  const chapter = chapterById.get(beat.id);
  return {
    id: beat.id,
    number: String(index + 2).padStart(2, "0"),
    title: chapter?.title ?? beat.label,
    line: chapter?.line ?? "",
    body: chapter?.body ?? "",
  };
});

/**
 * Chapter titles over the flight.
 *
 * The flight is one continuous camera move, so the text is a single layer that
 * names whichever beat the camera is on. The active card is chosen with the same
 * `activeBeat` window the photograph planes cross-fade on, and read from the
 * store the camera itself moves with — so the words change exactly when the
 * image does. All cards stay in the DOM for assistive tech; only the active one
 * is painted (see the reduced-motion-aware rule in globals.css).
 */
export function FlightChapters() {
  const itemsRef = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const items = itemsRef.current;
    let last = -1;

    const tick = () => {
      const active = activeBeat(journey.progress.value, anchorTs);
      if (active === last) return;
      last = active;
      items.forEach((item, index) => {
        if (item) item.dataset.active = index + 1 === active ? "true" : "false";
      });
    };

    gsap.ticker.add(tick);
    tick();

    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div
      data-flight-chapters
      className="pointer-events-none absolute inset-x-0 z-20"
      style={{ top: "calc(var(--nav-h) + 2rem)" }}
    >
      <div className="shell flex justify-end">
        <ol
          aria-label={flight.label}
          start={2}
          className="grid w-full max-w-[26rem] grid-cols-1 justify-items-end text-right"
        >
          {chapters.map((chapter, index) => (
            <li
              key={chapter.id}
              ref={(node) => {
                itemsRef.current[index] = node;
              }}
              data-flight-chapter
              data-chapter={chapter.id}
              className="col-start-1 row-start-1"
            >
              <p className="numeral text-bronze">
                {chapter.number}
                <span aria-hidden="true"> / {total}</span>
              </p>
              <p className="display-m mt-3 text-ivory">{chapter.title}</p>
              <p className="body-copy mt-2 ml-auto hidden max-w-[26ch] text-ivory md:block">
                {chapter.line}
              </p>
              <p className="body-copy mt-2 ml-auto max-w-[34ch] text-ivory-dim line-clamp-2 md:line-clamp-none">
                {chapter.body}
              </p>
              <span
                aria-hidden="true"
                className="ml-auto mt-4 block h-px w-12 bg-hairline-strong"
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

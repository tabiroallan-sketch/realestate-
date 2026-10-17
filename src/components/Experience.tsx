"use client";

import { useCallback, useEffect, useState } from "react";

import { Loader } from "@/components/chrome/Loader";
import { ScrollProgress } from "@/components/chrome/ScrollProgress";
import { WhatsAppBar } from "@/components/chrome/WhatsAppBar";
import { criticalAssets } from "@/data/assets";
import { useLenis } from "@/hooks/useLenis";
import { JourneyCanvas } from "@/journey/JourneyCanvas";
import { track } from "@/lib/analytics";

/**
 * Client shell for the whole experience.
 *
 * Sequencing matters: the loader blocks, smooth scroll is only enabled once the
 * loader has exited, and the scroll rail only mounts afterwards so
 * it never renders behind the loading screen.
 */
export function Experience({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const onComplete = useCallback(() => setRevealed(true), []);

  useLenis(revealed);

  // One delegated listener for every `data-analytics` control, plus one
  // intersection observer for section views — so only the elements that opt in
  // emit, and no per-component wiring is needed.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-analytics]");
      if (target?.dataset.analytics) track(target.dataset.analytics);
    };

    document.addEventListener("click", onClick);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).id;
          if (id) track("section_view", { section: id });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.4 },
    );

    for (const section of document.querySelectorAll<HTMLElement>("main section[id]")) {
      observer.observe(section);
    }

    return () => {
      document.removeEventListener("click", onClick);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {!revealed && <Loader assets={criticalAssets} onComplete={onComplete} />}

      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <ScrollProgress />
      <WhatsAppBar />

      {/* The journey canvas is a fixed layer behind the content, mounted once and
          never unmounted — a second WebGL context would defeat the whole point of
          one continuous camera flight. It renders nothing without WebGL, so the
          DOM journey stands alone. */}
      <JourneyCanvas />

      <main id="main">{children}</main>
    </>
  );
}
"use client";

import { useCallback, useState } from "react";

import { Loader } from "@/components/chrome/Loader";
import { CustomCursor } from "@/components/chrome/CustomCursor";
import { ScrollProgress } from "@/components/chrome/ScrollProgress";
import { criticalAssets } from "@/data/assets";
import { useLenis } from "@/hooks/useLenis";
import { JourneyCanvas } from "@/journey/JourneyCanvas";

/**
 * Client shell for the whole experience.
 *
 * Sequencing matters: the loader blocks, smooth scroll is only enabled once the
 * loader has exited, and the cursor plus scroll rail only mount afterwards so
 * they never render behind the loading screen.
 */
export function Experience({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const onComplete = useCallback(() => setRevealed(true), []);

  useLenis(revealed);

  return (
    <>
      {!revealed && <Loader assets={criticalAssets} onComplete={onComplete} />}

      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <ScrollProgress />
      <CustomCursor />

      {/* The journey canvas is a fixed layer behind the content, mounted once and
          never unmounted — a second WebGL context would defeat the whole point of
          one continuous camera flight. It renders nothing without WebGL, so the
          DOM journey stands alone. */}
      <JourneyCanvas />

      <main id="main">{children}</main>
    </>
  );
}
"use client";

import { useState } from "react";

import { ResponsivePicture, type PictureSource } from "@/components/ui/ResponsivePicture";
import { cn } from "@/lib/cn";

type MediaFrameProps = {
  source: PictureSource;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  priority?: boolean;
  className?: string;
  ratio?: string;
  sizes?: string;
};

/**
 * Photograph wrapper with a graceful failure path.
 *
 * A missing or corrupt asset renders a labelled bronze-framed slot rather than a
 * broken image icon — the layout holds and the alt text stays available to
 * assistive technology.
 */
export function MediaFrame({
  source,
  alt,
  width,
  height,
  blurDataURL,
  priority = false,
  className,
  ratio,
  sizes = "100vw",
}: MediaFrameProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-end border border-hairline bg-ink-raised p-6",
          className,
        )}
        style={{ aspectRatio: ratio ?? `${width} / ${height}` }}
      >
        <span className="caption text-ivory-faint">{alt}</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      onErrorCapture={(event) => {
        // The ladder is all-or-nothing per asset, so one failure means the
        // whole set is missing — fall back rather than showing a broken frame.
        if ((event.target as HTMLElement).tagName === "IMG") setFailed(true);
      }}
    >
      <ResponsivePicture
        source={source}
        alt={alt}
        width={width}
        height={height}
        blurDataURL={blurDataURL}
        priority={priority}
        sizes={sizes}
        style={ratio ? { aspectRatio: ratio } : undefined}
      />
    </div>
  );
}
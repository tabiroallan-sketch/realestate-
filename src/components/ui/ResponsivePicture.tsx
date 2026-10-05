"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

export type PictureSource = {
  /** Public path without extension or width, e.g. `/assets/hero/hero-poster`. */
  srcSetBase: string;
  widths: readonly number[];
  formats: readonly string[];
};

type ResponsivePictureProps = {
  source: PictureSource;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  /** Eagerly load and fetch at high priority — hero only. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  /** Wrapper sizing. Defaults to the image's own aspect ratio. */
  style?: React.CSSProperties;
};

function srcSet(base: string, widths: readonly number[], format: string): string {
  return widths.map((w) => `${base}-${w}.${format} ${w}w`).join(", ");
}

/** Pick the variant that best matches the rendered width, for the fallback src. */
function bestVariant(base: string, widths: readonly number[], format: string, target: number): string {
  let chosen = widths[0];
  for (const w of widths) {
    if (w <= target) chosen = w;
  }
  return `${base}-${chosen}.${format}`;
}

/**
 * Responsive image backed by the prebuilt AVIF/WebP ladder.
 *
 * The asset pipeline already emits every width in both formats, so this serves
 * those files directly through `<picture>` instead of routing them back through
 * `next/image` — that would re-encode already-optimised assets and, for these
 * extensionless manifest keys, cannot resolve a source format at all.
 *
 * Emits AVIF first (browsers take the first supported source), WebP second, and
 * a plain `<img>` fallback for older engines.
 */
export function ResponsivePicture({
  source,
  alt,
  width,
  height,
  blurDataURL,
  priority = false,
  sizes = "100vw",
  className,
  imgClassName,
  style,
}: ResponsivePictureProps) {
  const { srcSetBase: base, widths, formats } = source;

  // Sensible middle rung for the no-JS / no-srcset fallback path.
  const [targetWidth, setTargetWidth] = useState(width);

  const avif = formats.includes("avif") ? "avif" : null;
  const webp = formats.includes("webp") ? "webp" : null;
  const fallbackFormat = webp ?? avif ?? "jpg";

  const onLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    // Drop the blur placeholder once the real pixels are on screen.
    img.style.backgroundImage = "";
    img.dataset.loaded = "true";
  };

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const target = img.clientWidth || window.innerWidth;
    setTargetWidth(Math.max(...widths.filter((w) => w <= target * (window.devicePixelRatio || 1)), widths[0]));
    onLoad(event);
  };

  return (
    <picture
      className={cn("block", className)}
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio: `${width} / ${height}`,
        backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        ...style,
      }}
    >
      {avif && (
        <source type="image/avif" srcSet={srcSet(base, widths, "avif")} sizes={sizes} />
      )}
      {webp && (
        <source type="image/webp" srcSet={srcSet(base, widths, "webp")} sizes={sizes} />
      )}
      <img
        src={bestVariant(base, widths, fallbackFormat, targetWidth)}
        srcSet={srcSet(base, widths, fallbackFormat)}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={handleLoad}
        className={cn(
          "h-full w-full object-cover",
          // Keep the LQIP underneath until the ladder has painted.
          "transition-opacity duration-500 data-[loaded=true]:opacity-100",
          blurDataURL && "opacity-0 data-[loaded=true]:opacity-100",
          imgClassName,
        )}
      />
    </picture>
  );
}
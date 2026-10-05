"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { assets, type AssetKey } from "@/data/assets";
import { cn } from "@/lib/cn";

type EditorialChapterProps = {
  id: string;
  eyebrow: string;
  headline: string;
  body?: string;
  /** Primary photograph. Omit for typographic-only chapters. */
  image?: AssetKey;
  imageAlt?: string;
  /** Secondary supporting plate shown beside the copy on wide screens. */
  insetImage?: AssetKey;
  /** Bulleted points rendered as a hairline-ruled list. */
  points?: readonly string[];
  /** Left-align, centre or alternate the copy column for rhythm. */
  align?: "start" | "alternate";
  tone?: "ink" | "raised";
};

/**
 * The editorial chapter — the workhorse layout for the typographically-led
 * sections of the journey.
 *
 * This is a final design, not a scaffold: the residence configurator, exploded
 * architecture and masterplan sections that need custom machinery are built as
 * their own components rather than being forced into this shape.
 */
export function EditorialChapter({
  id,
  eyebrow,
  headline,
  body,
  image,
  imageAlt,
  insetImage,
  points,
  align = "start",
  tone = "ink",
}: EditorialChapterProps) {
  const primary = image ? assets[image] : null;
  const inset = insetImage ? assets[insetImage] : null;
  const copyCol = align === "alternate" ? "md:col-span-5 md:col-start-8" : "md:col-span-5";
  const mediaCol = align === "alternate" ? "md:col-span-6 md:col-start-1" : "md:col-span-6 md:col-start-7";

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn(
        "relative scroll-mt-[var(--nav-h)] py-[clamp(5rem,12vh,10rem)]",
        tone === "raised" && "bg-ink-raised",
      )}
    >
      <div className="shell">
        <div className="grid-12 items-start gap-y-12">
          <div className={cn("col-span-4", copyCol)}>
            <Reveal>
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>

            <Reveal y={24}>
              <h2 id={`${id}-heading`} className="display-l mt-6">
                {headline}
              </h2>
            </Reveal>

            {body && (
              <Reveal delay={0.08}>
                <p className="body-copy mt-6 max-w-prose">{body}</p>
              </Reveal>
            )}

            {points && points.length > 0 && (
              <RevealGroup as="ul" className="mt-10" stagger={0.06}>
                {points.map((point) => (
                  <li key={point} className="hairline-t py-4">
                    <span className="body-copy">{point}</span>
                  </li>
                ))}
              </RevealGroup>
            )}
          </div>

          {(primary || inset) && (
            <div className={cn("col-span-4", mediaCol)}>
              {primary && (
                <Reveal y={28}>
                  <MediaFrame
                    source={primary}
                    alt={imageAlt ?? primary.alt}
                    width={primary.width}
                    height={primary.height}
                    blurDataURL={primary.blurDataURL}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </Reveal>
              )}

              {inset && (
                <Reveal y={28} delay={0.1} className={cn("mt-8", primary && "md:-mt-[18%] md:ml-[22%] md:w-[72%]")}>
                  <MediaFrame
                    source={inset}
                    alt={inset.alt}
                    width={inset.width}
                    height={inset.height}
                    blurDataURL={inset.blurDataURL}
                    sizes="(max-width: 768px) 100vw, 36vw"
                  />
                </Reveal>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
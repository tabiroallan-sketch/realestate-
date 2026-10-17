"use client";

import { useState } from "react";

import { Lightbox, type LightboxItem } from "@/components/ui/Lightbox";
import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import { assets, gallery } from "@/data/assets";

const ITEMS: LightboxItem[] = gallery.map((entry) => ({
  asset: assets[entry.key],
  caption: entry.caption,
}));

export function GalleryGrid() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item, index) => (
          <li key={item.asset.key}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              data-analytics="gallery:open"
              aria-label={`View larger: ${item.caption}`}
              className="group block w-full text-left"
            >
              <span className="block overflow-hidden">
                <ResponsivePicture
                  source={item.asset}
                  alt={item.asset.alt}
                  width={item.asset.width}
                  height={item.asset.height}
                  blurDataURL={item.asset.blurDataURL}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                  imgClassName="transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
                />
              </span>
              <span className="caption mt-4 block transition-colors duration-[var(--duration-ui)] group-hover:text-ivory">
                {item.caption}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <Lightbox
          items={ITEMS}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  );
}

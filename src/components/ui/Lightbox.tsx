"use client";

import { useEffect, useRef } from "react";

import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import type { Asset } from "@/data/assets";

export type LightboxItem = { asset: Asset; caption: string };

type LightboxProps = {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

/**
 * Modal image viewer for the gallery.
 *
 * Mirrors the mobile menu's focus contract: real <button>s, focus moved in on
 * open and returned on close, Escape to dismiss, arrow keys to page, and a
 * Tab cycle trapped inside the dialog.
 */
export function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const item = items[index];

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    panel?.querySelector<HTMLElement>(selector)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigate((index + 1) % items.length);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNavigate((index - 1 + items.length) % items.length);
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(selector));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [index, items.length, onClose, onNavigate]);

  useEffect(() => {
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, []);

  if (!item) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Gallery image: ${item.caption}`}
      className="fixed inset-0 z-90 flex flex-col bg-ink/95 backdrop-blur-sm"
    >
      <div className="relative z-10 flex items-center justify-between gap-4 px-[var(--gutter)] py-4">
        <p className="numeral text-ivory-faint">
          {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center border border-hairline px-4 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ivory transition-colors duration-[var(--duration-ui)] hover:border-bronze hover:text-bronze"
        >
          Close
        </button>
      </div>

      <figure
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
        className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-[var(--gutter)] pb-6"
      >
        <ResponsivePicture
          source={item.asset}
          alt={item.asset.alt}
          width={item.asset.width}
          height={item.asset.height}
          blurDataURL={item.asset.blurDataURL}
          sizes="(min-width: 1024px) 70vw, 92vw"
          className="max-h-[72svh] w-auto max-w-full"
          style={{ aspectRatio: "auto" }}
          imgClassName="object-contain"
        />
        <figcaption className="caption max-w-[46ch] text-center">{item.caption}</figcaption>
      </figure>

      <div className="relative z-10 flex items-center justify-center gap-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => onNavigate((index - 1 + items.length) % items.length)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-hairline px-4 text-ivory transition-colors duration-[var(--duration-ui)] hover:border-bronze hover:text-bronze"
          aria-label="Previous image"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => onNavigate((index + 1) % items.length)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-hairline px-4 text-ivory transition-colors duration-[var(--duration-ui)] hover:border-bronze hover:text-bronze"
          aria-label="Next image"
        >
          →
        </button>
      </div>
    </div>
  );
}

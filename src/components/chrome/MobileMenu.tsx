"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "@/animations/gsap";
import type { Chapter, NavItem } from "@/data/navigation";
import { site } from "@/data/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

type MobileMenuProps = {
  id: string;
  open: boolean;
  onClose: () => void;
  onCtaClick: () => void;
  links: NavItem[];
  chapters: Chapter[];
};

/**
 * Full-screen mobile menu.
 *
 * Keeps a real focus trap, moves focus in on open and returns it to the
 * trigger on close. Every chapter link is a real anchor so it works with
 * keyboard and screen readers.
 */
export function MobileMenu({
  id,
  open,
  onClose,
  onCtaClick,
  links,
  chapters,
}: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const previous = document.activeElement as HTMLElement | null;

    const selector =
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    panel?.querySelector<HTMLElement>(selector)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
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
  }, [open, onClose]);

  // Lock the page behind the panel. This belongs here rather than in the nav
  // because the overlay owns the interaction surface while it is open.
  useEffect(() => {
    if (!open) return;

    const { overflow, paddingRight } = document.body.style;
    // Compensate for the removed scrollbar so the page does not shift.
    const gutter = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open]);

  useGSAP(
    () => {
      if (reduced) return;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      if (open) {
        tl.set(panelRef.current, { pointerEvents: "auto" })
          .fromTo("[data-menu-panel]", { yPercent: -100 }, { yPercent: 0, duration: 0.8, ease: "expo.inOut" })
          .fromTo(
            "[data-menu-item]",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.055 },
            0.32,
          );
      } else {
        tl.to("[data-menu-item]", { opacity: 0, y: 12, duration: 0.28, stagger: 0.03 })
          .to("[data-menu-panel]", { yPercent: -100, duration: 0.55, ease: "expo.inOut" }, 0.1)
          .set(panelRef.current, { pointerEvents: "none" });
      }
    },
    { dependencies: [open, reduced] },
  );

  return (
    <div
      id={id}
      ref={panelRef}
      className="fixed inset-0 z-80 pointer-events-none lg:hidden"
      aria-hidden={!open}
    >
      <div data-menu-panel className="absolute inset-0 flex flex-col bg-ink">
        <div className="h-[var(--nav-h)] shrink-0" aria-hidden="true" />

        <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center px-[var(--gutter)]">
          <p className="eyebrow mb-8">{site.location}</p>
          <ul>
            {links.map((link, index) => (
              <li key={link.href} data-menu-item className="border-t border-hairline">
                <Link
                  href={link.href}
                  onClick={onCtaClick}
                  tabIndex={open ? 0 : -1}
                  className={cn(
                    "flex min-h-16 items-center justify-between gap-4",
                    "font-display text-[clamp(1.75rem,7vw,2.5rem)] leading-none",
                    "text-ivory transition-colors duration-[var(--duration-ui)]",
                    "hover:text-bronze focus-visible:text-bronze",
                  )}
                >
                  <span>{link.label}</span>
                  <span aria-hidden="true" className="numeral text-bronze-dim">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div data-menu-item className="hairline-t px-[var(--gutter)] py-6">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
            {chapters.slice(0, 8).map((chapter) => (
              <li key={chapter.id}>
                <Link
                  href={`#${chapter.id}`}
                  onClick={onCtaClick}
                  tabIndex={open ? 0 : -1}
                  className="flex min-h-11 items-center gap-2 caption text-ivory-faint hover:text-ivory"
                >
                  <span className="numeral text-bronze-dim">{chapter.index}</span>
                  <span className="truncate">{chapter.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-1">
            <a
              href={site.phoneHref}
              tabIndex={open ? 0 : -1}
              className="caption text-ivory-dim hover:text-ivory"
            >
              {site.phone}
            </a>
            <a
              href={`mailto:${site.email}`}
              tabIndex={open ? 0 : -1}
              className="caption text-ivory-dim hover:text-ivory"
            >
              {site.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
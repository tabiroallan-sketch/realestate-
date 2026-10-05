"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { MobileMenu } from "@/components/chrome/MobileMenu";
import { Button } from "@/components/ui/Button";
import { chapters, navigation, navigationCta } from "@/data/navigation";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { cn } from "@/lib/cn";

/** Scroll distance before the bar gains its background. */
const CONDENSE_AT = 40;

/** Scroll distance before a downward scroll retracts the bar. */
const RETRACT_AT = 240;

export function Navigation() {
  const { activeId, scrollY, direction } = useScrollPosition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);

  const condensed = scrollY > CONDENSE_AT;

  // Derived during render rather than in an effect: the bar must never retract
  // while the keyboard is inside it, and that is a property of the current DOM.
  const hidden = direction === "down" && scrollY > RETRACT_AT && !focusWithin && !menuOpen;

  const onBlurCapture = useCallback((event: React.FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
      setFocusWithin(false);
    }
  }, []);

  const onCtaClick = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header
        data-nav
        onFocusCapture={() => setFocusWithin(true)}
        onBlurCapture={onBlurCapture}
        className={cn(
          "fixed inset-x-0 top-0 z-90",
          "transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
          hidden && "-translate-y-full",
        )}
      >
        <div
          className={cn(
            "relative transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
            condensed || menuOpen
              ? "bg-ink hairline-b"
              : "bg-transparent border-b border-transparent",
          )}
        >
          <div className="shell flex h-[var(--nav-h)] items-center justify-between gap-8">
            <Link
              href="#hero"
              className="group relative z-10 flex min-h-11 items-center gap-2"
              aria-label="The Verde Residences — return to top"
            >
              <span className="font-display text-[1.0625rem] leading-none tracking-[0.18em] text-ivory transition-colors duration-[var(--duration-ui)] md:text-[1.25rem]">
                THE VERDE
              </span>
              <span
                aria-hidden="true"
                className="hidden h-px w-6 origin-left bg-bronze transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out-expo)] group-hover:scale-x-0 sm:block"
              />
            </Link>

            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-8">
                {navigation.map((item) => {
                  const chapterId = item.href.replace("#", "");
                  const active = activeId === chapterId;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "group relative inline-flex min-h-11 items-center",
                          "font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em]",
                          "transition-colors duration-[var(--duration-ui)]",
                          active ? "text-ivory" : "text-ivory-dim hover:text-ivory",
                        )}
                      >
                        {item.label}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute inset-x-0 bottom-2 h-px origin-left bg-bronze",
                            "transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
                            active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100",
                          )}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-4">
              <Button
                href={navigationCta.href}
                size="md"
                withArrow
                className="hidden border border-hairline-strong md:inline-flex"
              >
                {navigationCta.label}
              </Button>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="relative z-10 -mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
              >
                <span className="visually-hidden">
                  {menuOpen ? "Close menu" : "Open menu"}
                </span>
                <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
                  <span
                    className={cn(
                      "h-px w-full bg-ivory transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
                      menuOpen && "translate-y-[3px] rotate-45",
                    )}
                  />
                  <span
                    className={cn(
                      "h-px w-full bg-ivory transition-opacity duration-[var(--duration-ui)]",
                      menuOpen && "opacity-0",
                    )}
                  />
                  <span
                    className={cn(
                      "h-px w-full bg-ivory transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
                      menuOpen && "-translate-y-[3px] -rotate-45",
                    )}
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        id="mobile-menu"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onCtaClick={onCtaClick}
        chapters={chapters}
        links={[...navigation, navigationCta]}
      />
    </>
  );
}
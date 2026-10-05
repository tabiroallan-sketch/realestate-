import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "link";
type Size = "md" | "lg";

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Optional trailing arrow. Slides on hover. */
  withArrow?: boolean;
  className?: string;
};

type Props = BaseProps &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">)
    | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">)
  );

/**
 * Architectural slab button: hairline border, a fill that sweeps in from the
 * left on hover, label inverts. No radius, no shadow, no layout shift —
 * hover states animate only colour and transform.
 */
export function Button({
  children,
  variant = "outline",
  size = "md",
  withArrow = false,
  className,
  ...rest
} : Props) {
  const classes = cn(
    "group relative inline-flex items-center justify-center gap-3",
    "font-sans font-medium uppercase tracking-[0.2em] whitespace-nowrap",
    "transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
    // Minimum 44px touch target at every size (WCAG 2.5.8)
    size === "lg" ? "min-h-14 px-8 text-[0.6875rem]" : "min-h-11 px-6 text-[0.625rem]",
    variant === "link" && "min-h-0 px-0 py-1",
    className,
  );

  const inner = (
    <>
      {variant !== "link" && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 origin-left scale-x-0 transition-transform",
            "duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
            "group-hover:scale-x-100 group-focus-visible:scale-x-100",
            variant === "solid"
              ? "bg-ivory"
              : "bg-ivory",
          )}
        />
      )}

      <span
        className={cn(
          "relative z-10 transition-colors duration-[var(--duration-ui)]",
          "ease-[var(--ease-out-expo)]",
          variant === "solid"
            ? "text-ink group-hover:text-ink group-focus-visible:text-ink"
            : "text-ivory group-hover:text-ink group-focus-visible:text-ink",
        )}
      >
        {children}
      </span>

      {withArrow && (
        <span
          aria-hidden="true"
          className={cn(
            "relative z-10 transition-all duration-[var(--duration-ui)]",
            "ease-[var(--ease-out-expo)]",
            "translate-x-0 group-hover:translate-x-1 group-focus-visible:translate-x-1",
            variant === "solid"
              ? "text-ink group-hover:text-ink"
              : "text-bronze group-hover:text-ink",
          )}
        >
          →
        </span>
      )}

      {variant === "link" && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-100 bg-bronze transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out-expo)] group-hover:scale-x-0 group-focus-visible:scale-x-0"
        />
      )}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest;
    return (
      <a href={href} className={classes} {...anchorRest}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {inner}
    </button>
  );
}
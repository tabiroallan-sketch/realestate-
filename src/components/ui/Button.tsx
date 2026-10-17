import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "solid" | "accent" | "outline" | "link";
type Size = "md" | "lg";

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Optional trailing arrow. Slides on hover. */
  withArrow?: boolean;
  /** Analytics event emitted on click, written as a `data-analytics` attribute. */
  analytics?: string;
  className?: string;
};

type Props = BaseProps &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">)
    | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">)
  );

/**
 * Architectural slab button: a fill that sweeps in from the left on hover, the
 * label inverting over it. No radius, no shadow, no layout shift.
 *
 * Each variant owns exactly one background and one foreground class, so a
 * caller's `className` never has to win a specificity fight with the variant —
 * `solid` is filled ivory, `accent` is filled bronze, `outline` is a hairline
 * ghost, `link` is a bare underlined label.
 */
const VARIANTS: Record<
  Variant,
  { surface?: string; sweep?: string; label: string; arrow: string; underline?: string }
> = {
  solid: {
    surface: "bg-ivory",
    sweep: "bg-bronze",
    label: "text-ink",
    arrow: "text-ink",
  },
  accent: {
    surface: "bg-bronze",
    sweep: "bg-ivory",
    label: "text-ink",
    arrow: "text-ink",
  },
  outline: {
    surface: "border border-hairline",
    sweep: "bg-ivory",
    label: "text-ivory group-hover:text-ink group-focus-visible:text-ink",
    arrow: "text-bronze group-hover:text-ink group-focus-visible:text-ink",
  },
  link: {
    label: "text-ivory group-hover:text-bronze group-focus-visible:text-bronze",
    arrow: "text-bronze",
    underline: "bg-bronze",
  },
};

export function Button({
  children,
  variant = "outline",
  size = "md",
  withArrow = false,
  analytics,
  className,
  ...rest
}: Props) {
  const v = VARIANTS[variant];

  // Emit exactly one size/padding set — never two that must out-order each
  // other in the stylesheet (`cn` is a plain joiner, not tailwind-merge).
  const sizing =
    variant === "link"
      ? size === "lg"
        ? "min-h-14 px-0 text-[0.6875rem]"
        : "min-h-11 px-0 text-[0.625rem]"
      : size === "lg"
        ? "min-h-14 px-8 text-[0.6875rem]"
        : "min-h-11 px-6 text-[0.625rem]";

  const classes = cn(
    "group relative inline-flex items-center justify-center gap-3",
    "font-sans font-medium uppercase tracking-[0.2em] whitespace-nowrap",
    "transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
    // Minimum 44px touch target at every size (WCAG 2.5.8)
    sizing,
    v.surface,
    className,
  );

  const inner = (
    <>
      {v.sweep && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 origin-left scale-x-0 transition-transform",
            "duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
            "group-hover:scale-x-100 group-focus-visible:scale-x-100",
            v.sweep,
          )}
        />
      )}

      <span
        data-cta-label
        className={cn(
          "relative z-10 transition-colors duration-[var(--duration-ui)]",
          "ease-[var(--ease-out-expo)]",
          v.label,
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
            v.arrow,
          )}
        >
          →
        </span>
      )}

      {variant === "link" && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 bottom-0 h-px origin-left scale-x-100 bg-bronze",
            "transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out-expo)]",
            "group-hover:scale-x-0 group-focus-visible:scale-x-0",
            v.underline,
          )}
        />
      )}
    </>
  );

  const analyticsProps = analytics ? { "data-analytics": analytics } : {};

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest;
    return (
      <a href={href} className={classes} {...analyticsProps} {...anchorRest}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...analyticsProps} {...rest}>
      {inner}
    </button>
  );
}

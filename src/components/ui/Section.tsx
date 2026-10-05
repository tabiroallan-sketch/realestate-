import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type SectionProps = {
  id: string;
  className?: string;
  /** Heading that labels this section for assistive technology. */
  labelledBy?: string;
  /**
   * Polymorphic element type. Typed loosely on purpose: `ElementType` erases the
   * element's own props, so a union of JSX intrinsic names would reject every
   * valid `children` combination.
   */
  as?: "section" | "article" | "div" | "main";
  children?: ReactNode;
};

/**
 * Semantic section wrapper. Every cinematic chapter renders through this so
 * the heading hierarchy and `aria-labelledby` wiring stay consistent.
 */
export function Section({
  id,
  children,
  className,
  labelledBy,
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative", className)}
    >
      {children}
    </Tag>
  );
}

/** Horizontal page inset. Full-bleed cinematic sections bypass this. */
export function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("shell", className)}>{children}</div>;
}
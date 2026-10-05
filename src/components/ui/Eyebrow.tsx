import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Eyebrow({
  children,
  className,
  as: Tag = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "span" | "h2";
}) {
  return <Tag className={cn("eyebrow", className)}>{children}</Tag>;
}

/** Small bronze index marker — used for chapters, material lists and plans. */
export function IndexMarker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("numeral text-bronze-dim", className)} aria-hidden="true">
      {children}
    </span>
  );
}
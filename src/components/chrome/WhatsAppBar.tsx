"use client";

import Link from "next/link";

import { site } from "@/data/site";

export function WhatsAppBar() {
  return (
    <Link
      href={site.whatsappBase}
      target="_blank"
      rel="noopener noreferrer"
      data-whatsapp-bar
      aria-label="Contact sales on WhatsApp"
      className="fixed inset-x-0 bottom-0 z-80 lg:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-14 items-center justify-center gap-2 bg-bronze text-ink">
        <span className="font-sans text-[0.75rem] font-medium uppercase tracking-[0.16em]">
          WhatsApp Sales
        </span>
        <span className="font-sans text-[0.75rem] font-medium uppercase tracking-[0.16em]">
          {site.phone}
        </span>
      </div>
    </Link>
  );
}

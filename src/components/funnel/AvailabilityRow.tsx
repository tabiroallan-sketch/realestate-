import { availability, site } from "@/data/site";
import { cn } from "@/lib/cn";

type Row = (typeof availability)["rows"][number];

type AvailabilityRowProps = {
  row: Row;
  typeName: string;
};

export function AvailabilityRow({ row, typeName }: AvailabilityRowProps) {
  const href =
    site.whatsappBase +
    "?text=" +
    encodeURIComponent(
      `Enquiry about ${row.unit} — ${typeName} — ${row.size} — ${row.price} at The Verde Residences.`,
    );

  return (
    <li
      data-availability-row
      className="hairline-t flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-5"
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="display-s">{row.unit}</span>
          <span
            className={cn(
              "inline-block border px-2.5 py-1 text-[0.5625rem] font-medium uppercase tracking-[0.14em]",
              row.status === "Available"
                ? "border-bronze text-bronze"
                : "border-hairline text-ivory-faint",
            )}
          >
            {row.status}
          </span>
        </div>
        <p className="caption mt-2">
          {typeName} · Floor {row.floor} · {row.size}
        </p>
      </div>

      <div className="flex items-center gap-6">
        <span className="numeral text-bronze">{row.price}</span>
        <a
          href={href}
          className="inline-flex min-h-11 items-center bg-bronze px-5 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ink transition-opacity duration-[var(--duration-ui)] hover:opacity-90"
        >
          <span className="visually-hidden">
            Enquire about {row.unit} on WhatsApp
          </span>
          <span aria-hidden="true">WhatsApp</span>
        </a>
      </div>
    </li>
  );
}

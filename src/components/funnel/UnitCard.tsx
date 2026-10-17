import { cn } from "@/lib/cn";
import { whatsappHref } from "@/lib/whatsapp";

type UnitCardProps = {
  name: string;
  typology: string;
  interior: string;
  range: string;
  note: string;
  className?: string;
};

export function UnitCard({ name, typology, interior, range, note, className }: UnitCardProps) {
  const enquiryHref = whatsappHref(
    `Enquiry about ${name} (${typology}, ${interior}) — ${range} — at The Verde Residences.`,
  );
  const floorPlanHref = whatsappHref(
    `Please send the floor plan for ${name} (${typology}, ${interior}) at The Verde Residences.`,
  );

  return (
    <article
      className={cn("flex flex-col border border-hairline bg-ink-raised p-6 md:p-7", className)}
    >
      <h3 className="display-s">{name}</h3>
      <p className="caption mt-3">
        {typology} · {interior}
      </p>
      <p className="numeral mt-4 text-bronze">{range}</p>
      <p className="body-copy mt-4">{note}</p>

      {/* Floor-plan slot — the drawing is released on request, so the slot
          carries a real path to it rather than a decorative placeholder. */}
      <a
        href={floorPlanHref}
        target="_blank"
        rel="noopener noreferrer"
        data-analytics="cta:unit-floorplan"
        aria-label={`Request the ${interior} floor plan for ${name} on WhatsApp`}
        className={cn(
          "mt-6 flex flex-1 flex-col items-center justify-center gap-2 border border-hairline",
          "min-h-24 text-center transition-colors duration-[var(--duration-ui)]",
          "hover:border-hairline-strong focus-visible:border-hairline-strong",
        )}
      >
        <span className="eyebrow">Floor plan</span>
        <span className="caption">{interior} · on request</span>
      </a>

      <a
        href={enquiryHref}
        target="_blank"
        rel="noopener noreferrer"
        data-analytics="cta:unit-enquire"
        className={cn(
          "mt-4 inline-flex min-h-11 w-full items-center justify-center",
          "border border-hairline px-5 text-[0.625rem] font-medium uppercase tracking-[0.16em]",
          "text-ivory transition-colors duration-[var(--duration-ui)]",
          "hover:border-bronze hover:text-bronze focus-visible:border-bronze focus-visible:text-bronze",
        )}
      >
        Enquire on WhatsApp
      </a>
    </article>
  );
}

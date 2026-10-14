import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { availability, residenceTypes, sections } from "@/data/site";

import { AvailabilityRow } from "./AvailabilityRow";
import { SectionHeader } from "./SectionHeader";

function typeNameOf(typeId: string) {
  return residenceTypes.find((type) => type.id === typeId)?.name ?? typeId;
}

export function Availability() {
  const content = sections.availability;

  return (
    <Section
      id={content.id}
      labelledBy={`${content.id}-heading`}
      className="scroll-mt-[var(--nav-h)] py-[clamp(4rem,12vh,9rem)]"
    >
      <div className="shell">
        <div className="grid-12 gap-y-8">
          <div className="col-span-4 md:col-span-6 lg:col-span-6">
            <SectionHeader
              id={content.id}
              eyebrow={content.eyebrow}
              headline={content.headline}
            />
          </div>

          <div className="col-span-4 self-end md:col-span-6 lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.08}>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-hairline pb-5">
                <p className="display-m">
                  {availability.remaining}{" "}
                  <span className="text-bronze">/ {availability.total}</span>
                </p>
                <p className="numeral text-ivory-faint">
                  Residences remaining · As of {availability.asOf}
                </p>
              </div>
              <p className="body-copy mt-6">{content.body}</p>
            </Reveal>
          </div>
        </div>

        <RevealGroup as="ul" className="mt-[clamp(2.5rem,6vh,4rem)]" stagger={0.05}>
          {availability.rows.map((row) => (
            <AvailabilityRow key={row.unit} row={row} typeName={typeNameOf(row.type)} />
          ))}
        </RevealGroup>

        <p className="caption mt-6">
          Full inventory, floor-by-floor pricing and payment terms are confirmed on WhatsApp.
        </p>
      </div>
    </Section>
  );
}

import { RevealGroup } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { locationPoints, sections } from "@/data/site";

import { SectionHeader } from "./SectionHeader";

export function LocationStrip() {
  const content = sections.location;

  return (
    <Section
      id={content.id}
      labelledBy={`${content.id}-heading`}
      className="scroll-mt-[var(--nav-h)] py-[clamp(4rem,12vh,9rem)]"
    >
      <div className="shell">
        <div className="grid-12 gap-y-8">
          <div className="col-span-4 md:col-span-6 lg:col-span-7">
            <SectionHeader
              id={content.id}
              eyebrow={content.eyebrow}
              headline={content.headline}
              body={content.body}
            />
          </div>
        </div>

        <RevealGroup
          as="ul"
          className="mt-[clamp(2.5rem,6vh,4rem)] flex flex-wrap gap-x-[clamp(1.5rem,4vw,3.5rem)] gap-y-6"
          stagger={0.05}
        >
          {locationPoints.map((point) => (
            <li key={point.label} className="hairline-t min-w-[7.5rem] flex-1 pt-4">
              <p className="caption">{point.label}</p>
              <p className="numeral mt-2 text-bronze">{point.note}</p>
            </li>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

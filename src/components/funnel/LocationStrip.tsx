import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { locationPoints, sections } from "@/data/site";

import { DistanceRose } from "./DistanceRose";
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
        <div className="grid-12 items-center gap-y-12">
          <div className="col-span-4 md:col-span-6 lg:col-span-6">
            <SectionHeader
              id={content.id}
              eyebrow={content.eyebrow}
              headline={content.headline}
              body={content.body}
            />

            <Reveal delay={0.1}>
              <ul className="mt-8">
                {locationPoints.map((point) => (
                  <li
                    key={point.label}
                    className="hairline-t flex items-baseline justify-between gap-6 py-4"
                  >
                    <span className="caption">{point.label}</span>
                    <span className="numeral text-bronze">{point.note}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="col-span-4 md:col-span-6 lg:col-span-5 lg:col-start-8">
            <Reveal delay={0.15}>
              <DistanceRose />
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}

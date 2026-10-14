import { RevealGroup } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { residenceTypes, sections } from "@/data/site";

import { SectionHeader } from "./SectionHeader";
import { UnitCard } from "./UnitCard";

export function ResidenceCollection() {
  const content = sections.residences;

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
            />
          </div>
        </div>

        <RevealGroup
          as="div"
          className="mt-[clamp(2.5rem,6vh,4rem)] grid-12 gap-y-6"
          stagger={0.07}
        >
          {residenceTypes.map((type) => (
            <div key={type.id} className="col-span-4 md:col-span-3 lg:col-span-3">
              <UnitCard
                name={type.name}
                typology={type.typology}
                interior={type.interior}
                range={type.range}
                note={type.note}
                className="h-full"
              />
            </div>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

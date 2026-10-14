import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { amenitiesList, sections } from "@/data/site";

import { SectionHeader } from "./SectionHeader";

export function Amenities() {
  const content = sections.amenities;

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
              <p className="body-copy">{content.body}</p>
            </Reveal>
          </div>
        </div>

        <RevealGroup
          as="div"
          className="mt-[clamp(2.5rem,6vh,4rem)] grid-12 gap-y-10"
          stagger={0.06}
        >
          {amenitiesList.map((group) => (
            <div key={group.group} className="col-span-4 md:col-span-3 lg:col-span-3">
              <h3 className="eyebrow">{group.group}</h3>
              <ul className="mt-5">
                {group.items.map((item) => (
                  <li key={item} className="hairline-t py-3">
                    <span className="body-copy">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

import { RevealGroup } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { sections, trust } from "@/data/site";

import { SectionHeader } from "./SectionHeader";
import { StatBlock } from "./StatBlock";

export function Trust() {
  const content = sections.trust;

  const stats = [
    { figure: String(trust.founded), label: "Founded" },
    { figure: trust.homes.toLocaleString("en-US"), label: "Homes handed over" },
    {
      figure: String(trust.towersUnderConstruction),
      label: "Towers under construction",
    },
  ];

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
          className="mt-[clamp(2.5rem,6vh,4rem)] grid-12 gap-y-8"
          stagger={0.08}
        >
          {stats.map((stat) => (
            <li
              key={stat.label}
              className="hairline-t col-span-4 pt-6 md:col-span-2 lg:col-span-4"
            >
              <StatBlock figure={stat.figure} label={stat.label} />
            </li>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

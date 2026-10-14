import { IndexMarker } from "@/components/ui/Eyebrow";
import { ResponsivePicture } from "@/components/ui/ResponsivePicture";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { assets } from "@/data/assets";
import { architecture, sections, site } from "@/data/site";

import { SectionHeader } from "./SectionHeader";
import { StatBlock } from "./StatBlock";

export function Development() {
  const content = sections.development;
  const image = assets.developmentTowers;

  const facts = [
    { figure: String(architecture.towers), label: "Towers" },
    { figure: String(architecture.storeys), label: "Storeys" },
    { figure: architecture.completion, label: "Completion" },
    { figure: site.address.street, label: "Address" },
  ];

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
      </div>

      <div className="relative mt-[clamp(3rem,7vh,5rem)] h-[46svh] overflow-hidden">
        <ResponsivePicture
          source={image}
          alt={image.alt}
          width={image.width}
          height={image.height}
          blurDataURL={image.blurDataURL}
          sizes="100vw"
          className="h-full w-full"
          style={{ aspectRatio: "auto" }}
        />
      </div>

      <div className="shell mt-[clamp(3rem,7vh,5rem)]">
        <RevealGroup as="ul" className="grid-12 gap-y-8" stagger={0.06}>
          {facts.map((fact) => (
            <li key={fact.label} className="hairline-t col-span-2 pt-5 md:col-span-3 lg:col-span-3">
              <StatBlock figure={fact.figure} label={fact.label} />
            </li>
          ))}
        </RevealGroup>

        <RevealGroup as="ul" className="mt-[clamp(3rem,7vh,5rem)] grid-12 gap-y-8" stagger={0.07}>
          {architecture.materials.map((material, index) => (
            <li
              key={material.name}
              className="hairline-t col-span-4 pt-5 md:col-span-3 lg:col-span-3"
            >
              <div className="flex items-baseline gap-3">
                <IndexMarker>{String(index + 1).padStart(2, "0")}</IndexMarker>
                <h3 className="display-s">{material.name}</h3>
              </div>
              <p className="caption mt-3">{material.detail}</p>
            </li>
          ))}
        </RevealGroup>
      </div>
    </Section>
  );
}

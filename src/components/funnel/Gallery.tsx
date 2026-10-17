import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { sections } from "@/data/site";

import { GalleryGrid } from "./GalleryGrid";
import { SectionHeader } from "./SectionHeader";

export function Gallery() {
  const content = sections.gallery;

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

        <Reveal className="mt-[clamp(2.5rem,6vh,4rem)]">
          <GalleryGrid />
        </Reveal>
      </div>
    </Section>
  );
}

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { sections, site } from "@/data/site";

import { SectionHeader } from "./SectionHeader";

export function Close() {
  const content = sections.contact;

  return (
    <Section
      id={content.id}
      labelledBy={`${content.id}-heading`}
      className="scroll-mt-[var(--nav-h)] border-t border-bronze/30 bg-ink-raised py-[clamp(4rem,12vh,9rem)]"
    >
      <div className="shell">
        <div className="grid-12 gap-y-10">
          <div className="col-span-4 md:col-span-6 lg:col-span-6">
            <SectionHeader
              id={content.id}
              eyebrow={content.eyebrow}
              headline={content.headline}
              body={content.body}
            />
          </div>

          <div className="col-span-4 md:col-span-6 lg:col-span-4 lg:col-start-9">
            <Reveal delay={0.1}>
              <div className="flex flex-wrap items-center gap-4">
                <Button
                  href={site.whatsappBase}
                  variant="solid"
                  size="lg"
                  withArrow
                  className="bg-bronze text-ink"
                >
                  WhatsApp Sales
                </Button>
                <Button
                  href={site.phoneHref}
                  variant="outline"
                  size="lg"
                  className="border border-hairline"
                >
                  {site.phone}
                </Button>
              </div>

              <div className="mt-8 space-y-1">
                <p className="caption">{site.address.street}</p>
                <p className="caption">
                  {site.address.area}, {site.address.city}
                </p>
                <p className="caption">
                  {site.address.country} · {site.address.postcode}
                </p>
                <p className="caption text-ivory-faint">{site.hours}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}

import { SiteFooter } from "@/components/chrome/SiteFooter";
import { Development } from "@/components/journey/sections/Development";
import { EditorialChapter } from "@/components/journey/sections/EditorialChapter";
import { Hero } from "@/components/journey/sections/Hero";
import { sections } from "@/data/site";

/**
 * The journey.
 *
 * Phase 1 establishes the full narrative spine — every chapter exists with real
 * content, real type hierarchy and its assigned photography, so the design
 * system, navigation, scroll behaviour and responsive grid are all verifiable
 * end to end. Phases 2–7 layer the WebGL journey, residence hotspots, masterplan
 * drag, exploded architecture and configurator onto these anchors rather than
 * re-cutting the page.
 */
export default function Home() {
  return (
    <>
      <Hero />

      <Development />

      <EditorialChapter
        id={sections.lobby.id}
        eyebrow={sections.lobby.eyebrow}
        headline={sections.lobby.headline}
        body={sections.lobby.body}
        points={sections.lobby.points}
        image="lobbyWide"
        insetImage="lobbyDetail"
        tone="raised"
      />

      <EditorialChapter
        id={sections.residence.id}
        eyebrow={sections.residence.eyebrow}
        headline={sections.residence.headline}
        body={sections.residence.body}
        image="residenceLiving"
        insetImage="livingRoom"
      />

      <EditorialChapter
        id={sections.balcony.id}
        eyebrow={sections.balcony.eyebrow}
        headline={sections.balcony.headline}
        image="balconySkyline"
      />

      <EditorialChapter
        id={sections.rooftop.id}
        eyebrow={sections.rooftop.eyebrow}
        headline={sections.rooftop.headline}
        body={sections.rooftop.body}
        image="rooftopPool"
        insetImage="rooftopRise"
        align="alternate"
      />

      <EditorialChapter
        id={sections.dayNight.id}
        eyebrow={sections.dayNight.eyebrow}
        headline={sections.dayNight.headline}
        body={sections.dayNight.body}
        image="nightIlluminated"
        insetImage="nightFacade"
      />

      <EditorialChapter
        id={sections.exploded.id}
        eyebrow={sections.exploded.eyebrow}
        headline={sections.exploded.headline}
        body={sections.exploded.body}
        tone="raised"
      />

      <EditorialChapter
        id={sections.masterplan.id}
        eyebrow={sections.masterplan.eyebrow}
        headline={sections.masterplan.headline}
        body={sections.masterplan.body}
        image="entranceStreet"
      />

      <EditorialChapter
        id={sections.residences.id}
        eyebrow={sections.residences.eyebrow}
        headline={sections.residences.headline}
        tone="raised"
      />

      <EditorialChapter
        id={sections.amenities.id}
        eyebrow={sections.amenities.eyebrow}
        headline={sections.amenities.headline}
        body={sections.amenities.body}
      />

      <EditorialChapter
        id={sections.location.id}
        eyebrow={sections.location.eyebrow}
        headline={sections.location.headline}
        body={sections.location.body}
      />

      <ContactChapter />

      <SiteFooter />
    </>
  );
}

/** Kept local until the enquiry form is built in the interaction phase. */
function ContactChapter() {
  return (
    <section
      id={sections.contact.id}
      aria-labelledby="contact-heading"
      className="relative scroll-mt-[var(--nav-h)] bg-ink-sunken py-[clamp(6rem,16vh,12rem)]"
    >
      <div className="shell">
        <div className="grid-12 items-end gap-y-10">
          <div className="col-span-4 md:col-span-8 lg:col-span-7">
            <h2 id="contact-heading" className="display-l">
              {sections.contact.headline}
            </h2>
          </div>
          <div className="col-span-4 md:col-span-4 lg:col-span-4 lg:col-start-9">
            <p className="body-copy">{sections.contact.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
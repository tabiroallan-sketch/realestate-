import { SiteFooter } from "@/components/chrome/SiteFooter";
import { Amenities } from "@/components/funnel/Amenities";
import { Availability } from "@/components/funnel/Availability";
import { Close } from "@/components/funnel/Close";
import { Development } from "@/components/funnel/Development";
import { Gallery } from "@/components/funnel/Gallery";
import { LocationStrip } from "@/components/funnel/LocationStrip";
import { ResidenceCollection } from "@/components/funnel/ResidenceCollection";
import { Trust } from "@/components/funnel/Trust";
import { FlightShell } from "@/components/journey/FlightShell";

export default function Home() {
  return (
    <>
      <FlightShell />

      <div className="relative bg-ink">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[60svh] -translate-y-full bg-gradient-to-b from-transparent to-[#0a0c0b]"
        />

        <Development />
        <ResidenceCollection />
        <Gallery />
        <Amenities />
        <LocationStrip />
        <Availability />
        <Trust />
        <Close />
      </div>

      <SiteFooter />
    </>
  );
}

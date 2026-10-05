import { Button } from "@/components/ui/Button";
import { site } from "@/data/site";

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] items-center bg-ink">
      <div className="shell">
        <div className="grid-12 items-end gap-y-10">
          <div className="col-span-4 md:col-span-6">
            <p className="numeral text-bronze-dim">404</p>
            <h1 className="display-l mt-6">Page Not Found</h1>
          </div>

          <div className="col-span-4 md:col-span-3">
            <p className="body-copy">
              The page you are looking for does not exist. Return to {site.shortName} to continue
              through the journey.
            </p>
          </div>

          <div className="col-span-4 md:col-span-3">
            <Button href="/" variant="solid" size="lg" withArrow>
              Back to The Verde
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
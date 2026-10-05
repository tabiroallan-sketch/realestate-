import { architecture, footer, site } from "@/data/site";

export function SiteFooter() {
  const year = 2026;

  return (
    <footer className="relative border-t border-hairline bg-ink-sunken">
      <div className="shell py-[clamp(4rem,9vh,7rem)]">
        <div className="grid-12 gap-y-12">
          {/* Wordmark + statement */}
          <div className="col-span-4 md:col-span-6 lg:col-span-5">
            <p className="display-m">{site.shortName}</p>
            <p className="body-copy mt-5 max-w-sm">
              {site.tagline} {architecture.residences} residences on Upper Hill Road, Nairobi.
            </p>
          </div>

          {/* Contact */}
          <div className="col-span-4 md:col-span-3">
            <h2 className="eyebrow">Enquiries</h2>
            <address className="mt-5 flex flex-col gap-3 not-italic">
              <a className="link-underline flex min-h-11 items-center" href={site.phoneHref}>
                {site.phone}
              </a>
              <a className="link-underline flex min-h-11 items-center" href={`mailto:${site.email}`}>
                {site.email}
              </a>
              <p className="body-copy">
                {site.address.street}
                <br />
                {site.address.area}, {site.address.city}
              </p>
            </address>
          </div>

          {/* Social */}
          <div className="col-span-4 md:col-span-3">
            <h2 className="eyebrow">Follow</h2>
            <ul className="mt-5">
              {site.social.map((social) => (
                <li key={social.label} className="border-t border-hairline">
                  <a
                    className="link-underline flex min-h-11 items-center"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-4 md:col-span-6 lg:col-span-1 lg:col-start-12">
            <h2 className="eyebrow">Legal</h2>
            <ul className="mt-5">
              {footer.links.map((link) => (
                <li key={link.label} className="border-t border-hairline">
                  <a className="link-underline flex min-h-11 items-center" href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Colophon */}
        <div className="mt-[clamp(3rem,7vh,5rem)] grid-12 gap-y-6 border-t border-hairline pt-8">
          <p className="caption col-span-4 md:col-span-6">
            &copy; {year} {site.developer}. All rights reserved.
          </p>
          <p className="caption col-span-4 md:col-span-6 lg:col-span-4 lg:col-start-9">
            {footer.legal}
          </p>
        </div>
      </div>
    </footer>
  );
}
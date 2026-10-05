import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";

import { Experience } from "@/components/Experience";
import { Navigation } from "@/components/chrome/Navigation";
import { ogImage } from "@/data/assets";
import { site } from "@/data/site";

import "lenis/dist/lenis.css";
import "./globals.css";

const display = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bodoni",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  preload: true,
});

const sans = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
  weight: ["300", "400", "500"],
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "The Verde Residences | Luxury Living in Nairobi",
    template: "%s | The Verde Residences",
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "luxury apartments Nairobi",
    "Nairobi residences",
    "Westlands luxury property",
    "22 storey tower Nairobi",
    "Upper Hill Road apartments",
    "The Verde Residences",
  ],
  authors: [{ name: site.developer }],
  creator: site.developer,
  publisher: site.developer,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: "The Verde Residences | Luxury Living in Nairobi",
    description: site.description,
    locale: "en_KE",
    images: [
      {
        url: ogImage,
        width: 1376,
        height: 768,
        alt: "The Verde Residences — three interconnected ivory towers above landscaped gardens in Nairobi.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Verde Residences | Luxury Living in Nairobi",
    description: site.description,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: true, email: true, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.developer,
      url: site.url,
      telephone: site.phone,
      email: site.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressRegion: site.address.area,
        postalCode: site.address.postcode,
        addressCountry: "KE",
      },
      sameAs: site.social.map((s) => s.href),
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      inLanguage: "en-KE",
      publisher: { "@id": `${site.url}/#organization` },
    },
    {
      "@type": "RealEstateAgent",
      "@id": `${site.url}/#agent`,
      name: site.developer,
      url: site.url,
      telephone: site.phone,
      areaServed: { "@type": "City", name: "Nairobi" },
      parentOrganization: { "@id": `${site.url}/#organization` },
    },
    {
      "@type": "Residence",
      "@id": `${site.url}/#development`,
      name: site.name,
      description: site.description,
      url: site.url,
      image: `${site.url}${ogImage}`,
      numberOfAccommodationUnits: {
        "@type": "QuantitativeValue",
        value: 84,
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressLocality2: site.address.area,
        addressCountry: "KE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -1.2864,
        longitude: 36.8172,
      },
      numberOfFloors: 22,
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Rooftop infinity pool", value: true },
        { "@type": "LocationFeatureSpecification", name: "24-hour concierge", value: true },
        { "@type": "LocationFeatureSpecification", name: "Wellness floor", value: true },
        { "@type": "LocationFeatureSpecification", name: "Landscaped gardens", value: true },
      ],
      makesOffer: {
        "@type": "Offer",
        availability: "https://schema.org/PreOrder",
        priceCurrency: "KES",
        price: 145000000,
        priceValidUntil: "2027-12-31",
        seller: { "@id": `${site.url}/#agent` },
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-KE" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh bg-ink text-ivory antialiased">
        <script
          type="application/ld+json"
          // Static, author-controlled JSON — no user input reaches this string.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <Navigation />

        <Experience>{children}</Experience>
      </body>
    </html>
  );
}
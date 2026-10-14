/**
 * Site-wide content. Every string that appears on the page lives here so the
 * fictional project can be swapped for a real client by editing this file.
 */

export const site = {
  name: "The Verde Residences",
  shortName: "The Verde",
  developer: "Verde Development Partners",
  location: "Nairobi, Kenya",
  tagline: "Live Above The Ordinary.",
  url: "https://www.verderesidences.co.ke",
  description:
    "Discover The Verde Residences — a new standard of luxury residential living in Nairobi.",
  phone: "+254 700 000 000",
  phoneHref: "tel:+254700000000",
  email: "sales@verderesidences.co.ke",
  whatsappBase: "https://wa.me/254700000000",
  hours: "Monday to Saturday, 09:00–18:00 EAT",
  address: {
    street: "Upper Hill Road",
    area: "Westlands",
    city: "Nairobi",
    country: "Kenya",
    postcode: "P.O. Box 40123-00100",
  },
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "X", href: "https://x.com" },
  ],
} as const;

export const architecture = {
  towers: 3,
  storeys: 22,
  completion: "Q4 2027",
  residenceTypes: 4,
  residences: 84,
  architect: "Atelier Nyeri",
  landscape: "Kijani Landscape Works",
  materials: [
    { name: "Ivory cast concrete", detail: "Curved balcony reveals, board-formed" },
    { name: "Blue-tinted low-E glazing", detail: "Floor-to-ceiling, solar control" },
    { name: "Dark bronze anodised fins", detail: "Vertical shading, 480mm modules" },
    { name: "Mature tropical canopy", detail: "Retained and replanted on site" },
  ],
} as const;

export const hero = {
  eyebrow: `${site.shortName.toUpperCase()} — ${site.location.toUpperCase()}`,
  headline: site.tagline,
  primaryCta: { label: "Explore Residences", href: "#residences" },
  secondaryCta: { label: "View Availability", href: "#availability" },
  scrollHint: "Scroll to enter",
} as const;

export const sections = {
  development: {
    id: "development",
    eyebrow: "The Development",
    headline: "Architecture That Belongs Here.",
    body: "Three interconnected towers shaped by the way light falls across the Nairobi plateau. Curved ivory balconies step back from blue-tinted glass, screened by bronze fins that shift through the day.",
  },
  residences: {
    id: "residences",
    eyebrow: "Residence Collection",
    headline: "Four Ways To Live.",
  },
  amenities: {
    id: "amenities",
    eyebrow: "Amenities",
    headline: "Everything Considered.",
    body: "A full suite of resident amenities across the podium and the roof, operated by the same team that runs the concierge.",
  },
  location: {
    id: "location",
    eyebrow: "Location",
    headline: "Connected To Everything That Matters.",
    body: "Upper Hill Road places the development between the CBD and Westlands — minutes from Nairobi's international connectivity, and entirely apart from its noise.",
  },
  contact: {
    id: "contact",
    eyebrow: "Enquire",
    headline: "Book A Viewing.",
    body: `Sales gallery on Upper Hill Road, Westlands. Open ${site.hours}. Viewings by appointment; construction tours once the towers pass Level 08.`,
  },
  availability: {
    id: "availability",
    eyebrow: "Availability",
    headline: "37 Of 84 Still Available.",
    body: "A snapshot as of October 2026 — six representative units below. Current pricing, floor-by-floor inventory and payment terms are confirmed on WhatsApp.",
  },
  trust: {
    id: "trust",
    eyebrow: "The Developer",
    headline: "Building In Nairobi Since 2009.",
    body: "Verde Development Partners has handed over 1,240 homes across six completed projects. Six towers are under construction today.",
  },
} as const;

export const residenceTypes = [
  {
    id: "studio",
    name: "Studio",
    typology: "One bedroom",
    interior: "48 m²",
    range: "From KES 5.4M",
    note: "Efficient city-facing layout with a deep balcony and full-height glazing.",
  },
  {
    id: "one-bed",
    name: "Residence One",
    typology: "Two bedroom",
    interior: "86 m²",
    range: "From KES 9.2M",
    note: "Dual-aspect living opening onto a 14m balcony along the north-west elevation.",
  },
  {
    id: "two-bed",
    name: "Residence Two",
    typology: "Three bedroom",
    interior: "132 m²",
    range: "From KES 14.5M",
    note: "Corner residences with a separate dining room and dual balcony thresholds.",
  },
  {
    id: "penthouse",
    name: "The Penthouse",
    typology: "Four bedroom",
    interior: "284 m²",
    range: "From KES 38M",
    note: "Full-floor living with a wraparound terrace and private plunge pool.",
  },
] as const;

export const availability = {
  total: 84,
  remaining: 37,
  asOf: "October 2026",
  rows: [
    { unit: "A-0402", type: "studio", floor: 4, size: "48 m²", price: "KES 5.4M", priceValue: 5.4, status: "Available" },
    { unit: "B-0905", type: "one-bed", floor: 9, size: "86 m²", price: "KES 9.2M", priceValue: 9.2, status: "Available" },
    { unit: "C-1103", type: "two-bed", floor: 11, size: "132 m²", price: "KES 14.5M", priceValue: 14.5, status: "On hold" },
    { unit: "A-1504", type: "one-bed", floor: 15, size: "86 m²", price: "KES 9.6M", priceValue: 9.6, status: "Available" },
    { unit: "B-1802", type: "two-bed", floor: 18, size: "132 m²", price: "KES 15.1M", priceValue: 15.1, status: "Available" },
    { unit: "C-2101", type: "penthouse", floor: 21, size: "284 m²", price: "KES 38M", priceValue: 38, status: "Available" },
  ],
} as const;

export const trust = {
  founded: 2009,
  homes: 1240,
  completedProjects: 6,
  towersUnderConstruction: 6,
} as const;

export const amenitiesList = [
  {
    group: "Arrival & Service",
    items: ["24-hour concierge", "Private secure parking", "Valet and porter service", "Boutique retail frontage"],
  },
  {
    group: "Wellness",
    items: ["25m lap pool", "Thermal and steam suites", "Movement studio", "Open-air training terrace"],
  },
  {
    group: "Rooftop",
    items: ["Sky lounge", "BBQ terrace", "Landscaped sky garden", "Sunset deck"],
  },
  {
    group: "Community",
    items: ["Residents' salon", "Business library", "Children's play room", "Pet garden"],
  },
] as const;

export const locationPoints = [
  { label: "Nairobi CBD", note: "8 minutes" },
  { label: "Westlands", note: "6 minutes" },
  { label: "Upper Hill", note: "5 minutes" },
  { label: "JKIA", note: "32 minutes" },
  { label: "Wilson Airport", note: "14 minutes" },
  { label: "Karura Forest", note: "7 minutes" },
] as const;

export const footer = {
  legal: "The Verde Residences is a fictional development created as a design and engineering demonstration. Imagery is AI-generated. All content is illustrative.",
  links: [
    { label: "Privacy", href: "#privacy" },
    { label: "Terms", href: "#terms" },
    { label: "Accessibility", href: "#accessibility" },
  ],
} as const;
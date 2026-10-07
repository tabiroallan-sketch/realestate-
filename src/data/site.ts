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
  secondaryCta: { label: "View Masterplan", href: "#masterplan" },
  scrollHint: "Scroll to enter",
} as const;

export const sections = {
  development: {
    id: "development",
    eyebrow: "The Development",
    headline: "Architecture That Belongs Here.",
    body: "Three interconnected towers shaped by the way light falls across the Nairobi plateau. Curved ivory balconies step back from blue-tinted glass, screened by bronze fins that shift through the day.",
  },
  lobby: {
    id: "lobby",
    eyebrow: "Arrival",
    headline: "Designed Around You.",
    body: "A lobby composed around light, air and quiet. Twenty-four-hour concierge, a wellness floor, private security and communal rooms finished in the same stone and bronze as the towers above.",
    points: ["24-hour concierge", "Wellness floor", "Private security", "Communal salons"],
  },
  residence: {
    id: "residence",
    eyebrow: "The Residence",
    headline: "A Home That Frames The City.",
    body: "Every residence is organised around a single panoramic elevation. Deep balcony reveals temper the sun; full-height glazing draws the skyline into the room.",
  },
  balcony: {
    id: "balcony",
    eyebrow: "The View",
    overlay: "Panoramic City Views",
    headline: "The City. Your Horizon.",
  },
  rooftop: {
    id: "rooftop",
    eyebrow: "Sky Amenities",
    headline: "Twenty-Two Floors Above It All.",
    body: "An infinity pool held against the skyline, a rooftop lounge for small gatherings, and gardens planted to soften the city horizon.",
  },
  dayNight: {
    id: "day-night",
    eyebrow: "Through The Day",
    headline: "As The Light Turns, The City Answers.",
    body: "From open sky at dawn to warm stone at dusk, to bronze-lit towers at night. The development is lit to change character without ever losing its calm.",
    states: [
      { label: "Day", time: "09:00" },
      { label: "Golden Hour", time: "17:40" },
      { label: "Dusk", time: "18:35" },
      { label: "Night", time: "21:10" },
    ],
  },
  exploded: {
    id: "architecture",
    eyebrow: "The Architecture",
    headline: "Built In Layers.",
    body: "The tower separates into the parts that make it work: residences, wellness, sky amenities and rooftop, each stacked on the structure below.",
  },
  masterplan: {
    id: "masterplan",
    eyebrow: "Masterplan",
    headline: "A Site That Breathes.",
    body: "Three towers held within landscaped gardens, connected by shaded pedestrian paths and set back from the road behind a reflecting pool.",
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
    eyebrow: "Private Viewing",
    headline: "Your New Perspective Awaits.",
    body: "Viewings are held by appointment at the sales gallery on Upper Hill Road, and at the development itself once construction reaches Level 08.",
    primaryCta: "Request A Private Viewing",
    secondaryCta: "Download Brochure",
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
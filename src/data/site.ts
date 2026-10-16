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

/**
 * Chapter titles over the flight.
 *
 * One entry per beat, keyed by beat id so the order can never drift from
 * `BEATS`. The opening beat (arrival) is presented by the hero itself, so the
 * overlay carries the rest; all of them are read by assistive tech.
 */
export const flight = {
  label: "The flight",
  chapters: [
    {
      id: "arrival",
      title: "Arrival",
      line: "A new address above the city.",
      body: "The approach gathers from the west, where the towers first separate from the skyline: three ivory volumes rising out of retained tropical canopy. Nothing announces itself. The building simply holds the afternoon light.",
    },
    {
      id: "towers",
      title: "The Towers",
      line: "Three towers, one silhouette.",
      body: "Three interconnected towers climb twenty-two storeys, stepping back from the street as they rise. Curved ivory balconies alternate with bands of blue-tinted glass, and dark bronze fins run the full height, measuring the day.",
    },
    {
      id: "development",
      title: "Development View",
      line: "Ivory, bronze and glass, shaped by light.",
      body: "Seen whole, the development reads as one silhouette in three movements — cast concrete, low-E glazing and anodised bronze held in the same rhythm. Between the towers, reflecting pools and replanted canopy keep the ground cool.",
    },
    {
      id: "threshold",
      title: "Threshold",
      line: "The city falls away at the door.",
      body: "At the threshold the city falls away behind you. A shaded portico and a long run of board-formed concrete set the pace down to a lobby that opens to Upper Hill Road on one side and the gardens on the other.",
    },
    {
      id: "lobby",
      title: "Lobby",
      line: "A double-height welcome.",
      body: "Inside, the lobby rises through two full storeys, daylight carried down from a glazed upper band. Stone, timber and bronze meet at the same angle throughout, and the concierge desk sits where you first look.",
    },
    {
      id: "lobby-detail",
      title: "Lobby Detail",
      line: "Sculpture underfoot, light overhead.",
      body: "A sculptural stair turns through the double-height volume, its underside cast in a single board-formed sweep. Light falls across it from above, while underfoot polished stone carries the same warm grey as the walls.",
    },
    {
      id: "residence",
      title: "Residence",
      line: "Rooms that open to the sky.",
      body: "Residences are planned around their light. Rooms open toward the balcony rather than the corridor, full-height glazing meeting a deep threshold that shades the interior through the middle of the day.",
    },
    {
      id: "living",
      title: "Living Room",
      line: "Space to gather, space to withdraw.",
      body: "Living and dining read as one continuous room — open to the balcony, closed to the street. Proportions stay generous without waste, from a 48 square metre studio to a 284 square metre penthouse, each with private outdoor space.",
    },
    {
      id: "view",
      title: "The View",
      line: "Nairobi, framed floor to ceiling.",
      body: "From the balcony, Nairobi is framed floor to ceiling — the CBD's towers on one side, the green edge of Karura Forest beyond. The deep reveal and bronze fins keep the glare out while the city stays present.",
    },
    {
      id: "rooftop-rise",
      title: "Rooftop Rise",
      line: "Above the skyline's edge.",
      body: "The camera rises past the upper floors and over the parapet. At the roof line the building gives way to planting, water and open sky — the point where a tower becomes a place to be, not only to live.",
    },
    {
      id: "rooftop-pool",
      title: "Rooftop Pool",
      line: "A pool against the horizon.",
      body: "On the roof, a 25-metre lap pool is set so its edge meets the horizon rather than a wall. The sky garden, BBQ terrace and sunset deck step outward around it, sheltered by the same bronze fins that shade the facades below.",
    },
    {
      id: "night-facade",
      title: "Night Facade",
      line: "Bronze fins, lit from within.",
      body: "After dark the facades change register: bronze fins catch the last of the low light while interior lamps show through the glazing, one residence at a time. The building reads as occupied rather than floodlit.",
    },
    {
      id: "night",
      title: "Night",
      line: "The towers, illuminated.",
      body: "From the distance of the first view, the towers are lit and legible against the dark plateau — the same three volumes that opened the flight, now holding the night. Completion is set for Q4 2027.",
    },
  ],
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
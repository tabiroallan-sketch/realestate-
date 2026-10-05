export type NavItem = {
  label: string;
  href: string;
};

export const navigation: NavItem[] = [
  { label: "Residences", href: "#residences" },
  { label: "Amenities", href: "#amenities" },
  { label: "Location", href: "#location" },
  { label: "Masterplan", href: "#masterplan" },
];

export const navigationCta = {
  label: "Private Viewing",
  href: "#contact",
} as const;

/**
 * Ordered chapter list. Drives the scroll progress rail, the mobile menu and
 * `useActiveSection`. `id` must match the `id` on the rendered <section>.
 */
export type Chapter = {
  id: string;
  /** Two-digit index rendered in the progress rail. */
  index: string;
  label: string;
};

export const chapters: Chapter[] = [
  { id: "hero", index: "01", label: "Arrival" },
  { id: "development", index: "02", label: "The Development" },
  { id: "lobby", index: "03", label: "Arrival & Lobby" },
  { id: "residence", index: "04", label: "The Residence" },
  { id: "balcony", index: "05", label: "The Balcony" },
  { id: "rooftop", index: "06", label: "Rooftop" },
  { id: "day-night", index: "07", label: "Day To Night" },
  { id: "architecture", index: "08", label: "The Architecture" },
  { id: "masterplan", index: "09", label: "Masterplan" },
  { id: "residences", index: "10", label: "Residence Collection" },
  { id: "amenities", index: "11", label: "Amenities" },
  { id: "location", index: "12", label: "Location" },
  { id: "contact", index: "13", label: "Private Viewing" },
];
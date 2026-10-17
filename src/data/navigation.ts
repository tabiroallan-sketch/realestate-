export type NavItem = {
  label: string;
  href: string;
};

export const navigation: NavItem[] = [
  { label: "Residences", href: "#residences" },
  { label: "Gallery", href: "#gallery" },
  { label: "Amenities", href: "#amenities" },
  { label: "Availability", href: "#availability" },
  { label: "Contact", href: "#contact" },
];

export const navigationCta = {
  label: "WhatsApp",
  href: "https://wa.me/254700000000",
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
  { id: "hero", index: "01", label: "The Flight" },
  { id: "development", index: "02", label: "The Development" },
  { id: "residences", index: "03", label: "Residences" },
  { id: "gallery", index: "04", label: "Gallery" },
  { id: "amenities", index: "05", label: "Amenities" },
  { id: "location", index: "06", label: "Location" },
  { id: "availability", index: "07", label: "Availability" },
  { id: "trust", index: "08", label: "The Developer" },
  { id: "contact", index: "09", label: "Enquire" },
];
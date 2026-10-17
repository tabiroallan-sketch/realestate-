import { site } from "@/data/site";

const DEFAULT_MESSAGE =
  "Hello — I'd like to enquire about The Verde Residences (Upper Hill Road, Nairobi).";

/** A WhatsApp deep link with a pre-filled message, so a tap always has context. */
export function whatsappHref(message: string = DEFAULT_MESSAGE): string {
  return `${site.whatsappBase}?text=${encodeURIComponent(message)}`;
}

export const whatsappDefaultMessage = DEFAULT_MESSAGE;

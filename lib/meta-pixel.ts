/**
 * Meta Pixel (Facebook / Instagram Ads).
 * L'identifiant peut être remplacé sans toucher au code via la variable Vercel NEXT_PUBLIC_META_PIXEL_ID.
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

type Fbq = (...args: unknown[]) => void;

/** Envoie un événement standard au Pixel (sans effet si le script n'est pas chargé ou bloqué). */
export function trackPixel(event: string, params?: Record<string, unknown>, options?: { eventID?: string }) {
  if (typeof window === "undefined" || !META_PIXEL_ID) return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (typeof fbq !== "function") return;
  if (options) fbq("track", event, params ?? {}, options);
  else fbq("track", event, params ?? {});
}

/**
 * Paramètres communs : montant, devise et nombre d'articles.
 * Pas d'identifiants produit (content_ids / contents) : la boutique n'utilise pas de catalogue Meta,
 * et ces identifiants déclenchent l'avertissement « Content IDs not matching any catalog ».
 */
export function pixelContents(lines: { productId: string; quantity: number; price: number }[]) {
  return {
    num_items: lines.reduce((n, l) => n + l.quantity, 0),
    value: lines.reduce((n, l) => n + l.price * l.quantity, 0),
    currency: process.env.NEXT_PUBLIC_CURRENCY || "MAD",
  };
}

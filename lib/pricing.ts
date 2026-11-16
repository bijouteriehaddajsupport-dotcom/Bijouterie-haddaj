/** Frais de livraison ajoutés (une fois par commande) si un produit n'a pas la livraison gratuite. */
export const SHIPPING_FEE = 25;

/** Frais de livraison d'une commande : 25 DH dès qu'un article est en livraison payante. */
export function shippingFee(lines: { paidShipping?: boolean }[]) {
  return lines.some((l) => l.paidShipping) ? SHIPPING_FEE : 0;
}

/** Écart appliqué par défaut entre le prix initial (barré) et le prix de vente. */
export const DEFAULT_PROMO_MARKUP = 299;

/** Retourne la réduction si le prix initial est supérieur au prix de vente, sinon null. */
export function getPromo(price: number, compareAt: number | null | undefined) {
  if (!compareAt || compareAt <= price) return null;
  const amount = compareAt - price;
  return { amount, percent: Math.round((amount / compareAt) * 100) };
}

/** Prix de vente à partir du prix initial et d'un pourcentage de réduction (arrondi au dirham). */
export function priceFromPercent(compareAt: number, percent: number) {
  return Math.max(0, Math.round(compareAt * (1 - percent / 100)));
}

/** Pourcentage de réduction à partir des deux prix (arrondi à l'unité). */
export function percentFromPrices(compareAt: number, price: number) {
  if (!compareAt || compareAt <= 0 || price >= compareAt) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

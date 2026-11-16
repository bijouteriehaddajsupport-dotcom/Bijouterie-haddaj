import { formatPrice } from "@/lib/format";

/** Numéro WhatsApp de la boutique (format international, sans « + »). */
export const WHATSAPP_NUMBER = "212671882274";

type Line = { name: string; quantity: number; price: number; size?: string | null };

/**
 * Lien WhatsApp avec un message de commande pré-rempli (français / arabe).
 * La taille n'apparaît que si elle a été choisie ; les champs vides restent
 * à compléter par le client.
 */
export function whatsappOrderUrl({
  lines,
  orderNumber,
  shipping = 0,
  name = "",
  city = "",
  address = "",
  phone = "",
}: {
  lines: Line[];
  orderNumber?: string;
  shipping?: number;
  name?: string;
  city?: string;
  address?: string;
  phone?: string;
}) {
  const total = lines.reduce((n, l) => n + l.price * l.quantity, 0) + shipping;
  const message = [
    "السلام عليكم، أريد تأكيد طلبي",
    orderNumber ? `Bonjour Haddaj Bijouterie, je souhaite confirmer ma commande ${orderNumber} :` : "Bonjour Haddaj Bijouterie, je souhaite commander :",
    "",
    ...lines.map((l) => `• ${l.name} × ${l.quantity}${l.size ? ` · Taille / المقاس ${l.size}` : ""} · ${formatPrice(l.price * l.quantity)}`),
    `Livraison / التوصيل : ${shipping > 0 ? formatPrice(shipping) : "Offerte / مجاني"}`,
    `Total : ${formatPrice(total)} (paiement à la livraison)`,
    "",
    `Nom complet / الاسم الكامل : ${name.trim()}`,
    `Ville / المدينة : ${city.trim()}`,
    `Adresse / العنوان : ${address.trim()}`,
    `Téléphone / الهاتف : ${phone.trim()}`,
  ].join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

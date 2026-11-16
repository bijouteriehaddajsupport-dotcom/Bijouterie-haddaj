import type { OrderStatus } from "./types";

export const BRAND = {
  name: "Haddaj Bijouterie",
  tagline: "Bijouterie à Casablanca",
  email: "bijouterie.haddaj.support@gmail.com",
};

const U = "https://images.unsplash.com/";

/** Visuels éditoriaux de la page d'accueil (remplaçables par vos propres photos). */
export const EDITORIAL_IMAGES = {
  // Mosaïque de l'accueil : fichiers dans public/images/ (remplacez-les en gardant le même nom)
  hero: ["/images/hero-1.jpg", "/images/hero-2.jpg", "/images/hero-3.jpg", "/images/hero-4.jpg"],
  editorial: "/images/editorial.jpg",
  atelier: `${U}photo-1601121141461-9d6647bca1ed`,
  auth: `${U}photo-1600721391776-b5cd0e0048f9`,
  admin: `${U}photo-1543294001-f7cd5d7fb516`,
};

/** Réseaux sociaux : renseignez vos liens pour les afficher dans le pied de page. */
export const SOCIAL_LINKS: { label: string; href: string; icon: "instagram" | "facebook" | "tiktok" | "whatsapp" }[] = [
  { label: "Instagram", href: "https://www.instagram.com/bijouteriehaddaj/", icon: "instagram" },
  { label: "Facebook", href: "https://www.facebook.com/share/1KXZUkQJgo/", icon: "facebook" },
  { label: "TikTok", href: "", icon: "tiktok" },
  { label: "WhatsApp", href: "https://wa.me/212671882274", icon: "whatsapp" },
];

/** Boutique physique */
const STORE_ADDRESS = "Kissariat El Hafari, rue Ssamayrin N° 59 bis, Derb Sultan, Casablanca";

export const STORE = {
  tagline: "Bijoux en or au cœur de Derb Sultan",
  instagramHandle: "@bijouteriehaddaj",
  storeName: "Haddaj Bijouterie",
  addressLine1: "Kissariat El Hafari, rue Ssamayrin N° 59 bis",
  addressLine2: "Derb Sultan, Casablanca",
  hours: "10h30 – 19h30",
  closed: "",
  contactName: "Rachid",
  phone: "06 71 88 22 74",
  phoneHref: "tel:+212671882274",
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`,
  mapsEmbed: `https://www.google.com/maps?q=${encodeURIComponent(STORE_ADDRESS)}&output=embed`,
};


export const SORT_OPTIONS = [
  { value: "", label: "Recommandés" },
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
] as const;

export const ORDER_STATUSES: Record<OrderStatus, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "bg-or-100 text-or-800 ring-or-300" },
  confirmed: { label: "Confirmée", tone: "bg-bordeaux-50 text-bordeaux-700 ring-bordeaux-200" },
  postponed: { label: "Reportée", tone: "bg-sky-50 text-sky-800 ring-sky-200" },
  shipped: { label: "Expédiée", tone: "bg-sable text-encre ring-or-200" },
  delivered: { label: "Livrée", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  cancelled: { label: "Annulée", tone: "bg-neutral-100 text-neutral-600 ring-neutral-300" },
};

export const GIFT_PRICE_LIMIT = 5000;

import { EDITORIAL_IMAGES } from "./constants";

/** Une photo du site : son adresse + le point à garder au centre du cadrage (en %). */
export type SiteImage = { url: string; x: number; y: number };

export type SlotKey = "hero1" | "hero2" | "hero3" | "hero4" | "editorial";
export type HomeImages = Record<SlotKey, SiteImage>;

/** Un cadre d'affichage réel (largeur × hauteur en px) pour l'aperçu dans l'admin. */
export type Frame = { label: string; w: number; h: number };

/**
 * Emplacements modifiables dans Admin → Photos du site, avec les dimensions des cadres
 * tels qu'ils apparaissent sur la boutique (ordinateur 1440 px, téléphone 390 px).
 */
export const IMAGE_SLOTS: { key: SlotKey; title: string; where: string; frames: Frame[] }[] = [
  {
    key: "hero1",
    title: "Grande photo",
    where: "Accueil, mosaïque : grande photo à gauche",
    frames: [
      { label: "Ordinateur", w: 520, h: 600 },
      { label: "Téléphone", w: 230, h: 440 },
    ],
  },
  {
    key: "hero2",
    title: "Petite photo 1",
    where: "Accueil, mosaïque : en haut à droite",
    frames: [
      { label: "Ordinateur", w: 254, h: 192 },
      { label: "Téléphone", w: 108, h: 138 },
    ],
  },
  {
    key: "hero3",
    title: "Petite photo 2",
    where: "Accueil, mosaïque : au milieu à droite",
    frames: [
      { label: "Ordinateur", w: 254, h: 192 },
      { label: "Téléphone", w: 108, h: 138 },
    ],
  },
  {
    key: "hero4",
    title: "Petite photo 3 « Nouveautés »",
    where: "Accueil, mosaïque : en bas à droite (lien vers les nouveautés)",
    frames: [
      { label: "Ordinateur", w: 254, h: 192 },
      { label: "Téléphone", w: 108, h: 138 },
    ],
  },
  {
    key: "editorial",
    title: "Photo du bandeau",
    where: "Accueil : fond du bandeau noir « Acheter en toute confiance » · page Notre boutique",
    frames: [
      { label: "Bandeau (ordinateur)", w: 640, h: 200 },
      { label: "Bandeau (téléphone)", w: 175, h: 380 },
      { label: "Notre boutique", w: 320, h: 240 },
    ],
  },
];

export const DEFAULT_HOME_IMAGES: HomeImages = {
  hero1: { url: EDITORIAL_IMAGES.hero[0], x: 50, y: 50 },
  hero2: { url: EDITORIAL_IMAGES.hero[1], x: 50, y: 50 },
  hero3: { url: EDITORIAL_IMAGES.hero[2], x: 50, y: 50 },
  hero4: { url: EDITORIAL_IMAGES.hero[3], x: 50, y: 50 },
  editorial: { url: EDITORIAL_IMAGES.editorial, x: 50, y: 50 },
};

const clamp = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50);

/** Fusionne les réglages enregistrés avec les valeurs par défaut (champs manquants ou invalides ignorés). */
export function normalizeHomeImages(value: unknown): HomeImages {
  const v = (value && typeof value === "object" ? value : {}) as Partial<Record<SlotKey, Partial<SiteImage>>>;
  const out = { ...DEFAULT_HOME_IMAGES };
  for (const { key } of IMAGE_SLOTS) {
    const s = v[key];
    if (s && typeof s.url === "string" && (s.url.startsWith("https://") || s.url.startsWith("/images/"))) {
      out[key] = { url: s.url, x: clamp(s.x), y: clamp(s.y) };
    }
  }
  return out;
}

/** Valeur CSS object-position du cadrage choisi. */
export const focus = (img: SiteImage) => `${img.x}% ${img.y}%`;

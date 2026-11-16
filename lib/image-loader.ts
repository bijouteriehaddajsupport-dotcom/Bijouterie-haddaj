"use client";

type LoaderArgs = { src: string; width: number; quality?: number };

/** Photos du stockage Supabase : passées par le redimensionnement automatique (WebP léger, plan Pro). */
const SUPABASE_PUBLIC = "/storage/v1/object/public/";
const SUPABASE_RENDER = "/storage/v1/render/image/public/";

export default function imageLoader({ src, width, quality }: LoaderArgs) {
  if (src.startsWith("https://images.unsplash.com")) {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality || 75));
    return url.toString();
  }
  // Ex. 2,2 Mo en PNG → ~10 Ko en WebP pour une vignette : divise la bande passante Supabase
  if (src.includes(".supabase.co" + SUPABASE_PUBLIC)) {
    const url = new URL(src.replace(SUPABASE_PUBLIC, SUPABASE_RENDER));
    url.searchParams.set("width", String(Math.min(width, 2000)));
    url.searchParams.set("quality", String(quality || 70));
    url.searchParams.set("resize", "contain");
    return url.toString();
  }
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}w=${width}`;
}

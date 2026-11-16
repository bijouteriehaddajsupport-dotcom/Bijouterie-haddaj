"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { META_PIXEL_ID, trackPixel } from "@/lib/meta-pixel";

/** Envoie « PageView » à chaque changement de page (navigation sans rechargement). */
function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    // La première page vue est envoyée par le script d'initialisation
    if (first.current) {
      first.current = false;
      return;
    }
    trackPixel("PageView");
  }, [pathname, searchParams]);

  return null;
}

/** Contact : chaque clic vers WhatsApp, le téléphone, Instagram ou l'itinéraire de la boutique. */
function ContactClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest("a");
      const href = link?.getAttribute("href") ?? "";
      if (href.includes("wa.me")) trackPixel("Contact", { method: "whatsapp" });
      else if (href.startsWith("tel:")) trackPixel("Contact", { method: "telephone" });
      else if (href.includes("instagram.com")) trackPixel("Contact", { method: "instagram" });
      else if (href.includes("google.com/maps") || href.includes("maps.app.goo.gl")) trackPixel("FindLocation");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

/** Meta Pixel : chargé après l'affichage de la page, uniquement sur la boutique (pas dans l'admin). */
export function MetaPixel() {
  if (!META_PIXEL_ID) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
      <ContactClicks />
    </>
  );
}

/** Déclenche un événement une seule fois à l'affichage (ex. fiche produit, confirmation de commande). */
export function PixelEvent({ event, params, eventID, onceKey }: { event: string; params?: Record<string, unknown>; eventID?: string; onceKey?: string }) {
  useEffect(() => {
    // onceKey : évite de renvoyer l'achat si la cliente recharge la page de confirmation
    if (onceKey) {
      try {
        if (sessionStorage.getItem(onceKey)) return;
        sessionStorage.setItem(onceKey, "1");
      } catch {}
    }
    // Petit délai : laisse le temps au script du Pixel de s'initialiser
    const id = window.setTimeout(() => trackPixel(event, params, eventID ? { eventID } : undefined), 600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

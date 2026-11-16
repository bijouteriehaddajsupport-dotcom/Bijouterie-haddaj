import type { Metadata, Viewport } from "next";
import { DM_Sans, Great_Vibes, Marcellus } from "next/font/google";
import "./globals.css";

// Capitales classiques, dans l'esprit du logo « HADDAJ »
const serif = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Calligraphie du « H » du logo
const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Haddaj Bijouterie — Bijoux en or à Casablanca",
    template: "%s | Haddaj Bijouterie",
  },
  description:
    "Haddaj Bijouterie, Derb Sultan, Casablanca : bagues, colliers, bracelets et parures en or. Commande en ligne et paiement à la livraison.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Haddaj Bijouterie",
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}

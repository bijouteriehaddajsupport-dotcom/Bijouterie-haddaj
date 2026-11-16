import { ArrowRight, Banknote, Clock, Gem, MapPin, MessageCircle, Phone, Store, Truck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LogoFull } from "@/components/ui/Logo";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { EDITORIAL_IMAGES, SOCIAL_LINKS, STORE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Notre boutique",
  description: "Haddaj Bijouterie : bijouterie à Derb Sultan, Casablanca. Adresse, horaires, téléphone et services.",
};

const SERVICES = [
  { icon: Banknote, title: "Paiement à la livraison", text: "Vous réglez votre commande uniquement à sa réception." },
  { icon: Truck, title: "Livraison au Maroc", text: "Nous expédions votre bijou jusqu'à votre porte." },
  { icon: Store, title: "Essayage en boutique", text: "Venez voir et essayer les bijoux à Derb Sultan avant d'acheter." },
  { icon: MessageCircle, title: "Conseil sur WhatsApp", text: "Photos, tailles, disponibilités : posez-nous vos questions." },
  { icon: Gem, title: "Bijoux en or", text: "Bagues, colliers, bracelets, boucles et parures pour chaque occasion." },
  { icon: Phone, title: "Commande par téléphone", text: `Appelez ${STORE.contactName} au ${STORE.phone} pour commander.` },
];

export default function MaisonPage() {
  const whatsapp = SOCIAL_LINKS.find((s) => s.icon === "whatsapp")?.href;
  return (
    <>
      {/* En-tête : logo + présentation */}
      <section className="container grid items-center gap-10 py-12 md:py-20 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="inline-flex items-center gap-2 rounded-full bg-champagne px-4 py-2 text-[12px] font-semibold text-bordeaux-800">
            <MapPin className="h-3.5 w-3.5 text-or-600" /> Derb Sultan, Casablanca
          </p>
          <h1 className="display mt-6 text-[42px] text-bordeaux-900 md:text-[60px]">Notre boutique</h1>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-taupe">
            Haddaj Bijouterie vous accueille à la Kissariat El Hafari, au cœur de Derb Sultan. Retrouvez sur place et en ligne nos
            bagues, colliers, bracelets et parures en or, et faites-vous conseiller pour trouver le bijou qui vous ressemble.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/boutique" className="btn-primary">
              Voir les bijoux <ArrowRight className="h-4 w-4" />
            </Link>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> WhatsApp
              </a>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-bordeaux-50">
            <Image src={EDITORIAL_IMAGES.editorial} alt="Bijou en or porté" fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-6 left-6 rounded-2xl bg-white p-4 shadow-xl shadow-black/10">
            <LogoFull className="w-[84px]" />
          </div>
        </Reveal>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-32 bg-ivoire py-16 md:py-24">
        <div className="container">
          <h2 className="display text-[32px] text-bordeaux-900 md:text-[44px]">Nos services</h2>
          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, text }) => (
              <RevealItem key={title} className="rounded-2xl bg-white p-6 ring-1 ring-sable">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-champagne text-or-700">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold text-bordeaux-900">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-taupe">{text}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Adresse + plan */}
      <section id="boutique" className="container scroll-mt-32 py-16 md:py-24">
        <div className="grid overflow-hidden rounded-[2rem] bg-bordeaux-950 text-white lg:grid-cols-2">
          <div className="p-8 md:p-14">
            <p className="eyebrow text-or-300">Visitez-nous</p>
            <h2 className="display mt-4 text-[32px] md:text-[42px]">{STORE.storeName}</h2>
            <ul className="mt-8 space-y-5 text-[15px] text-white/80">
              <li className="flex gap-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-or-300" strokeWidth={1.6} />
                <span>
                  {STORE.addressLine1}
                  <br />
                  {STORE.addressLine2}
                </span>
              </li>
              <li className="flex gap-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-or-300" strokeWidth={1.6} />
                <span>Ouvert de {STORE.hours}</span>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-or-300" strokeWidth={1.6} />
                <a href={STORE.phoneHref} className="tabular-nums hover:text-white">
                  {STORE.contactName} · {STORE.phone}
                </a>
              </li>
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-gold">
                Itinéraire
              </a>
              <a href={STORE.phoneHref} className="btn-outline-light">
                <Phone className="h-4 w-4" /> Appeler
              </a>
            </div>
          </div>
          <iframe
            src={STORE.mapsEmbed}
            title="Plan d'accès à Haddaj Bijouterie, Derb Sultan, Casablanca"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[360px] w-full border-0 lg:h-full lg:min-h-[520px]"
          />
        </div>
      </section>

      {/* Entretien */}
      <section id="entretien" className="container scroll-mt-32 pb-20 md:pb-28">
        <div className="rounded-[2rem] bg-champagne p-8 md:p-14">
          <h2 className="display text-[28px] text-bordeaux-900 md:text-[36px]">Prendre soin de vos bijoux</h2>
          <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-taupe">
            Rangez chaque bijou séparément pour éviter les rayures. Retirez-les avant le sport, la douche ou l&apos;application de
            parfum. Nettoyez l&apos;or avec de l&apos;eau tiède savonneuse et une brosse douce, puis séchez avec un chiffon doux.
          </p>
        </div>
      </section>
    </>
  );
}

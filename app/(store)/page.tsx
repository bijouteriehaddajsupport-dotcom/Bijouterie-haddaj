import { ArrowRight, Banknote, Clock, Gem, MapPin, MessageCircle, Phone, Store, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductCarousel } from "@/components/ui/ProductCarousel";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { SOCIAL_LINKS, STORE } from "@/lib/constants";
import { getBestSellers, getCollections, getHomeImages, getNewArrivals } from "@/lib/data";
import { imageStyle } from "@/lib/site-images";

export const revalidate = 3600;

const PERKS = [
  { icon: Banknote, title: "Paiement à la livraison", text: "Vous payez à la réception de votre bijou." },
  { icon: Truck, title: "Livraison au Maroc", text: "Votre commande arrive jusqu'à votre porte." },
  { icon: Store, title: "Boutique à Derb Sultan", text: "Venez voir et essayer nos bijoux sur place." },
  { icon: MessageCircle, title: "Conseil personnalisé", text: "Une question ? Appelez-nous ou écrivez sur WhatsApp." },
];

export default async function HomePage() {
  const [bestSellers, newest, collections, photos] = await Promise.all([getBestSellers(10), getNewArrivals(8), getCollections(), getHomeImages()]);
  const whatsapp = SOCIAL_LINKS.find((s) => s.icon === "whatsapp")?.href;
  const { hero1: h1, hero2: h2, hero3: h3, hero4: h4, editorial } = photos;

  return (
    <>
      {/* 1. Accueil en deux parties : texte à gauche, mosaïque de photos à droite */}
      <section className="container grid items-center gap-10 pb-16 pt-8 md:pt-12 lg:grid-cols-12 lg:gap-14 lg:pb-24">
        <Reveal className="lg:col-span-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-champagne px-4 py-2 text-[12px] font-semibold text-bordeaux-800">
            <Gem className="h-3.5 w-3.5 text-or-600" /> Bijouterie à Casablanca
          </p>
          <h1 className="display mt-6 text-[44px] text-bordeaux-900 sm:text-[56px] lg:text-[68px]">
            L&apos;or qui vous <span className="font-script text-[1.2em] font-normal tracking-normal text-or-600">ressemble</span>
          </h1>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-taupe">
            Bagues, colliers, bracelets et parures choisis avec soin. Commandez en ligne en quelques secondes et payez à la livraison,
            ou passez nous voir à Derb Sultan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/boutique" className="btn-primary">
              Voir les bijoux <ArrowRight className="h-4 w-4" />
            </Link>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> Nous écrire
              </a>
            )}
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-2 gap-4 border-t border-sable pt-6">
            <div>
              <dt className="text-[12px] text-taupe">Ouvert</dt>
              <dd className="mt-1 text-[15px] font-semibold text-bordeaux-900">{STORE.hours}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-taupe">Paiement</dt>
              <dd className="mt-1 text-[15px] font-semibold text-bordeaux-900">À la livraison</dd>
            </div>
          </dl>
        </Reveal>

        <RevealGroup className="grid h-[440px] grid-cols-6 grid-rows-6 gap-3 sm:h-[540px] lg:col-span-7 lg:h-[600px]">
          <RevealItem className="relative col-span-4 row-span-6 overflow-hidden rounded-3xl bg-bordeaux-50">
            <Image src={h1.url} alt="Bijou en or porté" fill priority sizes="(min-width:1024px) 38vw, 66vw" className="object-cover" style={imageStyle(h1)} />
          </RevealItem>
          <RevealItem className="relative col-span-2 row-span-2 overflow-hidden rounded-3xl bg-bordeaux-50">
            <Image src={h2.url} alt="Bijou en or" fill sizes="(min-width:1024px) 19vw, 33vw" className="object-cover" style={imageStyle(h2)} />
          </RevealItem>
          <RevealItem className="relative col-span-2 row-span-2 overflow-hidden rounded-3xl bg-bordeaux-50">
            <Image src={h3.url} alt="Bijou en or" fill sizes="(min-width:1024px) 19vw, 33vw" className="object-cover" style={imageStyle(h3)} />
          </RevealItem>
          <RevealItem className="relative col-span-2 row-span-2 overflow-hidden rounded-3xl bg-bordeaux-900">
            <Image src={h4.url} alt="Nouveautés" fill sizes="(min-width:1024px) 19vw, 33vw" className="object-cover opacity-80" style={imageStyle(h4)} />
            <Link href="/boutique?tri=nouveautes" className="absolute inset-0 flex items-end p-4 text-[13px] font-semibold text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                Nouveautés <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </RevealItem>
        </RevealGroup>
      </section>

      {/* 2. Collections en vignettes rondes */}
      {collections.length > 0 && (
        <section className="border-y border-sable bg-ivoire py-12 md:py-16">
          <div className="container">
            <div className="flex items-end justify-between gap-6">
              <h2 className="display text-[28px] text-bordeaux-900 md:text-[36px]">Nos collections</h2>
              <Link href="/collections" className="link-underline text-bordeaux-900">
                Tout voir
              </Link>
            </div>
            <ul className="scrollbar-none -mx-5 mt-8 flex gap-5 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:justify-center md:gap-10 md:px-0">
              {collections.map((c) => (
                <li key={c.id} className="shrink-0">
                  <Link href={`/collections/${c.slug}`} className="group flex w-[104px] flex-col items-center text-center md:w-[132px]">
                    <span className="relative block h-[104px] w-[104px] overflow-hidden rounded-full bg-white ring-1 ring-sable transition-all duration-500 group-hover:ring-2 group-hover:ring-or-500 md:h-[132px] md:w-[132px]">
                      {c.image_url ? (
                        <Image src={c.image_url} alt="" fill sizes="132px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <span className="flex h-full items-center justify-center font-script text-4xl text-or-500">H</span>
                      )}
                    </span>
                    <span className="mt-3 text-[14px] font-semibold text-bordeaux-900">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 3. Nouveautés en grille (ordre réglé dans Admin → Page d'accueil) */}
      {newest.length > 0 && (
        <section className="container py-16 md:py-24">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-or-700">Nouveautés</p>
              <h2 className="display mt-3 text-[32px] text-bordeaux-900 md:text-[44px]">Fraîchement arrivés</h2>
            </div>
            <Link href="/boutique?tri=nouveautes" className="btn-outline self-start md:self-auto">
              Toutes les nouveautés <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <RevealGroup className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {newest.map((p, i) => (
              <RevealItem key={p.id}>
                <ProductCard product={p} priority={i < 4} sizes="(min-width:1024px) 24vw, (min-width:768px) 33vw, 50vw" />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

      {/* 4. Bandeau noir : nos engagements */}
      <section className="container">
        <div className="relative overflow-hidden rounded-[2rem] bg-bordeaux-950 text-white">
          <Image src={editorial.url} alt="" fill sizes="100vw" className="object-cover opacity-25" style={imageStyle(editorial)} />
          <div className="relative grid gap-10 p-8 md:p-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <p className="eyebrow text-or-300">Haddaj Bijouterie</p>
              <h2 className="display mt-4 text-[32px] md:text-[42px]">Acheter en toute confiance</h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              {PERKS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-or-400 text-bordeaux-950">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold">{title}</span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-white/65">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Les plus vendus (produits cochés « Meilleure vente » dans l'admin) */}
      {bestSellers.length > 0 && (
        <section className="container py-16 md:py-24">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-or-700">Les plus vendus</p>
              <h2 className="display mt-3 text-[32px] text-bordeaux-900 md:text-[44px]">Les préférés de nos clientes</h2>
            </div>
          </div>
          <Reveal className="mt-10">
            <ProductCarousel products={bestSellers} label="Les plus vendus" />
          </Reveal>
        </section>
      )}

      {/* 6. La boutique : adresse, horaires, téléphone et plan */}
      <section className="container pb-20 md:pb-28">
        <div className="grid overflow-hidden rounded-[2rem] bg-champagne lg:grid-cols-2">
          <div className="p-8 md:p-14">
            <p className="eyebrow text-or-700">Notre boutique</p>
            <h2 className="display mt-4 text-[32px] text-bordeaux-900 md:text-[42px]">Venez nous rendre visite</h2>
            <ul className="mt-8 space-y-5 text-[15px] text-encre">
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-or-700">
                  <MapPin className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </span>
                <span>
                  {STORE.addressLine1}
                  <br />
                  {STORE.addressLine2}
                </span>
              </li>
              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-or-700">
                  <Clock className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </span>
                Ouvert de {STORE.hours}
              </li>
              <li className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-or-700">
                  <Phone className="h-[18px] w-[18px]" strokeWidth={1.7} />
                </span>
                <a href={STORE.phoneHref} className="font-semibold tabular-nums hover:text-or-700">
                  {STORE.contactName} · {STORE.phone}
                </a>
              </li>
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Itinéraire <ArrowRight className="h-4 w-4" />
              </a>
              <a href={STORE.phoneHref} className="btn-outline">
                <Phone className="h-4 w-4" /> Appeler
              </a>
            </div>
          </div>
          <iframe
            src={STORE.mapsEmbed}
            title="Plan d'accès à Haddaj Bijouterie, Derb Sultan, Casablanca"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[340px] w-full border-0 lg:h-full lg:min-h-[480px]"
          />
        </div>
      </section>
    </>
  );
}

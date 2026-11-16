import { Flame } from "lucide-react";
import { Guarantees } from "@/components/shop/Guarantees";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart, PhotoOrderButton } from "@/components/shop/AddToCart";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { PixelEvent } from "@/components/site/MetaPixel";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { AccordionItem } from "@/components/ui/Accordion";
import { ProductCarousel } from "@/components/ui/ProductCarousel";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getProduct, getProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { getPromo, SHIPPING_FEE } from "@/lib/pricing";

export const revalidate = 3600;

// Fiches générées à la première visite puis gardées en cache (au lieu d'être recalculées à chaque visite)
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Création introuvable" };
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  let related = product.collection_id ? await getProducts({ collectionId: product.collection_id, excludeId: product.id, limit: 10 }) : [];
  if (related.length < 4) related = [...related, ...(await getProducts({ featured: true, excludeId: product.id, limit: 8 }))].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i);

  const promo = getPromo(product.price, product.compare_at_price);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    brand: { "@type": "Brand", name: "Haddaj Bijouterie" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: process.env.NEXT_PUBLIC_CURRENCY || "MAD",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <PixelEvent
        event="ViewContent"
        params={{
          content_name: product.name,
          content_category: product.collection?.name,
          value: product.price,
          currency: process.env.NEXT_PUBLIC_CURRENCY || "MAD",
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container flex items-start justify-between gap-3 pt-6 md:pt-10">
        <Breadcrumbs
          items={[
            product.collection
              ? { label: product.collection.name, href: `/collections/${product.collection.slug}` }
              : { label: "Bijoux", href: "/boutique" },
            { label: product.name },
          ]}
        />
        {/* Matière (réglable par produit dans l'admin, « ذهب عيار 18 » par défaut) */}
        <span
          dir="auto"
          className="mt-3 shrink-0 whitespace-nowrap rounded-full bg-champagne px-4 py-1.5 text-[13px] font-semibold text-or-800 md:mt-1"
        >
          {product.material || "ذهب عيار 18"}
        </span>
      </div>

      <section className="container grid gap-10 py-8 md:py-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} name={product.name} overlay={product.stock > 0 ? <PhotoOrderButton /> : undefined} />
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <Reveal y={16}>
              {product.is_featured && (
                <p className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-or-500 text-bordeaux-950" title="Meilleure vente">
                  <Flame className="h-4 w-4" strokeWidth={2} aria-hidden />
                  <span className="sr-only">Meilleure vente</span>
                </p>
              )}
              {product.collection && (
                <Link href={`/collections/${product.collection.slug}`} className="text-[12px] font-semibold uppercase tracking-[0.18em] text-or-700 hover:text-or-600">
                  {product.collection.name}
                </Link>
              )}
              <h1 className="mt-2 font-serif text-[34px] font-light leading-tight text-bordeaux-900 md:text-[44px]">{product.name}</h1>
              <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2 tabular-nums">
                {promo && (
                  <span className="text-[17px] text-taupe line-through decoration-taupe/70">
                    <span className="sr-only">Prix initial : </span>
                    {formatPrice(product.compare_at_price)}
                  </span>
                )}
                <span className={promo ? "text-[24px] font-medium text-bordeaux-700" : "text-[22px] text-encre"}>
                  {promo && <span className="sr-only">Prix promotionnel : </span>}
                  {formatPrice(product.price)}
                </span>
                {promo && (
                  <span className="self-center bg-bordeaux-900 px-2.5 py-1 text-[12px] font-semibold tracking-wide text-or-200">−{promo.percent} %</span>
                )}
              </div>
              {promo && <p className="mt-2 text-[13px] text-or-700">Vous économisez {formatPrice(promo.amount)}</p>}
              <div className="my-8 h-px bg-sable" />
              <AddToCart product={product} />

              <Guarantees className="mt-8" freeShipping={product.free_shipping !== false} />

              <div className="mt-10 border-t border-sable">
                <AccordionItem title="Description" defaultOpen>
                  <p>{product.description}</p>
                </AccordionItem>
                {product.details && (
                  <AccordionItem title="Détails de la création">
                    <ul className="space-y-2">
                      {product.details.split("\n").filter(Boolean).map((line) => (
                        <li key={line} className="flex gap-3">
                          <span className="mt-2.5 h-px w-3 shrink-0 bg-or-500" aria-hidden />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </AccordionItem>
                )}
                <AccordionItem title="Livraison, échange & retour">
                  <p>
                    {product.free_shipping === false ? `Livraison en moins de 24 h pour ${SHIPPING_FEE} MAD` : "Livraison offerte en moins de 24 h"}, avec paiement à la
                    réception.
                  </p>
                  <p className="mt-3">
                    Pour un échange ou un retour, contactez-nous sur WhatsApp au{" "}
                    <a href="https://wa.me/212671882274" target="_blank" rel="noopener noreferrer" className="text-bordeaux-900 underline underline-offset-4">
                      06 71 88 22 74
                    </a>
                    .
                  </p>
                </AccordionItem>
                <AccordionItem title="Entretien">
                  <p>
                    Rangez votre bijou dans son écrin, à l&apos;abri des chocs. Évitez le contact avec les parfums et l&apos;eau. Un nettoyage
                    doux avec un chiffon sec suffit à préserver son éclat.
                  </p>
                </AccordionItem>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container border-t border-sable py-20 md:py-24">
          <SectionHeading eyebrow="Vous aimerez aussi" title="Créations similaires" />
          <Reveal className="mt-12">
            <ProductCarousel products={related} label="Créations similaires" />
          </Reveal>
        </section>
      )}
    </>
  );
}

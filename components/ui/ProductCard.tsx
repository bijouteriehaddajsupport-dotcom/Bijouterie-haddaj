import { Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getPromo } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/cn";
import { QuickAdd } from "./QuickAdd";

type ProductCardProps = {
  product: Product;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/** Carte produit moderne : photo arrondie sur fond gris clair, infos alignées à gauche, étiquettes en pastilles. */
export function ProductCard({ product, priority, sizes = "(min-width:1280px) 22vw, (min-width:768px) 33vw, 50vw", className }: ProductCardProps) {
  const [main, hover] = product.images;
  const soldOut = product.stock <= 0;
  const promo = getPromo(product.price, product.compare_at_price);
  const href = `/produit/${product.slug}`;

  return (
    <div className={cn("group relative", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-bordeaux-50">
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0 block cursor-pointer">
          {main ? (
            <Image
              src={main}
              alt={product.name}
              fill
              priority={priority}
              sizes={sizes}
              className={cn("object-cover transition-all duration-700 ease-luxe group-hover:scale-[1.05]", hover && "group-hover:opacity-0")}
            />
          ) : (
            <div className="flex h-full items-center justify-center font-script text-5xl text-or-500">H</div>
          )}
          {hover && (
            <Image
              src={hover}
              alt=""
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-all duration-700 ease-luxe group-hover:scale-[1.05] group-hover:opacity-100"
            />
          )}
          <div className="pointer-events-none absolute left-3 right-3 top-3 flex flex-wrap items-center gap-1.5">
            {soldOut && <span className="rounded-full bg-bordeaux-900 px-3 py-1 text-[11px] font-semibold text-white">Épuisé</span>}
            {promo && !soldOut && <span className="rounded-full bg-or-400 px-2.5 py-1 text-[11px] font-bold tabular-nums text-bordeaux-950">−{promo.percent} %</span>}
            {product.is_new && !soldOut && <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-bordeaux-900 shadow-sm">Nouveau</span>}
            {product.is_featured && !soldOut && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bordeaux-900 text-or-300" title="Meilleure vente">
                <Flame className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                <span className="sr-only">Meilleure vente</span>
              </span>
            )}
          </div>
        </Link>
        <QuickAdd product={product} />
      </div>
      <Link href={href} className="relative block cursor-pointer pb-2 pt-3.5">
        {product.collection && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-or-700">{product.collection.name}</p>}
        <h3 className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-encre md:text-[15px]">{product.name}</h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className={cn("text-[15px] font-semibold", promo ? "text-or-700" : "text-bordeaux-900")}>
            {promo && <span className="sr-only">Prix promotionnel : </span>}
            {formatPrice(product.price)}
          </span>
          {promo && (
            <span className="text-[13px] text-taupe line-through decoration-taupe/70">
              <span className="sr-only">Prix initial : </span>
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </p>
      </Link>
    </div>
  );
}

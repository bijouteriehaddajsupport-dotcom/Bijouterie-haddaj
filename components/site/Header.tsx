"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { trackPixel } from "@/lib/meta-pixel";
import { CART_BUMP_EVENT } from "@/components/ui/QuickAdd";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { useEscape, useLockBody } from "@/lib/hooks";
import type { Collection } from "@/lib/types";

type NavCollection = Pick<Collection, "name" | "slug" | "image_url">;

const EASE = [0.22, 1, 0.36, 1] as const;

/** En-tête : la navigation affiche uniquement les collections gérées depuis l'admin. */
export function Header({ collections }: { collections: NavCollection[] }) {
  const pathname = usePathname();
  const { count, ready, open: openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bump, setBump] = useState(0);

  // Rebond de l'icône panier quand un produit y « atterrit » (ajout rapide)
  useEffect(() => {
    const onBump = () => setBump((n) => n + 1);
    window.addEventListener(CART_BUMP_EVENT, onBump);
    return () => window.removeEventListener(CART_BUMP_EVENT, onBump);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const closeAll = useCallback(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, []);
  useEscape(closeAll);
  useLockBody(mobileOpen || searchOpen);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl transition-all duration-500",
          scrolled ? "border-sable shadow-[0_10px_30px_-24px_rgba(0,0,0,0.5)]" : "border-transparent"
        )}
      >
        <div className={cn("container flex items-center gap-4 transition-[height] duration-500 ease-luxe", scrolled ? "h-16" : "h-16 lg:h-[84px]")}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="-ml-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-bordeaux-900 hover:bg-champagne lg:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={1.6} />
          </button>

          {/* Logo à gauche */}
          <Link href="/" aria-label="Haddaj Bijouterie — accueil" className="shrink-0">
            <Logo compact={scrolled} />
          </Link>

          {/* Collections au centre (desktop) */}
          <nav aria-label="Collections" className="hidden min-w-0 flex-1 justify-center lg:flex">
            <ul className="scrollbar-none flex items-center gap-1 overflow-x-auto rounded-full bg-champagne/70 p-1">
              <li className="shrink-0">
                <Link
                  href="/boutique"
                  aria-current={pathname === "/boutique" ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center rounded-full px-4 text-[13px] font-medium transition-colors",
                    pathname === "/boutique" ? "bg-bordeaux-900 text-white" : "text-bordeaux-800 hover:bg-white"
                  )}
                >
                  Tout voir
                </Link>
              </li>
              {collections.map((c) => {
                const href = `/collections/${c.slug}`;
                const current = pathname === href;
                return (
                  <li key={c.slug} className="shrink-0">
                    <Link
                      href={href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors",
                        current ? "bg-bordeaux-900 text-white" : "text-bordeaux-800 hover:bg-white"
                      )}
                    >
                      {c.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Actions à droite */}
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-bordeaux-900 transition-colors hover:bg-champagne"
            >
              <Search className="h-[19px] w-[19px]" strokeWidth={1.6} />
            </button>
            <Link href="/compte" aria-label="Mon compte" className="hidden h-11 w-11 items-center justify-center rounded-full text-bordeaux-900 transition-colors hover:bg-champagne sm:flex">
              <User className="h-[19px] w-[19px]" strokeWidth={1.6} />
            </Link>
            <button
              type="button"
              id="header-cart"
              onClick={openCart}
              aria-label={`Panier${ready && count ? `, ${count} article${count > 1 ? "s" : ""}` : ""}`}
              className="ml-1 flex h-11 cursor-pointer items-center gap-2 rounded-full bg-bordeaux-900 pl-3.5 pr-3 text-white transition-colors hover:bg-or-600"
            >
              <motion.span
                key={bump}
                initial={bump ? { scale: 1 } : false}
                animate={bump ? { scale: [1, 1.35, 0.9, 1.1, 1] } : undefined}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="flex"
              >
                <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
              </motion.span>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-or-400 px-1.5 text-[12px] font-semibold tabular-nums text-bordeaux-950">
                {ready ? count : 0}
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} collections={collections} pathname={pathname} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} collections={collections} />
    </>
  );
}

function MobileMenu({
  open,
  onClose,
  collections,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  collections: NavCollection[];
  pathname: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bordeaux-950/50"
          />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%", transition: { duration: 0.25 } }}
            transition={{ duration: 0.45, ease: EASE }}
            className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white"
          >
            <div className="flex h-16 items-center justify-between border-b border-sable px-5">
              <Logo compact />
              <button type="button" onClick={onClose} aria-label="Fermer le menu" className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center text-bordeaux-900">
                <X className="h-5 w-5" strokeWidth={1.4} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="eyebrow mb-2 text-or-700">Nos collections</p>
              <ul>
                {collections.map((c) => {
                  const href = `/collections/${c.slug}`;
                  return (
                    <li key={c.slug} className="border-b border-sable/70">
                      <Link
                        href={href}
                        aria-current={pathname === href ? "page" : undefined}
                        className={cn("flex min-h-[56px] items-center font-serif text-[22px]", pathname === href ? "text-or-700" : "text-bordeaux-900")}
                      >
                        {c.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="space-y-1 border-t border-sable bg-ivoire px-5 py-5">
              <Link href="/maison#boutique" className="flex min-h-[44px] items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em] text-bordeaux-900">
                <MapPin className="h-4 w-4" strokeWidth={1.4} /> Notre boutique
              </Link>
              <Link href="/compte" className="flex min-h-[44px] items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em] text-bordeaux-900">
                <User className="h-4 w-4" strokeWidth={1.4} /> Mon compte
              </Link>
              <Link href="/panier" className="flex min-h-[44px] items-center gap-3 text-[12px] font-medium uppercase tracking-[0.18em] text-bordeaux-900">
                <ShoppingBag className="h-4 w-4" strokeWidth={1.4} /> Mon panier
              </Link>
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );
}

function SearchOverlay({ open, onClose, collections }: { open: boolean; onClose: () => void; collections: NavCollection[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 150);
  }, [open]);

  const go = (q: string) => {
    if (!q.trim()) return;
    trackPixel("Search", { search_string: q.trim() });
    router.push(`/boutique?q=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Recherche">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-bordeaux-950/40" />
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%", transition: { duration: 0.25 } }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative bg-white"
          >
            <div className="container py-6 md:py-12">
              <div className="flex justify-end">
                <button type="button" onClick={onClose} aria-label="Fermer la recherche" className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center text-bordeaux-900">
                  <X className="h-5 w-5" strokeWidth={1.4} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  go(value);
                }}
                className="mx-auto mt-2 flex max-w-3xl items-center gap-4 border-b border-bordeaux-900 pb-3"
                role="search"
              >
                <Search className="h-6 w-6 shrink-0 text-or-700" strokeWidth={1.3} />
                <label htmlFor="site-search" className="sr-only">
                  Rechercher un bijou
                </label>
                <input
                  ref={input}
                  id="site-search"
                  type="search"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Rechercher un bijou, une collection…"
                  className="w-full bg-transparent font-serif text-[26px] text-bordeaux-900 placeholder:text-taupe/50 focus:outline-none md:text-[38px]"
                  autoComplete="off"
                />
              </form>
              {collections.length > 0 && (
                <div className="mx-auto mt-8 max-w-3xl pb-4">
                  <p className="eyebrow mb-4 text-or-700">Nos collections</p>
                  <div className="flex flex-wrap gap-2">
                    {collections.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/collections/${c.slug}`}
                        onClick={onClose}
                        className="inline-flex min-h-[40px] items-center border border-sable px-4 text-[13px] text-encre transition-colors hover:border-bordeaux-900"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

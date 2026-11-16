import { Clock, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { LogoFull } from "@/components/ui/Logo";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { BRAND, SOCIAL_LINKS, STORE } from "@/lib/constants";
import type { Collection } from "@/lib/types";
import { NewsletterForm } from "./NewsletterForm";

const ICONS = { instagram: InstagramIcon, facebook: FacebookIcon, tiktok: TikTokIcon, whatsapp: WhatsAppIcon };

export function Footer({ collections }: { collections: Pick<Collection, "name" | "slug">[] }) {
  const socials = SOCIAL_LINKS.filter((s) => s.href);
  const whatsapp = SOCIAL_LINKS.find((s) => s.icon === "whatsapp")?.href;

  return (
    <footer className="bg-bordeaux-950 text-white">
      <div className="container py-14 md:py-20">
        {/* Bandeau contact rapide */}
        <div className="flex flex-col gap-6 rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="eyebrow text-or-300">Une question sur un bijou ?</p>
            <p className="display mt-3 text-[28px] md:text-[36px]">Appelez {STORE.contactName} ou écrivez-nous</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={STORE.phoneHref} className="btn-gold">
              <Phone className="h-4 w-4" /> {STORE.phone}
            </a>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1EBE5A]">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <LogoFull tone="light" className="w-[120px]" />
            <p className="mt-6 max-w-xs text-[14px] leading-relaxed text-white/60">{STORE.tagline}. Paiement à la livraison et livraison partout au Maroc.</p>
            <div className="mt-6 max-w-sm">
              <p className="mb-3 text-[13px] font-semibold text-white/80">Nouveautés et promotions par e-mail</p>
              <NewsletterForm />
            </div>
          </div>

          <FooterCol title="Boutique" className="lg:col-span-2">
            <FooterLink href="/boutique">Tous les bijoux</FooterLink>
            <FooterLink href="/boutique?tri=nouveautes">Nouveautés</FooterLink>
            <FooterLink href="/boutique?prix=cadeaux">Idées cadeaux</FooterLink>
            <FooterLink href="/collections">Collections</FooterLink>
            <FooterLink href="/maison">Notre boutique</FooterLink>
          </FooterCol>

          <FooterCol title="Collections" className="lg:col-span-3">
            {collections.slice(0, 6).map((c) => (
              <FooterLink key={c.slug} href={`/collections/${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
            <FooterLink href="/compte">Mon compte</FooterLink>
          </FooterCol>

          <FooterCol title="Nous trouver" className="lg:col-span-3">
            <li className="flex gap-3 py-1.5 text-[14px] leading-relaxed text-white/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-or-300" strokeWidth={1.6} />
              <a href={STORE.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {STORE.addressLine1}
                <br />
                {STORE.addressLine2}
              </a>
            </li>
            <li className="flex gap-3 py-1.5 text-[14px] text-white/70">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-or-300" strokeWidth={1.6} />
              <span>
                {STORE.hours}
                {STORE.closed ? ` · ${STORE.closed}` : ""}
              </span>
            </li>
            <li className="flex gap-3 py-1.5 text-[14px] text-white/70">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-or-300" strokeWidth={1.6} />
              <a href={STORE.phoneHref} className="tabular-nums hover:text-white">
                {STORE.contactName} · {STORE.phone}
              </a>
            </li>
          </FooterCol>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-[12px] text-white/50">
            © {new Date().getFullYear()} {BRAND.name}. Tous droits réservés.
          </p>
          {socials.length > 0 && (
            <ul className="flex items-center gap-2">
              {socials.map((s) => {
                const Icon = ICONS[s.icon];
                return (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/80 transition-colors hover:bg-white hover:text-bordeaux-900">
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <h3 className="mb-4 text-[13px] font-semibold text-or-300">{title}</h3>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="inline-flex min-h-[36px] items-center text-[14px] text-white/70 transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  );
}

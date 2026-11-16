"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronDown, CircleUser, LoaderCircle, MapPin, X } from "lucide-react";
import { Guarantees } from "@/components/shop/Guarantees";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { whatsappOrderUrl } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/format";
import { pixelContents, trackPixel } from "@/lib/meta-pixel";
import { shippingFee } from "@/lib/pricing";
import { useEscape, useLockBody } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type OrderLine = {
  productId: string;
  name: string;
  image: string | null;
  price: number;
  compareAt?: number | null;
  quantity: number;
  size?: string | null;
  sizable?: boolean;
  /** Produit sans livraison gratuite (35 DH) */
  paidShipping?: boolean;
};

const SIZES = ["5", "6", "7", "8", "9", "10"];

/**
 * Formulaire de commande express (arabe / français) : nom, adresse, téléphone.
 * Utilisé depuis la fiche produit (« Commander ») et depuis le panier.
 */
export function OrderModal({
  open,
  onClose,
  lines: initialLines,
  onOrdered,
}: {
  open: boolean;
  onClose: () => void;
  lines: OrderLine[];
  /** Appelé après une commande réussie (ex. vider le panier) */
  onOrdered?: () => void;
}) {
  const router = useRouter();
  const [lines, setLines] = useState(initialLines);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptName, setReceiptName] = useState("");
  const [showPrice, setShowPrice] = useState(true);
  const [isGift, setIsGift] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; city?: string; address?: string; phone?: string }>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useLockBody(open);
  useEscape(onClose, open);

  // À chaque ouverture : articles à jour + pré-remplissage si le client est connecté
  useEffect(() => {
    if (!open) return;
    setLines(initialLines);
    trackPixel("InitiateCheckout", pixelContents(initialLines));
    setServerError("");
    window.setTimeout(() => firstField.current?.focus(), 200);
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
      setName((v) => v || profile?.full_name || "");
      setPhone((v) => v || profile?.phone || "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
  const shipping = shippingFee(lines);
  const total = subtotal + shipping;
  const count = lines.reduce((n, l) => n + l.quantity, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const next: typeof errors = {};
    if (!name.trim()) next.name = "الاسم مطلوب / Indiquez votre nom complet.";
    if (!city.trim()) next.city = "المدينة مطلوبة / Indiquez votre ville.";
    if (!address.trim()) next.address = "العنوان مطلوب / Indiquez votre adresse.";
    if (phone.replace(/\D/g, "").length < 8) next.phone = "رقم الهاتف غير صحيح / Numéro de téléphone invalide.";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (!isSupabaseConfigured) {
      setServerError("Mode démo : connectez la base Supabase pour enregistrer les commandes.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await createClient().rpc("place_order", {
      p_customer: {
        full_name: name,
        address,
        phone,
        city,
        email,
        country: "Maroc",
        receipt_name: receiptName,
        show_price_on_receipt: showPrice,
        is_gift: isGift,
      },
      p_items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, size: l.size ?? null })),
    });
    if (error || !data) {
      setSubmitting(false);
      setServerError(error?.message || "La commande n'a pas pu être enregistrée. Veuillez réessayer.");
      return;
    }
    const orderId = (data as { id: string }).id;
    // Met à jour le stock affiché et envoie l'e-mail de confirmation (si adresse donnée)
    await fetch("/api/commande/confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId }),
      keepalive: true,
    }).catch(() => {});
    onOrdered?.();
    router.push(`/commande/${orderId}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-bordeaux-950/55 backdrop-blur-[2px]" />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            {/* En-tête */}
            <div className="flex items-start gap-3 border-b border-sable px-5 py-4">
              <h2 id="order-modal-title" dir="rtl" className="flex-1 text-center text-[15px] font-semibold leading-snug text-bordeaux-900">
                يرجى ملء الاستمارة لإتمام الطلب والدفع عند الاستلام
                <span dir="ltr" className="mt-0.5 block text-[12px] font-normal text-taupe">
                  Remplissez le formulaire pour commander · paiement à la livraison
                </span>
              </h2>
              <button type="button" onClick={onClose} aria-label="Fermer" className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-bordeaux-900">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={submit} noValidate className="flex-1 overflow-y-auto px-5 pb-5">
              {/* Articles */}
              <ul className="divide-y divide-sable border-b border-sable">
                {lines.map((l, i) => (
                  <li key={`${l.productId}-${l.size ?? ""}-${i}`} className="flex items-center gap-3 py-3">
                    <span className="relative h-14 w-14 shrink-0 overflow-visible">
                      <span className="relative block h-14 w-14 overflow-hidden rounded-md bg-[#F6F6F4]">
                        {l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover mix-blend-multiply" />}
                      </span>
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-taupe px-1 text-[11px] font-semibold text-white">
                        {l.quantity}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-encre">{l.name}</span>
                      {l.sizable ? (
                        <span className="relative mt-1 inline-block">
                          <label htmlFor={`om-size-${i}`} className="sr-only">
                            Taille
                          </label>
                          <select
                            id={`om-size-${i}`}
                            value={l.size ?? ""}
                            onChange={(e) => setLines((prev) => prev.map((x, j) => (j === i ? { ...x, size: e.target.value || null } : x)))}
                            className="min-h-[34px] cursor-pointer appearance-none rounded border border-sable bg-white py-1 pl-2 pr-7 text-[12px] text-encre focus:border-bordeaux-900 focus:outline-none"
                          >
                            <option value="">Taille à préciser · المقاس لاحقاً</option>
                            {SIZES.map((s) => (
                              <option key={s} value={s}>
                                Taille {s} · المقاس {s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-or-700" />
                        </span>
                      ) : (
                        l.size && <span className="block text-[12px] text-taupe">Taille {l.size} · المقاس {l.size}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-right text-[14px] font-semibold tabular-nums text-encre">
                      {l.compareAt && l.compareAt > l.price && (
                        <span className="block text-[11px] font-normal text-taupe line-through">{formatPrice(l.compareAt * l.quantity)}</span>
                      )}
                      {formatPrice(l.price * l.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="flex items-center justify-between gap-3 border-b border-sable py-2.5 text-[13px]">
                <span className="text-taupe">
                  Livraison · <span dir="rtl" lang="ar">التوصيل</span>
                </span>
                {shipping > 0 ? (
                  <span className="font-semibold tabular-nums text-encre">{formatPrice(shipping)}</span>
                ) : (
                  <span className="text-or-700">
                    Offerte · <span dir="rtl" lang="ar">مجاني</span>
                  </span>
                )}
              </p>
              {lines.length > 1 && (
                <p className="flex justify-between border-b border-sable py-3 text-[14px]">
                  <span className="text-taupe">Total ({count} articles)</span>
                  <span className="font-semibold tabular-nums text-bordeaux-900">{formatPrice(total)}</span>
                </p>
              )}

              {/* Champs */}
              <div className="mt-5 space-y-4">
                <ModalField id="om-name" ar="الاسم الكامل" fr="Nom complet" icon={<CircleUser className="h-5 w-5" strokeWidth={1.5} />} error={errors.name}>
                  <input
                    ref={firstField}
                    id="om-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="الاسم الكامل / Nom complet"
                    className="min-h-[48px] w-full min-w-0 bg-transparent px-3 text-[16px] text-encre placeholder:text-taupe/60 focus:outline-none"
                  />
                </ModalField>
                <ModalField id="om-city" ar="المدينة" fr="Ville" icon={<Building2 className="h-5 w-5" strokeWidth={1.5} />} error={errors.city}>
                  <input
                    id="om-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    autoComplete="address-level2"
                    placeholder="المدينة / Ville"
                    className="min-h-[48px] w-full min-w-0 bg-transparent px-3 text-[16px] text-encre placeholder:text-taupe/60 focus:outline-none"
                  />
                </ModalField>
                <ModalField id="om-address" ar="العنوان" fr="Adresse" icon={<MapPin className="h-5 w-5" strokeWidth={1.5} />} error={errors.address}>
                  <input
                    id="om-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="street-address"
                    placeholder="العنوان / Adresse"
                    className="min-h-[48px] w-full min-w-0 bg-transparent px-3 text-[16px] text-encre placeholder:text-taupe/60 focus:outline-none"
                  />
                </ModalField>
                <div>
                  <PhoneInput id="om-phone" label="رقم الهاتف / Numéro" value={phone} onChange={setPhone} error={errors.phone} required />
                </div>

                {/* Options du reçu, repliées par défaut */}
                <div className="rounded-md border border-sable">
                  <button
                    type="button"
                    onClick={() => setReceiptOpen((o) => !o)}
                    aria-expanded={receiptOpen}
                    className="flex min-h-[44px] w-full cursor-pointer items-center justify-between px-3 text-[13px] text-encre"
                  >
                    <span className="flex flex-1 items-center justify-between gap-3 pr-2">
                      <span>Options du reçu (facultatif)</span>
                      <span dir="rtl" lang="ar" className="text-taupe">خيارات الوصل (اختياري)</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-or-700 transition-transform ${receiptOpen ? "rotate-180" : ""}`} />
                  </button>
                  {receiptOpen && (
                    <div className="space-y-2 border-t border-sable px-3 pb-3 pt-3">
                      <label htmlFor="om-receipt" className="flex items-baseline justify-between gap-2 text-[12px] text-taupe">
                        <span className="uppercase tracking-[0.12em]">Nom sur le reçu</span>
                        <span dir="rtl" lang="ar" className="text-[13px]">الاسم في الوصل</span>
                      </label>
                      <input id="om-receipt" value={receiptName} onChange={(e) => setReceiptName(e.target.value)} className="field rounded-md" placeholder="الاسم في الوصل / Nom sur le reçu" />
                      <label className="flex min-h-[40px] cursor-pointer items-center gap-3 text-[14px] text-encre">
                        <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="h-5 w-5 shrink-0 accent-bordeaux-900" />
                        <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
                          <span>Afficher le prix sur le reçu</span>
                          <span dir="rtl" lang="ar" className="text-taupe">إظهار السعر في الوصل</span>
                        </span>
                      </label>
                      <label className="flex min-h-[40px] cursor-pointer items-center gap-3 text-[14px] text-encre">
                        <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="h-5 w-5 shrink-0 accent-bordeaux-900" />
                        <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
                          <span>C&apos;est un cadeau</span>
                          <span dir="rtl" lang="ar" className="text-taupe">هذه هدية</span>
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {serverError && (
                <p role="alert" className="mt-4 rounded-md bg-bordeaux-50 px-3 py-2 text-[13px] text-bordeaux-700">
                  {serverError}
                </p>
              )}

              <button type="submit" disabled={submitting || !lines.length} className="btn-primary mt-5 w-full rounded-md bg-bordeaux-900 px-4 text-[13px] tracking-[0.12em] hover:bg-or-600">
                {submitting ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="whitespace-nowrap">
                      Valider<span className="hidden sm:inline"> vos achats</span>
                    </span>
                    <span className="rounded bg-white/10 px-2.5 py-1 text-[13px] font-semibold tabular-nums tracking-normal text-or-200">{formatPrice(total)}</span>
                    <span dir="rtl" lang="ar" className="whitespace-nowrap font-sans text-[15px] font-semibold normal-case tracking-normal">
                      تأكيد الطلب
                    </span>
                  </span>
                )}
              </button>
              <a
                href={whatsappOrderUrl({ lines, shipping, name, city, address, phone })}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex min-h-[44px] w-full items-center justify-between gap-2 rounded-md border border-[#25D366] px-4 text-[13px] font-medium text-[#128C4B] transition-colors hover:bg-[#25D366]/10"
              >
                <span className="inline-flex items-center gap-2">
                  <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                  Commander via WhatsApp
                </span>
                <span dir="rtl" lang="ar" className="font-semibold">
                  اطلب عبر واتساب
                </span>
              </a>
              <Guarantees className="mt-4" freeShipping={shipping === 0} />
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ModalField({ id, ar, fr, icon, error, children }: { id: string; ar: string; fr: string; icon: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px] font-semibold text-encre">
        <span>
          {fr} <span className="text-bordeaux-600">*</span>
        </span>
        <span dir="rtl">{ar}</span>
      </label>
      <div className={`flex overflow-hidden rounded-md border bg-white focus-within:border-bordeaux-900 ${error ? "border-bordeaux-600" : "border-sable"}`}>
        <span className="flex w-12 shrink-0 items-center justify-center border-r border-sable bg-ivoire text-bordeaux-900" aria-hidden>
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-[12px] text-bordeaux-600">
          {error}
        </p>
      )}
    </div>
  );
}

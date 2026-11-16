import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteOrder } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { DeliveryDateForm } from "@/components/admin/DeliveryDateForm";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";
import { formatDate, formatPrice } from "@/lib/format";
import { getAdmin } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const metadata = { title: "Détail de commande" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getAdmin();
  const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as Order;

  // Ouvrir la commande marque ses notifications comme lues
  await supabase.from("notifications").update({ is_read: true }).eq("order_id", id).eq("is_read", false);

  const phoneDigits = order.phone.replace(/\D/g, "");

  return (
    <>
      <Link href="/admin/commandes" className="mb-4 inline-flex min-h-[44px] items-center gap-2 text-[12px] uppercase tracking-[0.15em] text-taupe hover:text-bordeaux-900">
        <ArrowLeft className="h-4 w-4" /> Commandes
      </Link>
      <PageHeader title={`Commande ${order.order_number}`} description={`Passée le ${formatDate(order.created_at, true)}`}>
        <StatusBadge status={order.status} />
        <DeleteButton action={deleteOrder.bind(null, order.id)} label="Supprimer la commande" redirectTo="/admin/commandes" />
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Articles">
            <ul className="divide-y divide-sable">
              {order.order_items?.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-[#F6F6F4]">
                    {item.product_image && <Image src={item.product_image} alt="" fill sizes="64px" className="object-cover mix-blend-multiply" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-encre">{item.product_name}</p>
                    <p className="text-[13px] tabular-nums text-taupe">
                      {formatPrice(item.unit_price)} × {item.quantity}
                      {item.size && <span className="ml-2 rounded bg-or-100 px-1.5 py-0.5 text-[12px] font-medium text-or-800">Taille {item.size}</span>}
                    </p>
                  </div>
                  <p className="text-[14px] font-medium tabular-nums">{formatPrice(item.line_total)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-sable pt-4 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-taupe">Sous-total</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-taupe">Livraison</dt>
                <dd>{Number(order.shipping) > 0 ? formatPrice(order.shipping) : "Offerte"}</dd>
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <dt className="text-[12px] font-medium uppercase tracking-[0.15em]">Total</dt>
                <dd className="font-serif text-2xl tabular-nums text-bordeaux-900">{formatPrice(order.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-md bg-ivoire px-3 py-2 text-[13px] text-taupe">Paiement : à la livraison</p>
          </Card>

          <Card title="Reçu">
            <dl className="grid gap-4 text-[14px] sm:grid-cols-3">
              <div>
                <dt className="text-[12px] uppercase tracking-[0.12em] text-taupe">Nom sur le reçu</dt>
                <dd className="mt-1 text-encre">{order.receipt_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.12em] text-taupe">Prix sur le reçu</dt>
                <dd className={`mt-1 font-medium ${order.show_price_on_receipt === false ? "text-bordeaux-700" : "text-encre"}`}>
                  {order.show_price_on_receipt === false ? "Non — reçu sans prix" : "Oui"}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.12em] text-taupe">Cadeau</dt>
                <dd className={`mt-1 font-medium ${order.is_gift ? "text-or-700" : "text-encre"}`}>{order.is_gift ? "Oui" : "Non"}</dd>
              </div>
            </dl>
          </Card>

          {order.notes && (
            <Card title="Message du client">
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-encre">{order.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Traitement">
            <OrderStatusForm id={order.id} status={order.status} />
          </Card>

          <Card title="Livraison">
            <DeliveryDateForm id={order.id} date={order.delivery_date ?? null} />
          </Card>

          <Card title="Client">
            <p className="text-[15px] font-medium text-encre">{order.customer_name}</p>
            <ul className="mt-4 space-y-3 text-[14px]">
              {order.email && (
              <li>
                <a href={`mailto:${order.email}`} className="flex items-center gap-3 break-all text-encre hover:text-or-700">
                  <Mail className="h-4 w-4 shrink-0 text-or-600" strokeWidth={1.5} /> {order.email}
                </a>
              </li>
              )}
              <li>
                <a href={`tel:${order.phone}`} className="flex items-center gap-3 text-encre hover:text-or-700">
                  <Phone className="h-4 w-4 shrink-0 text-or-600" strokeWidth={1.5} /> {order.phone}
                </a>
              </li>
              <li className="flex items-start gap-3 text-encre">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-or-600" strokeWidth={1.5} />
                <span>
                  {order.address}
                  <br />
                  {[[order.postal_code, order.city].filter(Boolean).join(" "), order.country].filter(Boolean).join(", ")}
                </span>
              </li>
            </ul>
            {phoneDigits.length >= 8 && (
              <a
                href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Bonjour ${order.customer_name}, Haddaj Bijouterie vous remercie pour votre commande ${order.order_number}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline mt-5 w-full rounded-md"
              >
                <WhatsAppIcon className="h-4 w-4" /> Contacter sur WhatsApp
              </a>
            )}
            {order.user_id && <p className="mt-4 text-[12px] text-taupe">Client avec compte enregistré</p>}
          </Card>
        </div>
      </div>
    </>
  );
}

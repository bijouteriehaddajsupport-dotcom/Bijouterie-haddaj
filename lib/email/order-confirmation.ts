import "server-only";
import { STORE } from "@/lib/constants";
import { formatDate, formatPrice } from "@/lib/format";

export type OrderSummary = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string | null;
  address: string;
  city: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  created_at: string;
  items: { product_name: string; product_image: string | null; unit_price: number; quantity: number; line_total: number; size?: string | null }[];
};

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const SANS = "font-family:Arial,Helvetica,sans-serif;";
const SERIF = "font-family:Georgia,'Times New Roman',serif;";

/** E-mail « Merci pour votre commande », même charte que l'e-mail du code de confirmation. */
export function orderConfirmationEmail(order: OrderSummary, siteUrl: string) {
  const firstName = esc(order.customer_name.split(" ")[0]);
  const rows = order.items
    .map(
      (i) => `
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #E6E3DD;width:64px;">
                ${i.product_image ? `<img src="${esc(i.product_image)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;object-fit:cover;background:#F6F6F4;" />` : ""}
              </td>
              <td style="padding:12px 12px;border-bottom:1px solid #E6E3DD;${SANS}font-size:14px;color:#141414;">
                ${esc(i.product_name)}<br /><span style="font-size:12px;color:#6B6862;">Quantité : ${i.quantity}${i.size ? ` · Taille : ${esc(i.size)}` : ""}</span>
              </td>
              <td align="right" style="padding:12px 0;border-bottom:1px solid #E6E3DD;${SANS}font-size:14px;color:#141414;white-space:nowrap;">
                ${esc(formatPrice(i.line_total))}
              </td>
            </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Votre commande Haddaj Bijouterie</title></head>
  <body style="margin:0;padding:0;background-color:#F4EDE4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4EDE4;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#FFFFFF;">
            <tr>
              <td align="center" style="background-color:#121212;padding:36px 24px 30px;">
                <div style="${SERIF}font-size:30px;letter-spacing:4px;color:#FAFAF8;">HADDAJ</div>
                <div style="${SANS}font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#D0A85D;margin-top:8px;">Bijouterie à Casablanca</div>
              </td>
            </tr>
            <tr><td style="height:3px;background-color:#C0913F;line-height:3px;font-size:0;">&nbsp;</td></tr>
            <tr>
              <td align="center" style="padding:44px 36px 8px;">
                <div style="${SANS}font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7D5431;">Commande ${esc(order.order_number)}</div>
                <h1 style="margin:14px 0 0;${SERIF}font-weight:normal;font-size:28px;line-height:1.3;color:#121212;">Merci, ${firstName}</h1>
                <p style="margin:18px 0 0;${SANS}font-size:15px;line-height:1.6;color:#6B6862;">
                  Nous avons bien reçu votre commande du ${esc(formatDate(order.created_at))}.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFAF8;border-left:3px solid #C0913F;">
                  <tr>
                    <td style="padding:18px 20px;${SANS}font-size:14px;line-height:1.6;color:#121212;">
                      Un membre de notre équipe va prendre contact avec vous dans les plus brefs délais pour valider votre commande avec vous.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 0;">
                <div style="${SERIF}font-size:20px;color:#121212;margin-bottom:4px;">Récapitulatif</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
                  <tr>
                    <td colspan="2" style="padding:10px 0 0;${SANS}font-size:13px;color:#6B6862;">Livraison</td>
                    <td align="right" style="padding:10px 0 0;${SANS}font-size:13px;color:#7D5431;">${Number(order.shipping) > 0 ? esc(formatPrice(order.shipping)) : "Offerte"}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:10px 0 0;${SANS}font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#141414;">Total à régler à la livraison</td>
                    <td align="right" style="padding:10px 0 0;${SERIF}font-size:22px;color:#121212;white-space:nowrap;">${esc(formatPrice(order.total))}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 8px;${SANS}font-size:13px;line-height:1.6;color:#6B6862;">
                <strong style="color:#141414;">Adresse de livraison</strong><br />
                ${esc(order.address)}${order.city ? `, ${esc(order.city)}` : ""}<br /><br />
                <strong style="color:#141414;">Paiement</strong><br />
                À la livraison, en toute sérénité.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 36px 40px;">
                <p style="margin:0 0 22px;${SERIF}font-size:20px;font-style:italic;color:#121212;">Merci d'avoir choisi Haddaj Bijouterie.</p>
                <a href="${esc(siteUrl)}/commande/${esc(order.id)}" style="display:inline-block;background-color:#121212;color:#FAFAF8;${SANS}font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Voir ma commande</a>
              </td>
            </tr>
            <tr>
              <td align="center" style="background-color:#FAFAF8;border-top:1px solid #E6E3DD;padding:22px 24px;">
                <p style="margin:0;${SANS}font-size:12px;line-height:1.7;color:#6B6862;">
                  Une question ? WhatsApp : <a href="https://wa.me/212671882274" style="color:#3E3C38;">${esc(STORE.phone)}</a><br />
                  ${esc(STORE.storeName)} · ${esc(STORE.addressLine1)}, ${esc(STORE.addressLine2)}
                </p>
                <p style="margin:6px 0 0;${SANS}font-size:11px;color:#9C8F8F;">© Haddaj Bijouterie — Bijouterie à Casablanca</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Merci, ${order.customer_name.split(" ")[0]} !`,
    `Nous avons bien reçu votre commande ${order.order_number}.`,
    "Un membre de notre équipe va prendre contact avec vous dans les plus brefs délais pour valider votre commande avec vous.",
    "",
    ...order.items.map((i) => `- ${i.product_name}${i.size ? ` (taille ${i.size})` : ""} × ${i.quantity} : ${formatPrice(i.line_total)}`),
    `Total à régler à la livraison : ${formatPrice(order.total)}`,
    `Livraison : ${order.address}${order.city ? `, ${order.city}` : ""}`,
    "",
    "Merci d'avoir choisi Haddaj Bijouterie.",
    `WhatsApp : ${STORE.phone}`,
  ].join("\n");

  return { subject: `Votre commande ${order.order_number} — Haddaj Bijouterie`, html, text };
}

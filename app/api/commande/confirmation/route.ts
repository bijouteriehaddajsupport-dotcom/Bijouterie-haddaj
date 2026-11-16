import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOG_TAG } from "@/lib/data";
import { orderConfirmationEmail, type OrderSummary } from "@/lib/email/order-confirmation";
import { isMailConfigured, sendMail } from "@/lib/email/send";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Appelé juste après chaque commande : met à jour le stock affiché (cache des pages)
 * puis envoie l'e-mail de confirmation si le client a donné son adresse.
 */
export async function POST(request: Request) {
  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || !isSupabaseConfigured) {
    return NextResponse.json({ ok: false, error: "Commande invalide" }, { status: 400 });
  }
  const { data } = await createPublicClient().rpc("get_order_summary", { p_id: id });
  const order = data as OrderSummary | null;
  if (!order) return NextResponse.json({ ok: false, error: "Commande introuvable" }, { status: 404 });

  // Uniquement pour une commande toute récente : évite les appels abusifs
  if (Date.now() - new Date(order.created_at).getTime() > 15 * 60 * 1000) {
    return NextResponse.json({ ok: false, error: "Commande trop ancienne" }, { status: 409 });
  }

  // Le stock vient de changer : les pages en cache seront recalculées à la prochaine visite
  revalidateTag(CATALOG_TAG);
  revalidatePath("/", "layout");

  if (!order.email) return NextResponse.json({ ok: true, skipped: "pas d'e-mail" });
  if (!isMailConfigured()) {
    console.warn("E-mail de confirmation non envoyé : SMTP_USER / SMTP_PASS manquants.");
    return NextResponse.json({ ok: false, error: "E-mail non configuré" }, { status: 503 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  try {
    await sendMail({ to: order.email, ...orderConfirmationEmail(order, siteUrl) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Envoi de l'e-mail de confirmation impossible :", e);
    return NextResponse.json({ ok: false, error: "Envoi impossible" }, { status: 502 });
  }
}

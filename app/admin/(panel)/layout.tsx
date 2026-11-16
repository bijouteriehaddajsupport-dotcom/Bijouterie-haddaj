import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { Sidebar } from "@/components/admin/Sidebar";
import { getUpcomingDeliveries, sendDeliveryReminders } from "@/lib/deliveries";
import { getAdmin } from "@/lib/supabase/server";
import type { AdminNotification } from "@/lib/types";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Admin Haddaj Bijouterie" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await getAdmin();
  if (!user || !profile) redirect("/admin/login");

  // Rappels « livraison dans 48 h » (créés une seule fois par commande)
  await sendDeliveryReminders(supabase);

  const [{ data: notifications }, { count: unread }, { count: pending }, upcoming] = await Promise.all([
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    getUpcomingDeliveries(supabase),
  ]);

  return (
    <div className="min-h-svh bg-bordeaux-50">
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-sable/70 bg-white/85 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-2">
            {/* Barre latérale fixe (desktop) + bouton/tiroir (mobile) */}
            <Sidebar counts={{ pending: pending ?? 0, unread: unread ?? 0, deliveries: upcoming?.length ?? 0 }} email={user.email ?? ""} />
            <p className="hidden text-[14px] text-taupe sm:block">
              Bonjour, <span className="font-semibold text-bordeaux-950">{profile.full_name || "Haddaj Bijouterie"}</span>
            </p>
          </div>
          <NotificationBell initial={(notifications ?? []) as AdminNotification[]} unread={unread ?? 0} />
        </header>
        <main className="px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}

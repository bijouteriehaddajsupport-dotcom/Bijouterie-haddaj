import { ExternalLink, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { HomeImagesEditor } from "@/components/admin/HomeImagesEditor";
import { PageHeader } from "@/components/admin/ui";
import { DEFAULT_HOME_IMAGES, normalizeHomeImages } from "@/lib/site-images";
import { getAdmin } from "@/lib/supabase/server";

export const metadata = { title: "Photos du site" };

export default async function AdminSiteImagesPage() {
  const { supabase } = await getAdmin();
  // Lecture directe (sans cache) pour toujours éditer la dernière version enregistrée
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "home_images").maybeSingle();
  const missingTable = Boolean(error && /site_settings/.test(error.message));
  const initial = data ? normalizeHomeImages(data.value) : DEFAULT_HOME_IMAGES;

  return (
    <>
      <PageHeader title="Photos du site" description="Changez les photos de l'accueil et choisissez leur cadrage sur ordinateur et sur téléphone.">
        <Link href="/" target="_blank" className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-4 text-[13px] text-bordeaux-900 hover:bg-champagne">
          <ExternalLink className="h-4 w-4" /> Voir l&apos;accueil
        </Link>
      </PageHeader>
      {missingTable && (
        <p className="mb-6 flex items-start gap-3 rounded-lg border border-or-300 bg-or-50 px-4 py-3 text-[14px] text-or-900">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Exécutez d&apos;abord le fichier supabase/photos-site.sql dans Supabase → SQL Editor, puis rechargez cette page.
        </p>
      )}
      <HomeImagesEditor initial={initial} />
    </>
  );
}

"use client";

import { Crosshair, ImagePlus, LoaderCircle, Move, RefreshCw, Save } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { refreshStoreNow, saveHomeImages } from "@/app/admin/actions";
import { compressImage } from "@/lib/compress-image";
import { focus, IMAGE_SLOTS, type Frame, type HomeImages, type SiteImage, type SlotKey } from "@/lib/site-images";
import { createClient } from "@/lib/supabase/client";
import { Card } from "./ui";

const MAX_MB = 15;

/**
 * Admin → Photos du site : pour chaque emplacement de l'accueil, aperçu aux vraies proportions
 * (ordinateur et téléphone) ; on fait glisser la photo pour choisir le cadrage, comme une photo de profil.
 */
export function HomeImagesEditor({ initial }: { initial: HomeImages }) {
  const [images, setImages] = useState<HomeImages>(initial);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [refreshing, startRefresh] = useTransition();

  const update = (key: SlotKey, img: SiteImage) => {
    setImages((cur) => ({ ...cur, [key]: img }));
    setDirty(true);
    setMessage(null);
  };

  const save = () =>
    startSave(async () => {
      const res = await saveHomeImages(images);
      setMessage({ ok: res.ok, text: res.message });
      if (res.ok) setDirty(false);
    });

  const refresh = () =>
    startRefresh(async () => {
      const res = await refreshStoreNow();
      setMessage({ ok: res.ok, text: res.message });
    });

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-10 -mx-4 flex flex-wrap items-center gap-3 border-b border-sable bg-ivoire/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <button type="button" onClick={save} disabled={saving || !dirty} className="btn-primary rounded-md">
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
        </button>
        <button type="button" onClick={refresh} disabled={refreshing} className="btn-outline rounded-md">
          {refreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Actualiser la boutique
        </button>
        {dirty && !message && <span className="text-[13px] text-or-700">Modifications non enregistrées</span>}
        {message && (
          <span role="status" className={message.ok ? "text-[13px] text-emerald-700" : "text-[13px] text-bordeaux-600"}>
            {message.text}
          </span>
        )}
      </div>

      {IMAGE_SLOTS.map((slot) => (
        <SlotCard key={slot.key} title={slot.title} where={slot.where} frames={slot.frames} slotKey={slot.key} image={images[slot.key]} onChange={(img) => update(slot.key, img)} />
      ))}
    </div>
  );
}

function SlotCard({ slotKey, title, where, frames, image, onChange }: { slotKey: SlotKey; title: string; where: string; frames: Frame[]; image: SiteImage; onChange: (img: SiteImage) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file?: File) => {
    setError("");
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_MB * 1024 * 1024) return setError(`La photo dépasse ${MAX_MB} Mo.`);
    setUploading(true);
    try {
      // Photo allégée avant l'envoi (2000 px max), comme pour les produits
      const light = await compressImage(file);
      const ext = (light.name.split(".").pop() || "jpg").toLowerCase();
      const path = `accueil/${slotKey}-${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from("images").upload(path, light, { cacheControl: "31536000", contentType: light.type });
      if (upErr) throw upErr;
      onChange({ url: supabase.storage.from("images").getPublicUrl(path).data.publicUrl, x: 50, y: 50 });
    } catch (e) {
      setError(`Échec du téléversement : ${e instanceof Error ? e.message : "erreur inconnue"}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card
      title={title}
      action={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onChange({ ...image, x: 50, y: 50 })} className="inline-flex min-h-[40px] items-center gap-2 rounded-md px-3 text-[13px] text-bordeaux-900 hover:bg-champagne">
            <Crosshair className="h-4 w-4" /> Recentrer
          </button>
          <button type="button" onClick={() => input.current?.click()} disabled={uploading} className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-bordeaux-900 px-4 text-[13px] text-white hover:bg-bordeaux-700 disabled:opacity-60">
            {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Changer la photo
          </button>
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0] ?? undefined)} />
        </div>
      }
    >
      <p className="text-[13px] text-taupe">{where}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[12px] text-or-700">
        <Move className="h-3.5 w-3.5" /> Faites glisser la photo dans un cadre pour choisir la partie visible.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-bordeaux-600">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-end gap-6">
        {frames.map((f) => (
          <Preview key={f.label} frame={f} image={image} onMove={(x, y) => onChange({ ...image, x, y })} />
        ))}
      </div>
    </Card>
  );
}

/** Cadre aux proportions réelles ; glisser la photo déplace le point de cadrage (object-position). */
function Preview({ frame, image, onMove }: { frame: Frame; image: SiteImage; onMove: (x: number, y: number) => void }) {
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  // Les grands cadres sont affichés réduits dans l'admin, en gardant leurs proportions
  const scale = Math.min(1, 360 / frame.w, 300 / frame.h);
  const w = Math.round(frame.w * scale);
  const h = Math.round(frame.h * scale);

  return (
    <figure>
      <div
        className="relative cursor-grab touch-none select-none overflow-hidden rounded-xl bg-bordeaux-50 ring-1 ring-sable active:cursor-grabbing"
        style={{ width: w, height: h }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { px: e.clientX, py: e.clientY, x: image.x, y: image.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          // Glisser vers la droite montre la partie gauche de la photo (le point de cadrage recule)
          const x = Math.min(100, Math.max(0, d.x - ((e.clientX - d.px) / w) * 100));
          const y = Math.min(100, Math.max(0, d.y - ((e.clientY - d.py) / h) * 100));
          onMove(Math.round(x), Math.round(y));
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" style={{ objectPosition: focus(image) }} />
      </div>
      <figcaption className="mt-2 text-[12px] text-taupe">
        {frame.label} · {frame.w}×{frame.h}
      </figcaption>
    </figure>
  );
}

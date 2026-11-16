"use client";

import { Check, Minus, Move, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { imageStyle, MAX_ZOOM, MIN_ZOOM, type Frame, type SiteImage } from "@/lib/site-images";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Recadrage façon WhatsApp : grande zone au format du cadre principal, on fait glisser la photo
 * et on zoome (curseur, boutons, molette ou deux doigts). Les autres formats s'affichent en direct.
 */
export function CropModal({ image, frames, title, onClose, onApply }: { image: SiteImage; frames: Frame[]; title: string; onClose: () => void; onApply: (img: SiteImage) => void }) {
  const [img, setImg] = useState<SiteImage>(image);
  const [main, setMain] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ img: SiteImage; dist: number; cx: number; cy: number } | null>(null);

  const frame = frames[main];
  // Grande zone de recadrage : même proportion que le cadre choisi, à la taille de l'écran
  const scale = Math.min(560 / frame.w, 420 / frame.h, (typeof window !== "undefined" ? window.innerWidth - 48 : 560) / frame.w);
  const W = Math.round(frame.w * scale);
  const H = Math.round(frame.h * scale);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const zoomTo = (z: number) => setImg((c) => ({ ...c, z: round(clamp(z, MIN_ZOOM, MAX_ZOOM)) }));

  const snapshot = () => {
    const pts = [...pointers.current.values()];
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    const cx = pts.reduce((n, p) => n + p.x, 0) / pts.length;
    const cy = pts.reduce((n, p) => n + p.y, 0) / pts.length;
    return { dist, cx, cy };
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Recadrer : ${title}`}>
      <div className="flex max-h-full w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sable px-5 py-3">
          <div>
            <p className="font-serif text-xl text-bordeaux-900">Recadrer</p>
            <p className="text-[12px] text-taupe">{title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-champagne">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {frames.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Format à recadrer">
              {frames.map((f, i) => (
                <button
                  key={f.label}
                  type="button"
                  role="tab"
                  aria-selected={main === i}
                  onClick={() => setMain(i)}
                  className={`min-h-[36px] rounded-full px-4 text-[12px] font-medium transition-colors ${main === i ? "bg-bordeaux-900 text-white" : "bg-champagne text-bordeaux-900 hover:bg-sable"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Zone de recadrage */}
          <div className="flex justify-center rounded-xl bg-bordeaux-950 p-4">
            <div
              ref={box}
              className="relative cursor-grab touch-none select-none overflow-hidden rounded-lg active:cursor-grabbing"
              style={{ width: W, height: H }}
              onWheel={(e) => zoomTo(img.z - e.deltaY * 0.0015)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                start.current = { img, ...snapshot() };
              }}
              onPointerMove={(e) => {
                if (!pointers.current.has(e.pointerId) || !start.current) return;
                pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                const s = start.current;
                const now = snapshot();
                // Deux doigts : zoom selon l'écart entre les doigts
                const z = s.dist && now.dist ? clamp(s.img.z * (now.dist / s.dist), MIN_ZOOM, MAX_ZOOM) : s.img.z;
                // Glisser : la photo suit le doigt (le point de cadrage recule d'autant, divisé par le zoom)
                const x = clamp(s.img.x - ((now.cx - s.cx) / W) * (100 / z), 0, 100);
                const y = clamp(s.img.y - ((now.cy - s.cy) / H) * (100 / z), 0, 100);
                setImg({ ...s.img, x: Math.round(x), y: Math.round(y), z: round(z) });
              }}
              onPointerUp={(e) => {
                pointers.current.delete(e.pointerId);
                start.current = pointers.current.size ? { img, ...snapshot() } : null;
              }}
              onPointerCancel={(e) => {
                pointers.current.delete(e.pointerId);
                start.current = null;
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" style={imageStyle(img)} />
              {/* Grille des tiers, comme un appareil photo */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="border border-white/25" />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-taupe">
            <Move className="h-3.5 w-3.5" /> Glissez pour positionner · molette ou deux doigts pour zoomer
          </p>

          {/* Zoom */}
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={() => zoomTo(img.z - 0.1)} aria-label="Dézoomer" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sable hover:bg-champagne">
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={img.z}
              onChange={(e) => zoomTo(Number(e.target.value))}
              aria-label="Zoom"
              className="h-2 flex-1 cursor-pointer accent-bordeaux-900"
            />
            <button type="button" onClick={() => zoomTo(img.z + 0.1)} aria-label="Zoomer" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sable hover:bg-champagne">
              <Plus className="h-4 w-4" />
            </button>
            <span className="w-12 shrink-0 text-right text-[13px] tabular-nums text-taupe">{Math.round(img.z * 100)} %</span>
          </div>

          {/* Les autres formats, en direct */}
          {frames.length > 1 && (
            <div className="mt-5 flex flex-wrap items-end gap-4 border-t border-sable pt-4">
              {frames.map((f) => {
                const s = Math.min(150 / f.w, 110 / f.h);
                return (
                  <figure key={f.label}>
                    <div className="relative overflow-hidden rounded-md bg-bordeaux-50 ring-1 ring-sable" style={{ width: Math.round(f.w * s), height: Math.round(f.h * s) }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" style={imageStyle(img)} />
                    </div>
                    <figcaption className="mt-1 text-[11px] text-taupe">{f.label}</figcaption>
                  </figure>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sable px-5 py-3">
          <button type="button" onClick={() => setImg({ ...img, x: 50, y: 50, z: 1 })} className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 text-[13px] text-bordeaux-900 hover:bg-champagne">
            <RotateCcw className="h-4 w-4" /> Réinitialiser
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="min-h-[44px] rounded-md px-4 text-[13px] text-taupe hover:bg-champagne">
              Annuler
            </button>
            <button type="button" onClick={() => onApply(img)} className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-bordeaux-900 px-5 text-[13px] font-medium text-white hover:bg-bordeaux-700">
              <Check className="h-4 w-4" /> Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

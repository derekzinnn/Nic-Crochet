"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Crop rectangle in the image's own pixels — what the server extracts. */
export type CropRect = { x: number; y: number; width: number; height: number };

const ASPECT = 3 / 4; // product cards are 3:4 portrait
const MAX_ZOOM = 4;

/**
 * Lets Nic choose how a photo is framed before it's uploaded: drag to move,
 * pinch or slide to zoom, inside a 3:4 window. Returns the chosen rectangle in
 * the image's natural pixels so the server crops the original (no quality lost
 * to a canvas round-trip, and huge iPhone files never hit browser memory).
 */
export default function PhotoCropper({
  file,
  index,
  total,
  onCancel,
  onConfirm,
}: {
  file: File;
  index: number;
  total: number;
  onCancel: () => void;
  onConfirm: (crop: CropRect) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Object URL for the picked file; revoked on unmount.
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Track the viewport size so the maths follow responsive layout.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [url]);

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  /** Scale at zoom=1: the image just covers the window (never letterboxed). */
  const baseScale = nat && box.w ? Math.max(box.w / nat.w, box.h / nat.h) : 1;
  const scale = baseScale * zoom;
  const dispW = nat ? nat.w * scale : 0;
  const dispH = nat ? nat.h * scale : 0;

  /** Keep the image covering the window — no empty gaps at the edges. */
  const clamp = useCallback(
    (o: { x: number; y: number }) => {
      const maxX = Math.max(0, (dispW - box.w) / 2);
      const maxY = Math.max(0, (dispH - box.h) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      };
    },
    [dispW, dispH, box.w, box.h],
  );

  useEffect(() => setOffset((o) => clamp(o)), [clamp]);

  // ---- drag + pinch (pointer events cover mouse and touch alike) ----
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    } else if (pointers.current.size === 2) {
      dragStart.current = null;
      pinchStart.current = { dist: dist(), zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const ratio = dist() / (pinchStart.current.dist || 1);
      setZoom(Math.min(MAX_ZOOM, Math.max(1, pinchStart.current.zoom * ratio)));
      return;
    }
    if (dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset(clamp({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy }));
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragStart.current = null;
  };

  /** Translate what's framed on screen back into the original image's pixels. */
  const confirm = () => {
    if (!nat || !box.w) return;
    const left = (box.w - dispW) / 2 + offset.x; // image's left edge in the window
    const top = (box.h - dispH) / 2 + offset.y;
    const rect: CropRect = {
      x: Math.round(Math.max(0, -left / scale)),
      y: Math.round(Math.max(0, -top / scale)),
      width: Math.round(Math.min(nat.w, box.w / scale)),
      height: Math.round(Math.min(nat.h, box.h / scale)),
    };
    // Never hand the server a rect that runs past the image.
    rect.width = Math.min(rect.width, nat.w - rect.x);
    rect.height = Math.min(rect.height, nat.h - rect.y);
    onConfirm(rect);
  };

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-[clamp(12px,4vw,40px)]">
      <div onClick={onCancel} className="absolute inset-0 bg-[rgba(40,42,28,.6)] backdrop-blur-[3px]" />

      <div className="relative z-[2] w-[min(440px,100%)] bg-cream rounded-[20px] p-[clamp(16px,3vw,24px)] shadow-[0_40px_90px_-30px_rgba(0,0,0,.5)]">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-serif text-[22px] text-ink">Enquadrar foto</h2>
          {total > 1 && (
            <span className="text-[12px] text-muted-soft">
              {index + 1} de {total}
            </span>
          )}
        </div>
        <p className="text-[13px] text-muted-soft mb-4">
          Arraste para escolher o que aparece. Use o zoom para aproximar.
        </p>

        <div
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          style={{ aspectRatio: String(ASPECT), touchAction: "none" }}
          className="relative w-full overflow-hidden rounded-[14px] bg-[#E8E2D4] cursor-grab active:cursor-grabbing select-none"
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const im = e.currentTarget;
                setNat({ w: im.naturalWidth, h: im.naturalHeight });
              }}
              style={{
                width: dispW ? `${dispW}px` : "100%",
                height: dispH ? `${dispH}px` : "100%",
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
              className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
            />
          )}
          {/* thirds guide */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/70" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/70" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/70" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/70" />
          </div>
        </div>

        <label className="flex items-center gap-3 mt-4">
          <span className="text-[11px] tracking-[0.16em] uppercase text-muted-soft">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-sage"
          />
        </label>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="btn-pill flex-none bg-transparent text-muted-nav border border-line-input px-6 py-[13px] hover:border-sage hover:text-sage"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!nat}
            className="btn-pill flex-1 bg-ink text-cream py-[13px] hover:bg-sage disabled:opacity-50"
          >
            {index + 1 < total ? "Usar e continuar →" : "Usar esta foto"}
          </button>
        </div>
      </div>
    </div>
  );
}

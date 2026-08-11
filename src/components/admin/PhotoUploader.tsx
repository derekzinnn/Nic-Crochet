"use client";

import { useEffect, useRef, useState } from "react";
import PhotoCropper, { type CropRect } from "@/components/admin/PhotoCropper";

/** A photo being uploaded — shown as a thumbnail with a spinner right away. */
type PendingJob = { id: string; file: File; crop: CropRect; previewUrl: string };

/**
 * The wizard's single photo surface: one big 3:4 frame that IS both the editor
 * and the store preview. Arrows flip between photos; hovering the frame reveals
 * "tornar capa" / "remover"; new photos are framed (cropped) then uploaded in
 * the background. `badge` paints the store tag; `fallback` is shown while the
 * piece has no photo yet (the woven swatch, so the preview still matches the shop).
 */
export default function PhotoUploader({
  photos,
  onChange,
  badge,
  fallback,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  badge?: string;
  fallback?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  // Files waiting to be framed, one at a time.
  const [pickQueue, setPickQueue] = useState<File[]>([]);
  const [pickIndex, setPickIndex] = useState(0);

  // Framed photos uploading in the background (sequential worker below).
  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const working = useRef(false);

  // Latest photos, so the sequential worker appends onto current state even
  // after awaits (the onChange closure would otherwise be stale).
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Keep the shown photo in range as photos are added/removed/reordered.
  useEffect(() => {
    setIndex((i) => Math.min(Math.max(i, 0), Math.max(photos.length - 1, 0)));
  }, [photos.length]);

  /** Selecting files opens the cropper — nothing uploads until each is framed. */
  const startCropping = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setError(null);
    setPickQueue(list);
    setPickIndex(0);
  };

  const advancePick = () => {
    if (pickIndex + 1 >= pickQueue.length) {
      setPickQueue([]);
      setPickIndex(0);
    } else {
      setPickIndex((i) => i + 1);
    }
  };

  /** Framing done → queue the upload (background) and move to the next photo. */
  const onCropConfirmed = (crop: CropRect) => {
    const file = pickQueue[pickIndex];
    if (file) {
      setJobs((j) => [
        ...j,
        { id: crypto.randomUUID(), file, crop, previewUrl: URL.createObjectURL(file) },
      ]);
    }
    advancePick();
  };

  // Upload worker: process one job at a time so appends never race each other.
  useEffect(() => {
    if (working.current || jobs.length === 0) return;
    working.current = true;
    const job = jobs[0];
    (async () => {
      try {
        const body = new FormData();
        body.append("file", job.file);
        body.append("cropX", String(job.crop.x));
        body.append("cropY", String(job.crop.y));
        body.append("cropW", String(job.crop.width));
        body.append("cropH", String(job.crop.height));
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (res.ok && data.url) onChange([...photosRef.current, data.url]);
        else setError(data.error ?? "Falha no upload.");
      } catch {
        setError("Não foi possível enviar a imagem.");
      } finally {
        URL.revokeObjectURL(job.previewUrl);
        setJobs((j) => j.slice(1));
        working.current = false;
      }
    })();
  }, [jobs, onChange]);

  const current = photos[index];
  const removeCurrent = () => current && onChange(photos.filter((p) => p !== current));
  const makeCurrentCover = () => {
    if (!current) return;
    onChange([current, ...photos.filter((p) => p !== current)]);
    setIndex(0);
  };
  const go = (delta: number) =>
    setIndex((i) => (i + delta + photos.length) % photos.length);

  const hasPhotos = photos.length > 0;
  const uploading = jobs.length;
  const arrow =
    "absolute top-1/2 -translate-y-1/2 z-10 grid place-items-center w-8 h-8 rounded-full " +
    "bg-cream/90 text-ink text-[17px] leading-none shadow hover:bg-cream transition-colors";

  return (
    <div>
      {/* one big frame — the editor and the store preview at once */}
      <div className="relative aspect-[3/4] rounded-[14px] overflow-hidden bg-sand border border-line-card group">
        {hasPhotos ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="" className="w-full h-full object-cover" />
        ) : uploading > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={jobs[0].previewUrl}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 grid place-items-center bg-cream/40">
              <span className="w-6 h-6 rounded-full border-2 border-sage border-t-transparent animate-spin" />
            </div>
          </>
        ) : (
          fallback ?? (
            <div className="absolute inset-0 grid place-items-center text-muted-faint text-[13px]">
              Nenhuma foto ainda
            </div>
          )
        )}

        {badge?.trim() && (
          <span className="absolute top-3 left-3 z-10 bg-cream text-sage-deep px-3 py-[5px] rounded-[30px] text-[10px] tracking-[0.14em] uppercase font-semibold">
            {badge}
          </span>
        )}

        {hasPhotos && (
          <span className="absolute top-3 right-3 z-10 bg-ink/80 text-cream px-[9px] py-[4px] rounded-[20px] text-[10px] tracking-[0.1em] uppercase">
            {index === 0 ? "Capa" : `Foto ${index + 1}/${photos.length}`}
          </span>
        )}

        {/* uploading more in the background — a small chip, non-blocking */}
        {hasPhotos && uploading > 0 && (
          <span className="absolute bottom-3 right-3 z-10 flex items-center gap-[6px] bg-cream/90 text-ink text-[11px] px-[9px] py-[4px] rounded-[20px] shadow">
            <span className="w-3 h-3 rounded-full border-2 border-sage border-t-transparent animate-spin" />
            enviando {uploading}
          </span>
        )}

        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className={`${arrow} left-2`}>
              ‹
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Próxima foto" className={`${arrow} right-2`}>
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-[5px]">
              {photos.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`rounded-full transition-all ${
                    i === index ? "w-[16px] h-[5px] bg-cream" : "w-[5px] h-[5px] bg-cream/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* hover controls for the shown photo */}
        {hasPhotos && (
          <div className="absolute inset-x-0 bottom-0 z-10 flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {index !== 0 && (
              <button
                type="button"
                onClick={makeCurrentCover}
                className="flex-1 bg-ink/85 text-cream text-[11px] py-[7px] hover:bg-sage transition-colors"
              >
                ★ Tornar capa
              </button>
            )}
            <button
              type="button"
              onClick={removeCurrent}
              className="flex-1 bg-ink/85 text-[#E7B4A1] text-[11px] py-[7px] hover:bg-[#C06A4A] hover:text-cream transition-colors"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      {/* add photos */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) startCropping(e.dataTransfer.files);
        }}
        className="mt-3 w-full rounded-[12px] border border-dashed border-line px-4 py-[11px] text-[13px] text-muted-nav hover:border-sage hover:text-sage transition-colors"
      >
        {hasPhotos ? "+ Adicionar mais fotos" : "+ Adicionar fotos"}
        <span className="block text-[11px] text-muted-faint mt-[2px]">
          Você enquadra cada foto antes de enviar
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) startCropping(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <div className="mt-2 text-[13px] text-[#C06A4A]">{error}</div>}

      {/* Framing overlay — one photo at a time; not gated on uploads, so you can
          keep framing while earlier photos upload in the background. */}
      {pickQueue.length > 0 && pickQueue[pickIndex] && (
        <PhotoCropper
          key={pickIndex}
          file={pickQueue[pickIndex]}
          index={pickIndex}
          total={pickQueue.length}
          onCancel={advancePick}
          onConfirm={onCropConfirmed}
        />
      )}
    </div>
  );
}

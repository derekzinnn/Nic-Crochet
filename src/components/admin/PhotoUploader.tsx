"use client";

import { useEffect, useRef, useState } from "react";
import PhotoCropper, { type CropRect } from "@/components/admin/PhotoCropper";

/** A photo being uploaded — shown as a thumbnail with a spinner right away. */
type PendingJob = { id: string; file: File; crop: CropRect; previewUrl: string };

export default function PhotoUploader({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const remove = (url: string) => onChange(photos.filter((p) => p !== url));
  const makeCover = (url: string) => onChange([url, ...photos.filter((p) => p !== url)]);

  /** Move a photo one slot left/right — the first one is the cover. */
  const move = (from: number, delta: number) => {
    const to = from + delta;
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <span className="block text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[7px]">
        Fotos da peça
      </span>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) startCropping(e.dataTransfer.files);
        }}
        className={`w-full rounded-[14px] border border-dashed px-4 py-6 text-center transition-colors ${
          dragOver ? "border-sage bg-sage/10" : "border-line hover:border-sage"
        }`}
      >
        <div className="text-[14px] text-ink">Arraste fotos aqui ou clique para escolher</div>
        <div className="text-[12px] text-muted-soft mt-1">
          Você escolhe o enquadramento de cada foto antes de enviar
        </div>
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

      {(photos.length > 0 || jobs.length > 0) && (
        <div className="grid grid-cols-4 gap-[10px] mt-3">
          {/* uploaded photos */}
          {photos.map((url, i) => (
            <div
              key={url}
              className="relative aspect-square rounded-[10px] overflow-hidden border border-line-card group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-sage text-cream text-[9px] tracking-[0.1em] uppercase px-[6px] py-[2px] rounded-[10px]">
                  Capa
                </span>
              )}
              {photos.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Mover foto para trás"
                    className="grid place-items-center w-6 h-6 rounded-full bg-cream/90 text-ink text-[14px] leading-none shadow disabled:opacity-0 hover:bg-cream"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === photos.length - 1}
                    aria-label="Mover foto para frente"
                    className="grid place-items-center w-6 h-6 rounded-full bg-cream/90 text-ink text-[14px] leading-none shadow disabled:opacity-0 hover:bg-cream"
                  >
                    ›
                  </button>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(url)}
                    className="flex-1 bg-ink/80 text-cream text-[10px] py-[3px] hover:bg-sage"
                  >
                    Capa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(url)}
                  className="flex-1 bg-ink/80 text-[#E0A48C] text-[10px] py-[3px] hover:bg-[#C06A4A]"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}

          {/* photos still uploading — thumbnail + spinner, no waiting */}
          {jobs.map((job) => (
            <div
              key={job.id}
              className="relative aspect-square rounded-[10px] overflow-hidden border border-line-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={job.previewUrl} alt="" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 grid place-items-center bg-cream/40">
                <span className="w-5 h-5 rounded-full border-2 border-sage border-t-transparent animate-spin" />
              </div>
            </div>
          ))}
        </div>
      )}

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

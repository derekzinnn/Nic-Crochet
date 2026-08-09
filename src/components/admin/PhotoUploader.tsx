"use client";

import { useRef, useState } from "react";
import PhotoCropper, { type CropRect } from "@/components/admin/PhotoCropper";

export default function PhotoUploader({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Files waiting to be framed, one at a time, before they're sent. */
  const [queue, setQueue] = useState<File[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  /** Send one already-framed photo; the crop is applied server-side. */
  const uploadOne = async (file: File, crop: CropRect | null): Promise<string | null> => {
    const body = new FormData();
    body.append("file", file);
    if (crop) {
      body.append("cropX", String(crop.x));
      body.append("cropY", String(crop.y));
      body.append("cropW", String(crop.width));
      body.append("cropH", String(crop.height));
    }
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Falha no upload.");
      return null;
    }
    return data.url as string;
  };

  /** Picking files opens the cropper instead of uploading straight away. */
  const startCropping = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setError(null);
    setQueue(list);
    setQueueIndex(0);
  };

  const onCropConfirmed = async (crop: CropRect) => {
    const file = queue[queueIndex];
    setUploading(true);
    try {
      const url = await uploadOne(file, crop);
      // Wait for the upload before moving on: `photos` must be up to date
      // before the next confirm appends to it, or a photo would be dropped.
      if (url) onChange([...photos, url]);
    } catch {
      setError("Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      advanceQueue();
    }
  };

  const advanceQueue = () => {
    if (queueIndex + 1 >= queue.length) {
      setQueue([]);
      setQueueIndex(0);
    } else {
      setQueueIndex((i) => i + 1);
    }
  };

  /** Skip this photo and carry on with the rest of the batch. */
  const onCropCancelled = () => advanceQueue();

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
        <div className="text-[14px] text-ink">
          {uploading ? "Enviando..." : "Arraste fotos aqui ou clique para escolher"}
        </div>
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

      {/* Framing happens one photo at a time; hidden while the send is in flight. */}
      {queue.length > 0 && !uploading && queue[queueIndex] && (
        <PhotoCropper
          key={queueIndex}
          file={queue[queueIndex]}
          index={queueIndex}
          total={queue.length}
          onCancel={onCropCancelled}
          onConfirm={onCropConfirmed}
        />
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-[10px] mt-3">
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

              {/* reorder arrows — first photo is the cover */}
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
        </div>
      )}
    </div>
  );
}

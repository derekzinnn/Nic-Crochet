"use client";

import { useRef, useState } from "react";

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

  const uploadFiles = async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of list) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Falha no upload.");
          break;
        }
        uploaded.push(data.url);
      }
      if (uploaded.length) onChange([...photos, ...uploaded]);
    } catch {
      setError("Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const remove = (url: string) => onChange(photos.filter((p) => p !== url));
  const makeCover = (url: string) => onChange([url, ...photos.filter((p) => p !== url)]);

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
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={`w-full rounded-[14px] border border-dashed px-4 py-6 text-center transition-colors ${
          dragOver ? "border-sage bg-sage/10" : "border-panel-line hover:border-sage-light"
        }`}
      >
        <div className="text-[14px] text-cloud">
          {uploading ? "Enviando..." : "Arraste fotos aqui ou clique para escolher"}
        </div>
        <div className="text-[12px] text-muted-soft mt-1">JPG, PNG ou WebP · até 6 MB cada</div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <div className="mt-2 text-[13px] text-[#E0A48C]">{error}</div>}

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-[10px] mt-3">
          {photos.map((url, i) => (
            <div
              key={url}
              className="relative aspect-square rounded-[10px] overflow-hidden border border-panel-line group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-sage text-cream text-[9px] tracking-[0.1em] uppercase px-[6px] py-[2px] rounded-[10px]">
                  Capa
                </span>
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

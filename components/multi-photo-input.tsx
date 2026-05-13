"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";

import { compressImage } from "@/lib/image";

export function MultiPhotoInput({ name = "photo" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function addFiles(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setInfo(`处理 ${files.length} 张…`);
    const compressed = await Promise.all(files.map((f) => compressImage(f)));
    const next = [
      ...items,
      ...compressed.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    ];
    syncInput(next.map((x) => x.file));
    setItems(next);
    const origTotal = files.reduce((s, f) => s + f.size, 0);
    const newTotal = compressed.reduce((s, f) => s + f.size, 0);
    setInfo(
      `共 ${next.length} 张 · 新增 ${formatSize(origTotal)} → ${formatSize(newTotal)}`,
    );
    setBusy(false);
  }

  function removeAt(idx: number) {
    URL.revokeObjectURL(items[idx].url);
    const next = items.filter((_, i) => i !== idx);
    syncInput(next.map((x) => x.file));
    setItems(next);
    setInfo(next.length === 0 ? null : `共 ${next.length} 张`);
  }

  function syncInput(files: File[]) {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((it, i) => (
          <div key={it.url} className="group relative aspect-square overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="移除"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 text-xs text-stone-500 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900">
          {busy ? "处理中…" : items.length === 0 ? "+ 加照片" : "+ 再加"}
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const fs = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (fs.length) addFiles(fs);
            }}
          />
        </label>
      </div>
      {info ? <p className="text-[11px] text-stone-500">{info}</p> : null}
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

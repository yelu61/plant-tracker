"use client";

import { useRef, useState } from "react";

import { compressImage } from "@/lib/image";
import { cn } from "@/lib/utils";

export interface CompressedFileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  preview?: boolean;
  previewClassName?: string;
  onFile?: (file: File | null) => void;
}

export function CompressedFileInput({
  preview = true,
  className,
  previewClassName,
  onFile,
  ...rest
}: CompressedFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setPreviewUrl(null);
      setInfo(null);
      onFile?.(null);
      return;
    }
    setBusy(true);
    setInfo(`处理中…`);
    try {
      const compressed = await compressImage(f);
      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(compressed);
        inputRef.current.files = dt.files;
      }
      setPreviewUrl(URL.createObjectURL(compressed));
      setInfo(
        compressed === f
          ? formatSize(f.size)
          : `${formatSize(f.size)} → ${formatSize(compressed.size)}`,
      );
      onFile?.(compressed);
    } catch (err) {
      console.error(err);
      setInfo("处理失败，按原图上传");
      setPreviewUrl(URL.createObjectURL(f));
      onFile?.(f);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label
        className={cn(
          "flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900",
          previewClassName,
        )}
      >
        {preview && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="预览" className="h-full object-contain" />
        ) : busy ? (
          <span>压缩中…</span>
        ) : (
          <span>📷 选张照片（自动压缩）</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={cn("hidden", className)}
          onChange={handleChange}
          {...rest}
        />
      </label>
      {info ? <p className="text-[11px] text-stone-500">{info}</p> : null}
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

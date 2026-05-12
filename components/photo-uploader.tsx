"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { uploadPhoto } from "@/app/actions/photos";

export function PhotoUploader({ plantId }: { plantId: number }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) =>
        startTransition(async () => {
          await uploadPhoto(plantId, fd);
          formRef.current?.reset();
          setPreview(null);
          setCaption("");
        })
      }
      className="space-y-2"
    >
      <label className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="预览" className="h-full rounded-md object-contain" />
        ) : (
          <span>📷 选张照片</span>
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPreview(URL.createObjectURL(f));
            else setPreview(null);
          }}
        />
      </label>
      <Input
        name="caption"
        placeholder="给这张写句备注（选填）"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <Button type="submit" disabled={pending || !preview} className="w-full">
        {pending ? "上传中…" : "上传"}
      </Button>
    </form>
  );
}

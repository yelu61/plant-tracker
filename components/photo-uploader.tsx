"use client";

import { useRef, useState, useTransition } from "react";

import { CompressedFileInput } from "@/components/compressed-file-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { uploadPhoto } from "@/app/actions/photos";

export function PhotoUploader({ plantId }: { plantId: number }) {
  const [hasFile, setHasFile] = useState(false);
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
          setHasFile(false);
          setCaption("");
        })
      }
      className="space-y-2"
    >
      <CompressedFileInput name="photo" onFile={(f) => setHasFile(!!f)} />
      <Input
        name="caption"
        placeholder="给这张写句备注（选填）"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <Button type="submit" disabled={pending || !hasFile} className="w-full">
        {pending ? "上传中…" : "上传"}
      </Button>
    </form>
  );
}

"use client";

import { X } from "lucide-react";
import { useTransition } from "react";

import { cn } from "@/lib/utils";

export function PhotoDeleteButton({
  action,
  className,
  confirmText = "确定删除这张照片吗？",
}: {
  action: () => Promise<void>;
  className?: string;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(confirmText)) startTransition(() => action());
      }}
      className={cn(
        "rounded-full bg-black/60 p-1 text-white transition hover:bg-rose-600 disabled:opacity-50",
        className,
      )}
      aria-label="删除照片"
    >
      <X className="h-3 w-3" />
    </button>
  );
}

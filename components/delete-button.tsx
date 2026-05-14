"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DeleteButton({
  action,
  label = "删除",
  confirmText = "确定删除吗？此操作不可撤销。",
  variant = "danger",
  className,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
  variant?: "danger" | "ghost";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={pending}
      className={cn(variant === "ghost" && "text-rose-600 hover:bg-rose-50 hover:text-rose-700", className)}
      onClick={() => {
        if (confirm(confirmText)) startTransition(() => action());
      }}
    >
      {pending ? "删除中…" : label}
    </Button>
  );
}

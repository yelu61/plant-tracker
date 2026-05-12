"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  label = "删除",
  confirmText = "确定删除吗？此操作不可撤销。",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (confirm(confirmText)) startTransition(() => action());
      }}
    >
      {pending ? "删除中…" : label}
    </Button>
  );
}

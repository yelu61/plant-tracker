"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { CARE_EVENT_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { quickLog } from "@/app/actions/events";

const DEFAULT_ACTIONS = ["water", "fertilize", "observe", "prune"] as const;

export function QuickActionRow({
  plantId,
  actions = DEFAULT_ACTIONS,
  size = "md",
}: {
  plantId: number;
  actions?: readonly string[];
  size?: "sm" | "md";
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((type) => {
        const meta = CARE_EVENT_META[type];
        if (!meta) return null;
        return (
          <button
            key={type}
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => quickLog(plantId, type))}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-95",
              meta.tone,
              "hover:brightness-95 disabled:opacity-50",
              size === "sm" && "px-2 py-1 text-xs",
            )}
          >
            <span>{meta.emoji}</span>
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function QuickActionFab({ plantId }: { plantId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() => startTransition(() => quickLog(plantId, "water"))}
      className="w-full"
      size="lg"
    >
      {pending ? "记录中…" : "💧 记一次浇水"}
    </Button>
  );
}

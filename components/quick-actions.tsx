"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { CARE_EVENT_META } from "@/lib/constants";
import { mutateOrQueue } from "@/lib/offline/sync";
import { cn } from "@/lib/utils";

const DEFAULT_ACTIONS = [
  "water",
  "fertilize",
  "prune",
  "repot",
  "sow",
  "cutting",
  "treat",
  "observe",
] as const;

type RecentState = { type: string; status: "sent" | "queued" | "error" } | null;

export function QuickActionRow({
  plantId,
  actions = DEFAULT_ACTIONS,
  size = "md",
}: {
  plantId: number;
  actions?: readonly string[];
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [recent, setRecent] = useState<RecentState>(null);

  function handleClick(type: string) {
    startTransition(async () => {
      const status = await mutateOrQueue(
        "/api/log-event",
        { plantId, type, occurredAt: new Date().toISOString() },
        { plantId, kind: type },
      );
      setRecent({ type, status });
      if (status === "sent") router.refresh();
      window.setTimeout(() => setRecent(null), 2500);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((type) => {
          const meta = CARE_EVENT_META[type];
          if (!meta) return null;
          return (
            <button
              key={type}
              type="button"
              disabled={pending}
              onClick={() => handleClick(type)}
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
      {recent ? (
        <p
          className={cn(
            "text-[11px]",
            recent.status === "sent" && "text-emerald-700",
            recent.status === "queued" && "text-amber-700",
            recent.status === "error" && "text-rose-700",
          )}
        >
          {CARE_EVENT_META[recent.type]?.emoji ?? "•"}{" "}
          {recent.status === "sent" && "已记下"}
          {recent.status === "queued" && "已缓存到本地，联网后自动同步"}
          {recent.status === "error" && "保存失败，请重试"}
        </p>
      ) : null}
    </div>
  );
}

export function QuickActionFab({ plantId }: { plantId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const status = await mutateOrQueue(
            "/api/log-event",
            { plantId, type: "water", occurredAt: new Date().toISOString() },
            { plantId, kind: "water" },
          );
          if (status === "sent") router.refresh();
        })
      }
      className="w-full"
      size="lg"
    >
      {pending ? "记录中…" : "💧 记一次浇水"}
    </Button>
  );
}

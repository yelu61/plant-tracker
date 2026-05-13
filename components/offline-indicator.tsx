"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { countPending, subscribeQueueChange } from "@/lib/offline/queue";
import { flushQueue } from "@/lib/offline/sync";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const n = await countPending();
        if (!cancelled) setCount(n);
      } catch {
        // IDB not available
      }
    }
    refresh();
    const off = subscribeQueueChange(refresh);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      cancelled = true;
      off();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (count === 0 && online) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
      <div
        className={cn(
          "pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg ring-1",
          !online && "bg-stone-900 text-stone-100 ring-stone-700",
          online && count > 0 && "bg-amber-50 text-amber-800 ring-amber-200",
        )}
      >
        {!online ? (
          <>
            <CloudOff className="h-3 w-3" />
            <span>离线模式</span>
            {count > 0 ? <span>· {count} 条待同步</span> : null}
          </>
        ) : (
          <>
            <span>⏳ {count} 条待同步</span>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  await flushQueue();
                  router.refresh();
                })
              }
              className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-amber-900 hover:bg-amber-300"
            >
              <RefreshCw className={cn("h-3 w-3", busy && "animate-spin")} />
              {busy ? "同步中…" : "立刻同步"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { flushQueue } from "@/lib/offline/sync";

export function OfflineBootstrap() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function tryFlush() {
      if (!navigator.onLine) return;
      const { ok } = await flushQueue();
      if (!cancelled && ok > 0) router.refresh();
    }

    tryFlush();

    function onOnline() {
      void tryFlush();
    }
    function onVisible() {
      if (document.visibilityState === "visible") void tryFlush();
    }

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}

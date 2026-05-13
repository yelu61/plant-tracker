import { enqueue, listPending, recordAttempt, removeItem } from "./queue";

type Result = { ok: number; fail: number };

let flushing: Promise<Result> | null = null;

export async function flushQueue(): Promise<Result> {
  if (flushing) return flushing;
  flushing = (async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { ok: 0, fail: 0 };
    }
    const items = await listPending();
    let ok = 0;
    let fail = 0;
    for (const item of items) {
      try {
        const res = await fetch(item.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.body),
        });
        if (res.ok) {
          if (item.id != null) await removeItem(item.id);
          ok += 1;
        } else {
          if (item.id != null) await recordAttempt(item.id, `HTTP ${res.status}`);
          fail += 1;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "network";
        if (item.id != null) await recordAttempt(item.id, msg);
        fail += 1;
      }
    }
    return { ok, fail };
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

export async function mutateOrQueue(
  endpoint: string,
  body: Record<string, unknown>,
  hint?: { plantId?: number | null; kind?: string },
): Promise<"sent" | "queued" | "error"> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueue({ endpoint, body, ...hint });
    void registerBackgroundSync();
    return "queued";
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return "sent";
    if (res.status >= 400 && res.status < 500) {
      // Don't queue 4xx — bad data won't succeed later.
      return "error";
    }
    await enqueue({ endpoint, body, ...hint });
    void registerBackgroundSync();
    return "queued";
  } catch {
    await enqueue({ endpoint, body, ...hint });
    void registerBackgroundSync();
    return "queued";
  }
}

async function registerBackgroundSync() {
  try {
    if (typeof navigator === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sync = (reg as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    }).sync;
    if (sync?.register) await sync.register("plant-tracker-flush");
  } catch {
    // Background Sync API absent (iOS < 17). Client-side flush still works.
  }
}

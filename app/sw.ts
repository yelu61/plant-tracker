import { defaultCache } from "@serwist/next/worker";
import { openDB, type IDBPDatabase } from "idb";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// ---- Background Sync: replay the offline queue when connectivity returns ----

const DB_NAME = "plant-tracker-offline";
const STORE = "queue";

interface QueueItem {
  id: number;
  endpoint: string;
  body: unknown;
  attempts: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;
function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

async function flushFromSw() {
  const db = await getDb();
  const items = (await db.getAll(STORE)) as QueueItem[];
  for (const item of items) {
    try {
      const res = await fetch(item.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (res.ok) await db.delete(STORE, item.id);
    } catch {
      // leave for next attempt
    }
  }
}

self.addEventListener("sync", (event) => {
  const e = event as unknown as { tag: string; waitUntil: (p: Promise<unknown>) => void };
  if (e.tag === "plant-tracker-flush") {
    e.waitUntil(flushFromSw());
  }
});

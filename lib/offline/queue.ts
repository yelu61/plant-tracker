import { openDB, type IDBPDatabase } from "idb";

export interface QueueItem {
  id?: number;
  endpoint: string;
  body: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
  // Hints for optimistic UI:
  plantId?: number | null;
  kind?: string;
}

const DB_NAME = "plant-tracker-offline";
const STORE = "queue";
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (typeof window === "undefined") {
    throw new Error("offline queue only available in browser");
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueue(
  item: Omit<QueueItem, "id" | "createdAt" | "attempts">,
) {
  const db = await getDb();
  await db.add(STORE, { ...item, createdAt: Date.now(), attempts: 0 });
  notifyChange();
}

export async function listPending(): Promise<QueueItem[]> {
  const db = await getDb();
  return (await db.getAll(STORE)) as QueueItem[];
}

export async function countPending(): Promise<number> {
  const db = await getDb();
  return db.count(STORE);
}

export async function removeItem(id: number) {
  const db = await getDb();
  await db.delete(STORE, id);
  notifyChange();
}

export async function recordAttempt(id: number, error: string) {
  const db = await getDb();
  const item = (await db.get(STORE, id)) as QueueItem | undefined;
  if (!item) return;
  item.attempts += 1;
  item.lastError = error;
  await db.put(STORE, item);
  notifyChange();
}

const EVENT_NAME = "plant-tracker:queue-change";

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function subscribeQueueChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, cb);
  return () => window.removeEventListener(EVENT_NAME, cb);
}

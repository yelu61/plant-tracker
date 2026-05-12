"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { careEvents, photos } from "@/lib/db/schema";
import { saveFile } from "@/lib/storage";
import { careEventSchema } from "@/lib/validations";

export async function logEvent(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  if (!raw.occurredAt) raw.occurredAt = new Date().toISOString();
  const parsed = careEventSchema.parse(raw);
  await db.insert(careEvents).values(parsed);
  revalidatePath("/");
  revalidatePath("/plants");
  revalidatePath(`/plants/${parsed.plantId}`);
  revalidatePath("/quick-log");
}

export async function quickLog(plantId: number, type: string) {
  const parsed = careEventSchema.parse({
    plantId,
    type,
    occurredAt: new Date().toISOString(),
  });
  await db.insert(careEvents).values(parsed);
  revalidatePath("/");
  revalidatePath("/plants");
  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/quick-log");
}

export async function logGrowth(plantId: number, formData: FormData) {
  const heightCm = numOrNull(formData.get("heightCm"));
  const leafCount = numOrNull(formData.get("leafCount"));
  const detail = (formData.get("detail") as string | null) || null;
  const occurredAtRaw = formData.get("occurredAt") as string | null;
  const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();

  const photoFiles = formData
    .getAll("photo")
    .filter((v): v is File => v instanceof File && v.size > 0);
  const photoUrls: string[] = [];
  for (const f of photoFiles) {
    const saved = await saveFile(f);
    photoUrls.push(saved.url);
  }

  const [event] = await db
    .insert(careEvents)
    .values({
      plantId,
      type: "growth",
      occurredAt,
      detail,
      metadata: { heightCm, leafCount, photoUrls },
    })
    .returning({ id: careEvents.id });

  if (photoUrls.length > 0) {
    await db.insert(photos).values(
      photoUrls.map((url) => ({
        plantId,
        eventId: event.id,
        url,
        caption: detail,
        takenAt: occurredAt,
      })),
    );
  }

  revalidatePath(`/plants/${plantId}`);
  redirect(`/plants/${plantId}`);
}

export async function deleteEvent(id: number, plantId: number) {
  await db.delete(careEvents).where(eq(careEvents.id, id));
  revalidatePath("/");
  revalidatePath(`/plants/${plantId}`);
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

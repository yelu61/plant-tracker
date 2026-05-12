"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { careEvents } from "@/lib/db/schema";
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

export async function deleteEvent(id: number, plantId: number) {
  await db.delete(careEvents).where(eq(careEvents.id, id));
  revalidatePath("/");
  revalidatePath(`/plants/${plantId}`);
}

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { saveFile } from "@/lib/storage";

export async function uploadPhoto(plantId: number, formData: FormData) {
  const file = formData.get("photo") as File | null;
  const caption = (formData.get("caption") as string | null) ?? null;
  if (!file || file.size === 0) return;
  const { url } = await saveFile(file);
  await db.insert(photos).values({
    plantId,
    url,
    caption,
    takenAt: new Date(),
  });
  revalidatePath(`/plants/${plantId}`);
}

export async function deletePhoto(id: number, plantId: number) {
  await db.delete(photos).where(eq(photos.id, id));
  revalidatePath(`/plants/${plantId}`);
}

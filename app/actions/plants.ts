"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { plants } from "@/lib/db/schema";
import { plantSchema } from "@/lib/validations";

function fd(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function createPlant(formData: FormData) {
  const parsed = plantSchema.parse(fd(formData));
  const [row] = await db
    .insert(plants)
    .values({
      ...parsed,
      speciesId: parsed.speciesId ?? null,
      acquiredPrice: parsed.acquiredPrice ?? null,
      wateringIntervalDays: parsed.wateringIntervalDays ?? null,
    })
    .returning({ id: plants.id });
  revalidatePath("/plants");
  revalidatePath("/");
  redirect(`/plants/${row.id}`);
}

export async function updatePlant(id: number, formData: FormData) {
  const parsed = plantSchema.parse(fd(formData));
  await db
    .update(plants)
    .set({
      ...parsed,
      speciesId: parsed.speciesId ?? null,
      acquiredPrice: parsed.acquiredPrice ?? null,
      wateringIntervalDays: parsed.wateringIntervalDays ?? null,
    })
    .where(eq(plants.id, id));
  revalidatePath("/plants");
  revalidatePath(`/plants/${id}`);
  redirect(`/plants/${id}`);
}

export async function deletePlant(id: number) {
  await db.delete(plants).where(eq(plants.id, id));
  revalidatePath("/plants");
  redirect("/plants");
}

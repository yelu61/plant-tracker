"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { species } from "@/lib/db/schema";
import { speciesSchema } from "@/lib/validations";

export async function createSpecies(formData: FormData) {
  const parsed = speciesSchema.parse(Object.fromEntries(formData.entries()));
  await db.insert(species).values(parsed);
  revalidatePath("/species");
  redirect(`/species`);
}

export async function updateSpecies(id: number, formData: FormData) {
  const parsed = speciesSchema.parse(Object.fromEntries(formData.entries()));
  await db.update(species).set(parsed).where(eq(species.id, id));
  revalidatePath("/species");
  redirect("/species");
}

export async function deleteSpecies(id: number) {
  await db.delete(species).where(eq(species.id, id));
  revalidatePath("/species");
}

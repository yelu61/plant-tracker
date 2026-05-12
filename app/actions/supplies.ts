"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { supplies } from "@/lib/db/schema";
import { supplySchema } from "@/lib/validations";

export async function createSupply(formData: FormData) {
  const parsed = supplySchema.parse(Object.fromEntries(formData.entries()));
  await db.insert(supplies).values(parsed);
  revalidatePath("/supplies");
  redirect("/supplies");
}

export async function updateSupply(id: number, formData: FormData) {
  const parsed = supplySchema.parse(Object.fromEntries(formData.entries()));
  await db.update(supplies).set(parsed).where(eq(supplies.id, id));
  revalidatePath("/supplies");
  redirect("/supplies");
}

export async function deleteSupply(id: number) {
  await db.delete(supplies).where(eq(supplies.id, id));
  revalidatePath("/supplies");
}

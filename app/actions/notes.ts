"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { noteSchema } from "@/lib/validations";

export async function createNote(formData: FormData) {
  const parsed = noteSchema.parse(Object.fromEntries(formData.entries()));
  await db.insert(notes).values({
    ...parsed,
    plantId: parsed.plantId ?? null,
    speciesId: parsed.speciesId ?? null,
  });
  revalidatePath("/notes");
  redirect("/notes");
}

export async function deleteNote(id: number) {
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath("/notes");
}

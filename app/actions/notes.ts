"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { notes, photos } from "@/lib/db/schema";
import { saveFile } from "@/lib/storage";
import { noteSchema } from "@/lib/validations";

export async function createNote(formData: FormData) {
  const parsed = noteSchema.parse(Object.fromEntries(formData.entries()));
  const [row] = await db
    .insert(notes)
    .values({
      ...parsed,
      plantId: parsed.plantId ?? null,
      speciesId: parsed.speciesId ?? null,
    })
    .returning({ id: notes.id });

  await saveNotePhotos(row.id, formData);

  revalidatePath("/notes");
  redirect("/notes");
}

export async function updateNote(id: number, formData: FormData) {
  const parsed = noteSchema.parse(Object.fromEntries(formData.entries()));
  await db
    .update(notes)
    .set({
      title: parsed.title,
      content: parsed.content,
      tags: parsed.tags,
      plantId: parsed.plantId ?? null,
      speciesId: parsed.speciesId ?? null,
    })
    .where(eq(notes.id, id));

  await saveNotePhotos(id, formData);

  revalidatePath("/notes");
  redirect("/notes");
}

export async function deleteNote(id: number) {
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath("/notes");
  redirect("/notes");
}

export async function deleteNotePhoto(noteId: number, photoId: number) {
  await db.delete(photos).where(eq(photos.id, photoId));
  revalidatePath(`/notes/${noteId}/edit`);
  revalidatePath("/notes");
}

async function saveNotePhotos(noteId: number, formData: FormData) {
  const files = formData
    .getAll("photo")
    .filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length === 0) return;

  const takenAtListRaw = formData.get("photoTakenAtList") as string | null;
  let takenAtList: (string | null)[] = [];
  try {
    const parsed = takenAtListRaw ? JSON.parse(takenAtListRaw) : [];
    if (Array.isArray(parsed)) takenAtList = parsed;
  } catch {
    takenAtList = [];
  }

  const now = new Date();
  const rows = await Promise.all(
    files.map(async (file, i) => {
      const { url } = await saveFile(file);
      const raw = takenAtList[i];
      const d = raw ? new Date(raw) : now;
      return {
        noteId,
        url,
        takenAt: Number.isNaN(d.getTime()) ? now : d,
      };
    }),
  );

  await db.insert(photos).values(rows);
}

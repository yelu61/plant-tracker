import exifr from "exifr";

export async function extractPhotoDate(file: File): Promise<Date | null> {
  try {
    const meta = await exifr.parse(file, [
      "DateTimeOriginal",
      "CreateDate",
      "ModifyDate",
    ]);
    const raw = meta?.DateTimeOriginal ?? meta?.CreateDate ?? meta?.ModifyDate;
    if (raw) {
      const d = raw instanceof Date ? raw : new Date(raw);
      if (!Number.isNaN(d.getTime())) return d;
    }
  } catch {
    // ignore parse errors (no EXIF, decoder issue, etc.)
  }
  if (file.lastModified) {
    const d = new Date(file.lastModified);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

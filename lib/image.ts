export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  type?: "image/jpeg" | "image/webp";
}

export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.85, type = "image/jpeg" }: CompressOptions = {},
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  const bitmap = await loadBitmap(file);
  const { width: w, height: h } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(w, h));
  if (scale === 1 && file.size < 600_000 && file.type === type) {
    bitmap.close?.();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), type, quality),
  );
  if (!blob) return file;

  const ext = type === "image/webp" ? ".webp" : ".jpg";
  const name = file.name.replace(/\.\w+$/, "") + ext;
  return new File([blob], name, { type });
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")?.drawImage(img, 0, 0);
    return (await createImageBitmap(c)) as ImageBitmap;
  } finally {
    URL.revokeObjectURL(url);
  }
}

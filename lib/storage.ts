import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_PATH = "/uploads";

export async function saveFile(file: File): Promise<{ url: string }> {
  if (!file || file.size === 0) throw new Error("空文件");
  if (file.size > 8 * 1024 * 1024) throw new Error("文件超过 8MB");

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    const { put } = await import("@vercel/blob");
    const ext = extOf(file);
    const key = `${Date.now()}-${random()}${ext}`;
    const blob = await put(key, file, { access: "public", token: blobToken });
    return { url: blob.url };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = extOf(file);
  const filename = `${Date.now()}-${random()}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buf);
  return { url: `${PUBLIC_PATH}/${filename}` };
}

function extOf(file: File) {
  const fromName = file.name.match(/\.[a-zA-Z0-9]+$/)?.[0];
  if (fromName) return fromName.toLowerCase();
  const fromType = file.type.split("/")[1];
  return fromType ? `.${fromType}` : "";
}

function random() {
  return Math.random().toString(36).slice(2, 10);
}

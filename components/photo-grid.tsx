import Image from "next/image";
import Link from "next/link";

import type { Photo } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

import { deletePhoto } from "@/app/actions/photos";

export function PhotoGrid({
  photos,
  plantId,
}: {
  photos: Photo[];
  plantId: number;
}) {
  if (photos.length === 0) {
    return <p className="text-xs text-stone-500">还没有照片。</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((p) => (
        <div key={p.id} className="group relative overflow-hidden rounded-xl">
          <Link href={p.url} target="_blank" className="block">
            <Image
              src={p.url}
              alt={p.caption ?? ""}
              width={300}
              height={300}
              className="aspect-square object-cover transition group-hover:scale-105"
              unoptimized
            />
          </Link>
          {p.caption ? (
            <p className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-white">
              {p.caption}
            </p>
          ) : null}
          <form
            action={deletePhoto.bind(null, p.id, plantId)}
            className="absolute right-1 top-1 opacity-0 transition group-hover:opacity-100"
          >
            <button
              type="submit"
              className="rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white hover:bg-rose-600"
              aria-label="删除照片"
            >
              ×
            </button>
          </form>
          {p.takenAt ? (
            <span className="absolute left-1 top-1 rounded bg-black/50 px-1 py-0.5 text-[9px] text-white">
              {formatDate(p.takenAt)}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

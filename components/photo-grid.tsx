import { Star, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { Photo } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

import { clearCoverPhoto, deletePhoto, setCoverPhoto } from "@/app/actions/photos";

export function PhotoGrid({
  photos,
  plantId,
  coverPhotoId,
}: {
  photos: Photo[];
  plantId: number;
  coverPhotoId?: number | null;
}) {
  if (photos.length === 0) {
    return <p className="text-xs text-stone-500">还没有照片。</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((p) => {
        const isCover = coverPhotoId === p.id;
        return (
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
            {isCover ? (
              <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-amber-400/95 px-1.5 py-0.5 text-[9px] font-medium text-amber-950 shadow">
                <Star className="h-2.5 w-2.5 fill-current" />
                封面
              </span>
            ) : p.takenAt ? (
              <span className="absolute left-1 top-1 rounded bg-black/50 px-1 py-0.5 text-[9px] text-white">
                {formatDate(p.takenAt)}
              </span>
            ) : null}
            {p.caption ? (
              <p className="pointer-events-none absolute inset-x-0 bottom-7 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-white">
                {p.caption}
              </p>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent px-1 py-1">
              {isCover ? (
                <form action={clearCoverPhoto.bind(null, plantId)}>
                  <button
                    type="submit"
                    className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-stone-700 hover:bg-white"
                  >
                    取消封面
                  </button>
                </form>
              ) : (
                <form action={setCoverPhoto.bind(null, plantId, p.id)}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-stone-700 hover:bg-amber-100"
                  >
                    <Star className="h-2.5 w-2.5" />
                    设为封面
                  </button>
                </form>
              )}
              <form action={deletePhoto.bind(null, p.id, plantId)}>
                <button
                  type="submit"
                  className="rounded-full bg-black/60 px-1.5 py-0.5 text-white hover:bg-rose-600"
                  aria-label="删除照片"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </form>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { ne } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { plants } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; cls: string; emoji: string }> = {
  lost: { label: "已逝", cls: "bg-stone-700 text-stone-100", emoji: "🪦" },
  archived: { label: "归档", cls: "bg-amber-700/80 text-amber-50", emoji: "📦" },
  dormant: { label: "休眠", cls: "bg-indigo-700/70 text-indigo-50", emoji: "💤" },
};

export default async function MemoriesPage() {
  const rows = await db.query.plants.findMany({
    where: ne(plants.status, "alive"),
    with: {
      species: true,
      events: { columns: { id: true } },
      photos: {
        orderBy: (p, { desc }) => desc(p.takenAt),
        limit: 1,
      },
    },
    orderBy: (p, { desc, asc }) => [desc(p.endedAt), asc(p.createdAt)],
  });

  return (
    <>
      <TopBar title="🪦 墓园 / 回忆" />
      <div className="space-y-4 px-4 py-4">
        <p className="text-xs text-stone-500">
          已逝去 / 归档 / 休眠中的植物，都在这里。点开能看完整养护历史。
        </p>
        {rows.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="还没有需要纪念的植物"
            description="希望这里一直空着。"
          />
        ) : (
          <ul className="space-y-4">
            {rows.map((p) => {
              const meta = STATUS_BADGE[p.status] ?? STATUS_BADGE.archived;
              const cover = p.photos[0];
              const lifespanDays = lifespanIn(p.acquiredAt, p.endedAt);
              return (
                <li key={p.id}>
                  <Link href={`/plants/${p.id}`} className="block">
                    <Card className="overflow-hidden p-0">
                      <div className="flex">
                        <div className="relative h-28 w-28 shrink-0 bg-stone-100 dark:bg-stone-800">
                          {cover ? (
                            <Image
                              src={cover.url}
                              alt={p.name}
                              fill
                              sizes="112px"
                              className="object-cover grayscale-[40%]"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-4xl opacity-60">
                              {meta.emoji}
                            </div>
                          )}
                          <span
                            className={`absolute left-1 top-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 p-3">
                          <CardTitle className="truncate">{p.name}</CardTitle>
                          <CardDescription className="truncate">
                            {p.species?.commonName ?? "未分类"}
                            {p.location ? ` · ${p.location}` : ""}
                          </CardDescription>
                          <p className="mt-1 text-[11px] text-stone-500">
                            {formatDate(p.acquiredAt)} — {formatDate(p.endedAt)}
                            {lifespanDays != null ? ` · 在养 ${lifespanDays} 天` : ""}
                            {p.events.length > 0 ? ` · ${p.events.length} 次记录` : ""}
                          </p>
                          {p.endingNote ? (
                            <p className="mt-1 line-clamp-2 text-xs italic text-stone-600 dark:text-stone-400">
                              「{p.endingNote}」
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function lifespanIn(
  start: Date | null | undefined,
  end: Date | null | undefined,
): number | null {
  if (!start) return null;
  const startMs = start instanceof Date ? start.getTime() : new Date(start).getTime();
  const endMs = end
    ? end instanceof Date
      ? end.getTime()
      : new Date(end).getTime()
    : Date.now();
  return Math.max(0, Math.round((endMs - startMs) / 86400000));
}

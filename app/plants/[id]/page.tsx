import { desc } from "drizzle-orm";
import { Pencil, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/delete-button";
import { PhotoGrid } from "@/components/photo-grid";
import { PhotoUploader } from "@/components/photo-uploader";
import { QuickActionRow } from "@/components/quick-actions";
import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { careEvents } from "@/lib/db/schema";
import type { Photo } from "@/lib/db/schema";
import { CARE_EVENT_META } from "@/lib/constants";
import {
  cn,
  daysSince,
  formatDate,
  formatMoney,
  relativeTime,
  waterStatus,
} from "@/lib/utils";

import { deleteEvent } from "@/app/actions/events";
import { deletePlant } from "@/app/actions/plants";

export const dynamic = "force-dynamic";

type GrowthMeta = {
  heightCm?: number | null;
  leafCount?: number | null;
  photoUrl?: string | null;
  photoUrls?: string[] | null;
};

type TabKey = "overview" | "gallery" | "log";

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "overview", label: "概览", emoji: "🪴" },
  { key: "gallery", label: "时光", emoji: "📷" },
  { key: "log", label: "日志", emoji: "📋" },
];

export default async function PlantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: idParam } = await params;
  const { tab: tabParam } = await searchParams;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const tab: TabKey = (TABS.find((t) => t.key === tabParam)?.key ?? "overview") as TabKey;

  const plant = await db.query.plants.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    with: {
      species: true,
      photos: { orderBy: (ph, { desc }) => desc(ph.takenAt) },
    },
  });
  if (!plant) notFound();

  const events = await db.query.careEvents.findMany({
    where: (e, { eq }) => eq(e.plantId, id),
    orderBy: desc(careEvents.occurredAt),
    limit: 200,
  });

  const lastWater = events.find((e) => e.type === "water");
  const water = waterStatus(lastWater?.occurredAt, plant.wateringIntervalDays);
  const companionDays = daysSince(plant.acquiredAt ?? plant.createdAt);
  const growthEvents = events.filter((e) => e.type === "growth");
  const careTimeline = events.filter((e) => e.type !== "growth");
  const photosByMonth = groupPhotosByMonth(plant.photos);
  const isEnded = plant.status === "lost" || plant.status === "archived";

  return (
    <>
      <TopBar
        title={plant.name}
        backHref="/plants"
        action={
          <Link href={`/plants/${plant.id}/edit`}>
            <Button variant="ghost" size="icon" aria-label="编辑">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <TabBar plantId={plant.id} current={tab} />

      <div className="space-y-4 px-4 py-4">
        {tab === "overview" ? (
          <>
            <Card>
              <CardTitle>{plant.name}</CardTitle>
              <CardDescription>
                {plant.species?.commonName ?? "未分类物种"}
                {plant.species?.scientificName ? ` · ${plant.species.scientificName}` : ""}
                {plant.location ? ` · ${plant.location}` : ""}
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {plant.status === "alive" ? (
                  <WaterStatusBadge water={water} />
                ) : (
                  <StatusBadge status={plant.status} endedAt={plant.endedAt} />
                )}
                {plant.stage ? (
                  <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-leaf-700 dark:bg-leaf-950/40 dark:text-leaf-300">
                    🌱 {plant.stage}
                  </span>
                ) : null}
                {plant.status === "dormant" ? (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700">
                    💤 休眠中
                  </span>
                ) : null}
                {companionDays != null ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                    🌿 已陪伴 {companionDays} 天
                  </span>
                ) : null}
              </div>
              {plant.status === "alive" ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-stone-500">快速打卡</p>
                  <QuickActionRow plantId={plant.id} />
                </div>
              ) : null}
            </Card>

            {isEnded && plant.endingNote ? (
              <Card className="border-stone-300 bg-stone-50 dark:bg-stone-900/60">
                <CardTitle className="text-sm">
                  {plant.status === "lost" ? "🪦 最后的话" : "📦 归档备注"}
                </CardTitle>
                <p className="mt-2 whitespace-pre-wrap text-sm italic text-stone-700 dark:text-stone-300">
                  {plant.endingNote}
                </p>
                {plant.endedAt ? (
                  <p className="mt-2 text-xs text-stone-500">{formatDate(plant.endedAt)}</p>
                ) : null}
              </Card>
            ) : null}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="购入日期" value={formatDate(plant.acquiredAt)} />
              <InfoItem label="价格" value={formatMoney(plant.acquiredPrice)} />
              <InfoItem label="来源" value={plant.acquiredFrom ?? "—"} />
              <InfoItem label="盆型" value={plant.potSize ?? "—"} />
            </div>

            {plant.species ? (
              <Card>
                <CardTitle className="text-sm">养护提示</CardTitle>
                <dl className="mt-2 space-y-1 text-xs text-stone-600 dark:text-stone-400">
                  {plant.species.careLight ? <CareLine label="光" value={plant.species.careLight} /> : null}
                  {plant.species.careWater ? <CareLine label="水" value={plant.species.careWater} /> : null}
                  {plant.species.careTemp ? <CareLine label="温" value={plant.species.careTemp} /> : null}
                  {plant.species.careHumidity ? (
                    <CareLine label="湿" value={plant.species.careHumidity} />
                  ) : null}
                  {plant.species.careNotes ? (
                    <p className="pt-1 text-stone-500">{plant.species.careNotes}</p>
                  ) : null}
                </dl>
              </Card>
            ) : null}

            {plant.notes ? (
              <Card>
                <CardTitle className="text-sm">备注</CardTitle>
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-300">
                  {plant.notes}
                </p>
              </Card>
            ) : null}

            <div className="pt-4">
              <DeleteButton
                action={deletePlant.bind(null, plant.id)}
                label="彻底删除这株（事件 + 照片）"
                confirmText={`确认彻底删除「${plant.name}」？所有记录无法找回。如果只是养死了或暂时不养，建议在编辑里改"状态"即可。`}
              />
            </div>
          </>
        ) : null}

        {tab === "gallery" ? (
          <>
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  照片墙 ({plant.photos.length})
                </h2>
              </div>
              <PhotoGrid
                photos={plant.photos}
                plantId={plant.id}
                coverPhotoId={plant.coverPhotoId}
              />
              <div className="mt-3">
                <PhotoUploader plantId={plant.id} />
              </div>
            </section>

            {photosByMonth.length > 0 ? (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                  🕰 时光机
                </h2>
                <div className="space-y-3">
                  {photosByMonth.map(([month, monthPhotos]) => (
                    <div key={month}>
                      <p className="mb-1 text-xs font-medium text-stone-500">{month}</p>
                      <div className="-mx-4 overflow-x-auto px-4">
                        <div className="flex gap-2 pb-1">
                          {monthPhotos.map((ph) => (
                            <Link
                              key={ph.id}
                              href={ph.url}
                              target="_blank"
                              className="shrink-0"
                            >
                              <div className="relative h-24 w-24 overflow-hidden rounded-lg">
                                <Image
                                  src={ph.url}
                                  alt=""
                                  fill
                                  sizes="96px"
                                  className="object-cover"
                                  unoptimized
                                />
                                <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5 text-[10px] text-white">
                                  {ph.takenAt ? formatDay(ph.takenAt) : ""}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-1 text-sm font-semibold text-stone-700 dark:text-stone-300">
                  <TrendingUp className="h-4 w-4" /> 成长记录 ({growthEvents.length})
                </h2>
                <Link href={`/plants/${plant.id}/growth/new`}>
                  <Button size="sm" variant="outline">
                    + 记成长
                  </Button>
                </Link>
              </div>
              {growthEvents.length === 0 ? (
                <p className="text-xs text-stone-500">
                  还没记成长。点「记成长」拍张照、量一下、记一笔，之后回顾很有意思。
                </p>
              ) : (
                <ul className="space-y-3">
                  {growthEvents.map((e) => {
                    const meta = (e.metadata as GrowthMeta | null) ?? {};
                    const urls = meta.photoUrls?.length
                      ? meta.photoUrls
                      : meta.photoUrl
                      ? [meta.photoUrl]
                      : [];
                    return (
                      <li key={e.id}>
                        <Card>
                          <div className="flex items-start gap-3">
                            <div className="shrink-0">
                              {urls.length === 0 ? (
                                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-stone-100 text-2xl dark:bg-stone-800">
                                  📈
                                </div>
                              ) : (
                                <Link href={urls[0]} target="_blank">
                                  <Image
                                    src={urls[0]}
                                    alt=""
                                    width={96}
                                    height={96}
                                    className="h-24 w-24 rounded-lg object-cover"
                                    unoptimized
                                  />
                                </Link>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-stone-500">
                                {formatDate(e.occurredAt)} · {relativeTime(e.occurredAt)}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-3 text-sm font-medium">
                                {meta.heightCm != null ? <span>📏 {meta.heightCm} cm</span> : null}
                                {meta.leafCount != null ? (
                                  <span>🍃 {meta.leafCount} 片</span>
                                ) : null}
                              </div>
                              {e.detail ? (
                                <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                                  {e.detail}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {urls.length > 1 ? (
                            <div className="-mx-1 mt-2 flex gap-1 overflow-x-auto px-1">
                              {urls.slice(1).map((u) => (
                                <Link key={u} href={u} target="_blank" className="shrink-0">
                                  <Image
                                    src={u}
                                    alt=""
                                    width={64}
                                    height={64}
                                    className="h-16 w-16 rounded-md object-cover"
                                    unoptimized
                                  />
                                </Link>
                              ))}
                            </div>
                          ) : null}
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        ) : null}

        {tab === "log" ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
              养护时间线 ({careTimeline.length})
            </h2>
            {careTimeline.length === 0 ? (
              <p className="text-xs text-stone-500">
                还没有事件。回「概览」点快速打卡，或者从底部「打卡」页进。
              </p>
            ) : (
              <ul className="space-y-2">
                {careTimeline.map((e) => {
                  const meta = CARE_EVENT_META[e.type];
                  return (
                    <li
                      key={e.id}
                      className="flex items-start justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-stone-900"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{meta?.emoji ?? "•"}</span>
                        <div>
                          <p className="text-sm font-medium">{meta?.label ?? e.type}</p>
                          <p className="text-xs text-stone-500">
                            {formatDate(e.occurredAt)} · {relativeTime(e.occurredAt)}
                          </p>
                          {e.detail ? (
                            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                              {e.detail}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <form action={deleteEvent.bind(null, e.id, plant.id)}>
                        <button
                          type="submit"
                          className="text-xs text-stone-400 hover:text-rose-600"
                        >
                          删
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </>
  );
}

function TabBar({ plantId, current }: { plantId: number; current: TabKey }) {
  return (
    <nav className="sticky top-[3.25rem] z-10 -mx-4 border-b border-stone-200 bg-white/95 px-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:top-[3.5rem]">
      <ul className="mx-auto flex max-w-3xl gap-1">
        {TABS.map((t) => {
          const active = t.key === current;
          const href = t.key === "overview" ? `/plants/${plantId}` : `/plants/${plantId}?tab=${t.key}`;
          return (
            <li key={t.key}>
              <Link
                href={href}
                scroll={false}
                className={cn(
                  "inline-flex items-center gap-1 border-b-2 px-3 py-2 text-sm font-medium transition",
                  active
                    ? "border-leaf-600 text-leaf-700 dark:text-leaf-300"
                    : "border-transparent text-stone-500 hover:text-stone-800",
                )}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function WaterStatusBadge({ water }: { water: ReturnType<typeof waterStatus> }) {
  if (water.days == null) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
        💧 还没浇过水
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5",
        water.overdue ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700",
      )}
    >
      💧 距上次浇水 {water.days} 天
      {water.overdue ? "（该浇了）" : water.dueIn != null ? `（还有 ${water.dueIn} 天）` : ""}
    </span>
  );
}

function StatusBadge({
  status,
  endedAt,
}: {
  status: string;
  endedAt: Date | null | undefined;
}) {
  if (status === "lost") {
    return (
      <span className="rounded-full bg-stone-700 px-2 py-0.5 text-stone-100">
        🪦 已逝 {endedAt ? `· ${formatDate(endedAt)}` : ""}
      </span>
    );
  }
  if (status === "archived") {
    return (
      <span className="rounded-full bg-amber-700/80 px-2 py-0.5 text-amber-50">
        📦 归档 {endedAt ? `· ${formatDate(endedAt)}` : ""}
      </span>
    );
  }
  return null;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-stone-900">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function CareLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-6 shrink-0 font-medium text-stone-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatDay(d: Date | number) {
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
}

function groupPhotosByMonth(photos: Photo[]): [string, Photo[]][] {
  const groups = new Map<string, Photo[]>();
  for (const p of photos) {
    if (!p.takenAt) continue;
    const d = p.takenAt instanceof Date ? p.takenAt : new Date(p.takenAt);
    const key = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  return Array.from(groups.entries());
}

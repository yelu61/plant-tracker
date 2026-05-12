import { desc } from "drizzle-orm";
import { ArrowLeft, Pencil, TrendingUp } from "lucide-react";
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
import { CARE_EVENT_META } from "@/lib/constants";
import { cn, formatDate, formatMoney, relativeTime, waterStatus } from "@/lib/utils";

import { deleteEvent } from "@/app/actions/events";
import { deletePlant } from "@/app/actions/plants";

export const dynamic = "force-dynamic";

type GrowthMeta = {
  heightCm?: number | null;
  leafCount?: number | null;
  photoUrl?: string | null;
};

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

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

  const growthEvents = events.filter((e) => e.type === "growth");
  const careTimeline = events.filter((e) => e.type !== "growth");

  return (
    <>
      <TopBar
        title={plant.name}
        action={
          <div className="flex gap-2">
            <Link href={`/plants/${plant.id}/edit`}>
              <Button variant="ghost" size="icon" aria-label="编辑">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />
      <div className="space-y-4 px-4 py-4">
        <Link
          href="/plants"
          className="inline-flex items-center gap-1 text-xs text-stone-500"
        >
          <ArrowLeft className="h-3 w-3" /> 返回植物
        </Link>

        <Card>
          <CardTitle>{plant.name}</CardTitle>
          <CardDescription>
            {plant.species?.commonName ?? "未分类物种"}
            {plant.species?.scientificName ? ` · ${plant.species.scientificName}` : ""}
            {plant.location ? ` · ${plant.location}` : ""}
          </CardDescription>

          <WaterStatusLine water={water} />

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-stone-500">快速打卡</p>
            <QuickActionRow plantId={plant.id} />
          </div>
        </Card>

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
              {plant.species.careHumidity ? <CareLine label="湿" value={plant.species.careHumidity} /> : null}
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

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              照片墙 ({plant.photos.length})
            </h2>
          </div>
          <PhotoGrid photos={plant.photos} plantId={plant.id} />
          <div className="mt-3">
            <PhotoUploader plantId={plant.id} />
          </div>
        </section>

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
                return (
                  <li key={e.id}>
                    <Card>
                      <div className="flex items-start gap-3">
                        {meta.photoUrl ? (
                          <Link href={meta.photoUrl} target="_blank" className="shrink-0">
                            <Image
                              src={meta.photoUrl}
                              alt=""
                              width={96}
                              height={96}
                              className="h-24 w-24 rounded-lg object-cover"
                              unoptimized
                            />
                          </Link>
                        ) : (
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-2xl dark:bg-stone-800">
                            📈
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-stone-500">
                            {formatDate(e.occurredAt)} · {relativeTime(e.occurredAt)}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 text-sm font-medium">
                            {meta.heightCm != null ? <span>📏 {meta.heightCm} cm</span> : null}
                            {meta.leafCount != null ? <span>🍃 {meta.leafCount} 片</span> : null}
                          </div>
                          {e.detail ? (
                            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">{e.detail}</p>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
            养护时间线 ({careTimeline.length})
          </h2>
          {careTimeline.length === 0 ? (
            <p className="text-xs text-stone-500">还没有事件。试试上面的快速打卡。</p>
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

        <div className="pt-4">
          <DeleteButton
            action={deletePlant.bind(null, plant.id)}
            label="归档 / 删除这株"
            confirmText={`确认删除「${plant.name}」？事件和照片记录会一并清除。`}
          />
        </div>
      </div>
    </>
  );
}

function WaterStatusLine({ water }: { water: ReturnType<typeof waterStatus> }) {
  if (water.days == null) {
    return (
      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
        💧 还没浇过水
      </p>
    );
  }
  return (
    <p
      className={cn(
        "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
        water.overdue
          ? "bg-amber-100 text-amber-700"
          : "bg-sky-100 text-sky-700",
      )}
    >
      💧 距上次浇水 {water.days} 天
      {water.overdue ? "（该浇了）" : water.dueIn != null ? `（还有 ${water.dueIn} 天）` : ""}
    </p>
  );
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

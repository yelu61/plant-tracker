import { desc } from "drizzle-orm";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/delete-button";
import { QuickActionRow } from "@/components/quick-actions";
import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { careEvents } from "@/lib/db/schema";
import { CARE_EVENT_META } from "@/lib/constants";
import { formatDate, formatMoney, relativeTime } from "@/lib/utils";

import { deleteEvent } from "@/app/actions/events";
import { deletePlant } from "@/app/actions/plants";

export const dynamic = "force-dynamic";

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
    with: { species: true },
  });
  if (!plant) notFound();

  const events = await db.query.careEvents.findMany({
    where: (e, { eq }) => eq(e.plantId, id),
    orderBy: desc(careEvents.occurredAt),
    limit: 100,
  });

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
          <h2 className="mb-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
            养护时间线 ({events.length})
          </h2>
          {events.length === 0 ? (
            <p className="text-xs text-stone-500">还没有事件。试试上面的快速打卡。</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => {
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
            confirmText={`确认删除「${plant.name}」？事件记录会一并清除。`}
          />
        </div>
      </div>
    </>
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

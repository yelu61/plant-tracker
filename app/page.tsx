import { desc, sql } from "drizzle-orm";
import { ArrowRight, Droplet, Leaf, Package, Settings, Sprout } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { careEvents, plants, supplies } from "@/lib/db/schema";
import { CARE_EVENT_META } from "@/lib/constants";
import { formatMoney, relativeTime, waterStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [plantCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(plants);

  const [eventCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(careEvents)
    .where(sql`${careEvents.occurredAt} > unixepoch('now', '-7 days')`);

  const [spendTotal] = await db
    .select({
      total: sql<number>`coalesce(sum(${supplies.price}), 0)`.mapWith(Number),
    })
    .from(supplies);

  const recent = await db.query.careEvents.findMany({
    with: { plant: true },
    orderBy: desc(careEvents.occurredAt),
    limit: 8,
  });

  const aliveWithWater = await db.query.plants.findMany({
    where: (p, { eq }) => eq(p.status, "alive"),
    with: {
      events: {
        where: (e, { eq }) => eq(e.type, "water"),
        orderBy: (e, { desc }) => desc(e.occurredAt),
        limit: 1,
      },
    },
  });
  const overdue = aliveWithWater
    .map((p) => ({
      plant: p,
      water: waterStatus(p.events[0]?.occurredAt, p.wateringIntervalDays),
    }))
    .filter((x) => x.water.overdue)
    .sort((a, b) => (b.water.days ?? 999) - (a.water.days ?? 999));

  return (
    <>
      <TopBar
        title="今天"
        action={
          <Link href="/settings" aria-label="设置">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        }
      />
      <div className="space-y-6 px-4 py-4">
        <section className="grid grid-cols-3 gap-3">
          <StatTile
            icon={<Leaf className="h-4 w-4" />}
            label="在养"
            value={plantCount?.count ?? 0}
            href="/plants"
          />
          <StatTile
            icon={<Sprout className="h-4 w-4" />}
            label="近 7 天养护"
            value={eventCount?.count ?? 0}
          />
          <StatTile
            icon={<Package className="h-4 w-4" />}
            label="累计支出"
            value={formatMoney(spendTotal?.total)}
            href="/supplies"
          />
        </section>

        {overdue.length > 0 ? (
          <section>
            <SectionHead title={`需浇水 (${overdue.length})`} href="/quick-log" linkLabel="去打卡" />
            <ul className="space-y-2">
              {overdue.map(({ plant, water }) => (
                <li key={plant.id}>
                  <Link
                    href={`/plants/${plant.id}`}
                    className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 shadow-sm ring-1 ring-amber-200 dark:bg-amber-950/30 dark:ring-amber-900"
                  >
                    <div className="flex items-center gap-3">
                      <Droplet className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium">{plant.name}</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          {water.days == null
                            ? "还没浇过"
                            : `已 ${water.days} 天没浇 · 建议每 ${water.interval} 天`}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-amber-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <SectionHead title="最近活动" href="/quick-log" linkLabel="打卡" />
          {recent.length === 0 ? (
            <Card>
              <CardTitle>还没有记录</CardTitle>
              <CardDescription className="mt-1">
                先去 <Link className="text-leaf-700 underline" href="/plants/new">添一株植物</Link>，再来「打卡」页给它浇个水。
              </CardDescription>
            </Card>
          ) : (
            <ul className="space-y-2">
              {recent.map((e) => {
                const meta = CARE_EVENT_META[e.type];
                return (
                  <li key={e.id}>
                    <Link
                      href={`/plants/${e.plantId}`}
                      className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-stone-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{meta?.emoji ?? "•"}</span>
                        <div>
                          <p className="text-sm font-medium">
                            {e.plant?.name ?? "未知"}
                          </p>
                          <p className="text-xs text-stone-500">
                            {meta?.label ?? e.type} · {relativeTime(e.occurredAt)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-stone-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function StatTile({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <Card className="p-3">
      <div className="mb-1 flex items-center gap-1 text-xs text-stone-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SectionHead({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">{title}</h2>
      {href ? (
        <Link href={href} className="text-xs font-medium text-leaf-700">
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}

import { desc, sql } from "drizzle-orm";
import { ArrowRight, Leaf, Package, Sprout } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { careEvents, plants, supplies } from "@/lib/db/schema";
import { CARE_EVENT_META } from "@/lib/constants";
import { formatMoney, relativeTime } from "@/lib/utils";

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

  return (
    <>
      <TopBar title="今天" />
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

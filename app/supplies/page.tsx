import { sql } from "drizzle-orm";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { supplies } from "@/lib/db/schema";
import { SUPPLY_CATEGORY_META } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuppliesPage() {
  const rows = await db.query.supplies.findMany({
    orderBy: (s, { desc }) => desc(s.purchasedAt),
  });

  const [totals] = await db
    .select({
      total: sql<number>`coalesce(sum(${supplies.price}), 0)`.mapWith(Number),
    })
    .from(supplies);

  const byCat = rows.reduce<Record<string, number>>((acc, r) => {
    if (r.price) acc[r.category] = (acc[r.category] ?? 0) + r.price;
    return acc;
  }, {});

  return (
    <>
      <TopBar
        title="物品 / 支出"
        action={
          <Link href="/supplies/new">
            <Button size="sm">+ 添物品</Button>
          </Link>
        }
      />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <p className="text-xs text-stone-500">累计支出</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(totals?.total)}</p>
          <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-stone-500 sm:grid-cols-3">
            {Object.entries(byCat).map(([cat, sum]) => (
              <span key={cat} className="flex justify-between">
                <span>
                  {SUPPLY_CATEGORY_META[cat]?.emoji} {SUPPLY_CATEGORY_META[cat]?.label}
                </span>
                <span className="font-medium text-stone-700">{formatMoney(sum)}</span>
              </span>
            ))}
          </div>
        </Card>

        {rows.length === 0 ? (
          <EmptyState
            icon="📦"
            title="还没有物品记录"
            description="营养土、花盆、工具…在这里登记，自动汇总开支。"
            action={
              <Link href="/supplies/new">
                <Button>添第一条</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((s) => {
              const meta = SUPPLY_CATEGORY_META[s.category];
              return (
                <li key={s.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate">
                          {meta?.emoji} {s.name}
                        </CardTitle>
                        <CardDescription>
                          {meta?.label}
                          {s.purchasedFrom ? ` · ${s.purchasedFrom}` : ""}
                          {s.purchasedAt ? ` · ${formatDate(s.purchasedAt)}` : ""}
                        </CardDescription>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold">{formatMoney(s.price)}</div>
                        {s.quantity != null ? (
                          <div className="text-xs text-stone-500">
                            {s.quantity} {s.unit ?? ""}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {s.remainingPct != null && s.remainingPct < 100 ? (
                      <div className="mt-2 h-1.5 overflow-hidden rounded bg-stone-200">
                        <div
                          className="h-full bg-leaf-500"
                          style={{ width: `${s.remainingPct}%` }}
                        />
                      </div>
                    ) : null}
                    {s.notes ? (
                      <p className="mt-2 text-xs text-stone-500">{s.notes}</p>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

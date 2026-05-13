import { sql } from "drizzle-orm";
import { Copy, Pencil } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { supplies, type Supply } from "@/lib/db/schema";
import { isDiscreteSupply, SUPPLY_CATEGORY_META } from "@/lib/constants";
import { cn, formatDate, formatMoney } from "@/lib/utils";

import { duplicateSupply } from "@/app/actions/supplies";

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

  const groups = groupByCategory(rows);

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
          {groups.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {groups.map((g) => (
                <CategorySummary key={g.category} group={g} />
              ))}
            </ul>
          ) : null}
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
            {rows.map((s) => (
              <li key={s.id}>
                <SupplyCard supply={s} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

type CategoryGroup = {
  category: string;
  items: Supply[];
  totalPrice: number;
  totalQuantity: number;
  totalInUse: number;
  avgRemaining: number | null;
};

function groupByCategory(rows: Supply[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();
  for (const r of rows) {
    const g = map.get(r.category) ?? {
      category: r.category,
      items: [],
      totalPrice: 0,
      totalQuantity: 0,
      totalInUse: 0,
      avgRemaining: null,
    };
    g.items.push(r);
    if (r.price) g.totalPrice += r.price;
    if (r.quantity) g.totalQuantity += r.quantity;
    if (r.quantityInUse) g.totalInUse += r.quantityInUse;
    map.set(r.category, g);
  }
  for (const g of map.values()) {
    if (!isDiscreteSupply(g.category)) {
      const arr = g.items
        .map((i) => i.remainingPct)
        .filter((v): v is number => v != null);
      g.avgRemaining = arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalPrice - a.totalPrice);
}

function CategorySummary({ group }: { group: CategoryGroup }) {
  const meta = SUPPLY_CATEGORY_META[group.category];
  const discrete = isDiscreteSupply(group.category);
  const idle = Math.max(0, group.totalQuantity - group.totalInUse);
  return (
    <li className="flex items-center justify-between text-xs">
      <span className="text-stone-600 dark:text-stone-400">
        {meta?.emoji} {meta?.label}
        <span className="ml-1 text-stone-400">· {group.items.length} 条</span>
      </span>
      <span className="flex items-center gap-3">
        {discrete ? (
          group.totalQuantity > 0 ? (
            <span className="text-stone-500">
              共 {group.totalQuantity} · 在用 {group.totalInUse}
              {idle > 0 ? ` · 闲 ${idle}` : ""}
            </span>
          ) : null
        ) : group.avgRemaining != null ? (
          <span className="text-stone-500">平均剩 {group.avgRemaining}%</span>
        ) : null}
        <span className="font-medium text-stone-700 dark:text-stone-200">
          {formatMoney(group.totalPrice)}
        </span>
      </span>
    </li>
  );
}

function SupplyCard({ supply }: { supply: Supply }) {
  const meta = SUPPLY_CATEGORY_META[supply.category];
  const discrete = isDiscreteSupply(supply.category);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">
            {meta?.emoji} {supply.name}
          </CardTitle>
          <CardDescription>
            {meta?.label}
            {supply.purchasedFrom ? ` · ${supply.purchasedFrom}` : ""}
            {supply.purchasedAt ? ` · ${formatDate(supply.purchasedAt)}` : ""}
          </CardDescription>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold">{formatMoney(supply.price)}</div>
        </div>
      </div>

      <SupplyProgress supply={supply} discrete={discrete} />

      {supply.notes ? (
        <p className="mt-2 text-xs text-stone-500">{supply.notes}</p>
      ) : null}

      <div className="mt-3 flex justify-end gap-2 border-t border-stone-100 pt-2 dark:border-stone-800">
        <form action={duplicateSupply.bind(null, supply.id)}>
          <Button type="submit" variant="ghost" size="sm" aria-label="复制一份">
            <Copy className="h-3 w-3" />
            复购
          </Button>
        </form>
        <Link href={`/supplies/${supply.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Pencil className="h-3 w-3" />
            编辑
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function SupplyProgress({
  supply,
  discrete,
}: {
  supply: Supply;
  discrete: boolean;
}) {
  if (discrete) {
    if (supply.quantity == null || supply.quantity === 0) return null;
    const inUse = supply.quantityInUse ?? 0;
    const idle = Math.max(0, supply.quantity - inUse);
    const usedPct = Math.min(100, Math.round((inUse / supply.quantity) * 100));
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-stone-500">
          <span>
            在用 {inUse} / 共 {supply.quantity} {supply.unit ?? ""}
          </span>
          <span>闲 {idle}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded bg-stone-200 dark:bg-stone-700">
          <div
            className="h-full bg-sky-500"
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>
    );
  }
  if (supply.remainingPct == null) {
    if (supply.quantity != null) {
      return (
        <p className="mt-2 text-xs text-stone-500">
          {supply.quantity} {supply.unit ?? ""}
        </p>
      );
    }
    return null;
  }
  const tone = supply.remainingPct > 50 ? "bg-emerald-500" : supply.remainingPct > 20 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-stone-500">
        <span>
          剩余 {supply.remainingPct}%
          {supply.quantity != null ? ` · 共 ${supply.quantity} ${supply.unit ?? ""}` : ""}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-stone-200 dark:bg-stone-700">
        <div
          className={cn("h-full", tone)}
          style={{ width: `${supply.remainingPct}%` }}
        />
      </div>
    </div>
  );
}

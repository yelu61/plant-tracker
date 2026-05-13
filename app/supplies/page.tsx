import { sql } from "drizzle-orm";
import { Copy, Pencil } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { supplies, supplyCategories, type Supply } from "@/lib/db/schema";
import { isDiscreteSupply, SUPPLY_CATEGORY_META } from "@/lib/constants";
import { cn, formatDate, formatMoney } from "@/lib/utils";

import { duplicateSupply } from "@/app/actions/supplies";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string; idle?: string }>;

export default async function SuppliesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const categoryFilter = sp.category && supplyCategories.includes(sp.category as never)
    ? (sp.category as (typeof supplyCategories)[number])
    : null;
  const idleFilter = sp.idle === "yes" || sp.idle === "no" ? sp.idle : null;

  const rows = await db.query.supplies.findMany({
    orderBy: (s, { desc }) => desc(s.purchasedAt),
  });

  const [totals] = await db
    .select({
      total: sql<number>`coalesce(sum(${supplies.price}), 0)`.mapWith(Number),
    })
    .from(supplies);

  const groups = groupByCategory(rows);

  const filtered = rows.filter((r) => {
    if (categoryFilter && r.category !== categoryFilter) return false;
    if (idleFilter) {
      if (!isDiscreteSupply(r.category)) return false;
      if (r.quantity == null) return false;
      const idle = r.quantity - (r.quantityInUse ?? 0);
      return idleFilter === "yes" ? idle > 0 : idle <= 0;
    }
    return true;
  });

  const showIdleFilter =
    categoryFilter == null || isDiscreteSupply(categoryFilter);

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
      <div className="space-y-3 px-4 py-4">
        <Card>
          <p className="text-xs text-stone-500">累计支出</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoney(totals?.total)}</p>
          {groups.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {groups.map((g) => (
                <CategorySummary
                  key={g.category}
                  group={g}
                  active={categoryFilter === g.category}
                />
              ))}
            </ul>
          ) : null}
        </Card>

        <CategoryChips active={categoryFilter} idle={idleFilter} />

        {showIdleFilter ? (
          <IdleChips active={idleFilter} category={categoryFilter} />
        ) : null}

        {filtered.length === 0 ? (
          rows.length === 0 ? (
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
            <EmptyState
              icon="🔎"
              title="没找到符合的物品"
              description="换个类别或筛选试试。"
              action={
                <Link href="/supplies">
                  <Button variant="outline">清空筛选</Button>
                </Link>
              }
            />
          )
        ) : (
          <ul className="space-y-2">
            {filtered.map((s) => (
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

function CategoryChips({
  active,
  idle,
}: {
  active: string | null;
  idle: string | null;
}) {
  const idleSuffix = idle ? `&idle=${idle}` : "";
  return (
    <nav className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 whitespace-nowrap pb-1">
        <Chip href={`/supplies${idle ? `?idle=${idle}` : ""}`} active={!active}>
          全部
        </Chip>
        {supplyCategories.map((c) => {
          const meta = SUPPLY_CATEGORY_META[c];
          return (
            <Chip
              key={c}
              href={`/supplies?category=${c}${idleSuffix}`}
              active={active === c}
            >
              {meta?.emoji} {meta?.label}
            </Chip>
          );
        })}
      </div>
    </nav>
  );
}

function IdleChips({
  active,
  category,
}: {
  active: string | null;
  category: string | null;
}) {
  const catSuffix = category ? `category=${category}&` : "";
  return (
    <div className="flex gap-2 whitespace-nowrap">
      <Chip
        size="sm"
        href={`/supplies${category ? `?category=${category}` : ""}`}
        active={!active}
      >
        闲置情况：全部
      </Chip>
      <Chip size="sm" href={`/supplies?${catSuffix}idle=yes`} active={active === "yes"}>
        有闲置
      </Chip>
      <Chip size="sm" href={`/supplies?${catSuffix}idle=no`} active={active === "no"}>
        全在用
      </Chip>
    </div>
  );
}

function Chip({
  href,
  active,
  children,
  size = "md",
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border transition",
        size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]",
        active
          ? "border-leaf-600 bg-leaf-600 text-white"
          : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300",
      )}
    >
      {children}
    </Link>
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

function CategorySummary({
  group,
  active,
}: {
  group: CategoryGroup;
  active: boolean;
}) {
  const meta = SUPPLY_CATEGORY_META[group.category];
  const discrete = isDiscreteSupply(group.category);
  const idle = Math.max(0, group.totalQuantity - group.totalInUse);
  return (
    <li>
      <Link
        href={`/supplies?category=${group.category}`}
        scroll={false}
        className={cn(
          "flex items-center justify-between rounded-lg px-2 py-1 text-xs transition",
          active && "bg-leaf-50 dark:bg-leaf-950/30",
          !active && "hover:bg-stone-100 dark:hover:bg-stone-800",
        )}
      >
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
      </Link>
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
          <div className="h-full bg-sky-500" style={{ width: `${usedPct}%` }} />
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
  const tone =
    supply.remainingPct > 50
      ? "bg-emerald-500"
      : supply.remainingPct > 20
      ? "bg-amber-500"
      : "bg-rose-500";
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-stone-500">
        <span>
          剩余 {supply.remainingPct}%
          {supply.quantity != null ? ` · 共 ${supply.quantity} ${supply.unit ?? ""}` : ""}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-stone-200 dark:bg-stone-700">
        <div className={cn("h-full", tone)} style={{ width: `${supply.remainingPct}%` }} />
      </div>
    </div>
  );
}

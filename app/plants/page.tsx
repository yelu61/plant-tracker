import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { BookOpen, Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { plants, species as speciesTbl, type Plant } from "@/lib/db/schema";
import { cn, daysSince, formatMoney, waterStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StatusKey = "alive" | "dormant" | "lost" | "archived" | "all";
const STATUS_OPTIONS: { key: StatusKey; label: string; emoji: string }[] = [
  { key: "alive", label: "在养", emoji: "🌿" },
  { key: "dormant", label: "休眠", emoji: "💤" },
  { key: "lost", label: "已逝", emoji: "🪦" },
  { key: "archived", label: "归档", emoji: "📦" },
  { key: "all", label: "全部", emoji: "✦" },
];

type SearchParams = Promise<{
  q?: string;
  status?: string;
  location?: string;
  water?: string;
  speciesId?: string;
}>;

export default async function PlantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = (STATUS_OPTIONS.find((s) => s.key === sp.status)?.key ?? "alive") as StatusKey;
  const locationFilter = sp.location ?? "";
  const waterFilter = sp.water === "overdue" || sp.water === "fresh" ? sp.water : null;
  const speciesIdFilter = sp.speciesId ?? "";

  const filters = [];
  if (status !== "all") filters.push(eq(plants.status, status));
  if (locationFilter) filters.push(eq(plants.location, locationFilter));
  if (speciesIdFilter === "none") {
    filters.push(isNull(plants.speciesId));
  } else if (speciesIdFilter) {
    filters.push(eq(plants.speciesId, Number(speciesIdFilter)));
  }

  if (q) {
    const pattern = `%${q}%`;
    const matched = await db
      .select({ id: speciesTbl.id })
      .from(speciesTbl)
      .where(
        or(like(speciesTbl.commonName, pattern), like(speciesTbl.scientificName, pattern)),
      );
    const ids = matched.map((r) => r.id);
    const searchClause =
      ids.length > 0
        ? or(
            like(plants.name, pattern),
            like(plants.location, pattern),
            like(plants.notes, pattern),
            ...ids.map((sid) => eq(plants.speciesId, sid)),
          )
        : or(
            like(plants.name, pattern),
            like(plants.location, pattern),
            like(plants.notes, pattern),
          );
    if (searchClause) filters.push(searchClause);
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const rows = await db.query.plants.findMany({
    where,
    with: {
      species: true,
      events: {
        where: (e, { eq }) => eq(e.type, "water"),
        orderBy: (e, { desc }) => desc(e.occurredAt),
        limit: 1,
      },
      photos: {
        orderBy: (p, { desc }) => desc(p.takenAt),
        limit: 1,
      },
      coverPhoto: true,
    },
    orderBy: desc(plants.createdAt),
  });

  // Overview rollup uses ALL plants (not filtered), for stable totals
  const allPlants = await db.query.plants.findMany({
    with: {
      species: true,
      events: {
        where: (e, { eq }) => eq(e.type, "water"),
        orderBy: (e, { desc }) => desc(e.occurredAt),
        limit: 1,
      },
    },
  });
  const overview = computeOverview(allPlants);

  const [plantSpend] = await db
    .select({
      total: sql<number>`coalesce(sum(${plants.acquiredPrice}), 0)`.mapWith(Number),
    })
    .from(plants);

  const enriched = rows.map((p) => {
    const lastWater = p.events[0];
    const w = waterStatus(lastWater?.occurredAt, p.wateringIntervalDays);
    return { plant: p, water: w };
  });

  const filteredByWater = waterFilter
    ? enriched.filter((x) =>
        waterFilter === "overdue" ? x.water.overdue : !x.water.overdue,
      )
    : enriched;

  const hasFilter =
    !!q || status !== "alive" || !!locationFilter || !!waterFilter || !!speciesIdFilter;

  return (
    <>
      <TopBar
        title="花园"
        action={
          <Link href="/plants/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              添植物
            </Button>
          </Link>
        }
      />
      <div className="space-y-3 px-4 py-4">
        <OverviewCard
          overview={overview}
          plantSpend={plantSpend?.total ?? 0}
          status={status}
          location={locationFilter}
          water={waterFilter}
          q={q}
          speciesId={speciesIdFilter}
        />

        <form method="get" action="/plants">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="搜：昵称 / 位置 / 物种 / 备注…"
              className="pl-8"
            />
            {status !== "alive" ? <input type="hidden" name="status" value={status} /> : null}
            {locationFilter ? <input type="hidden" name="location" value={locationFilter} /> : null}
            {waterFilter ? <input type="hidden" name="water" value={waterFilter} /> : null}
            {speciesIdFilter ? <input type="hidden" name="speciesId" value={speciesIdFilter} /> : null}
          </div>
        </form>

        <StatusChips active={status} location={locationFilter} water={waterFilter} q={q} speciesId={speciesIdFilter} />

        {overview.locations.length > 0 ? (
          <LocationChips
            active={locationFilter}
            locations={overview.locations.map((l) => l.location)}
            status={status}
            water={waterFilter}
            q={q}
            speciesId={speciesIdFilter}
          />
        ) : null}

        <WaterChips
          active={waterFilter}
          status={status}
          location={locationFilter}
          q={q}
          speciesId={speciesIdFilter}
        />

        {filteredByWater.length === 0 ? (
          hasFilter ? (
            <EmptyState
              icon="🔎"
              title="没搜到匹配的植物"
              description="换个关键字或切到「全部」试试"
              action={
                <Link href="/plants">
                  <Button variant="outline">清空筛选</Button>
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon="🌱"
              title="花园里还没有植物"
              description="把你正在养的第一株加进来吧。"
              action={
                <Link href="/plants/new">
                  <Button>添第一株</Button>
                </Link>
              }
            />
          )
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredByWater.map(({ plant: p, water: w }) => {
              const cover = p.coverPhoto ?? p.photos[0];
              const companionDays = daysSince(p.acquiredAt ?? p.createdAt);
              return (
                <li key={p.id}>
                  <Link href={`/plants/${p.id}`} className="block">
                    <Card className="overflow-hidden p-0 transition active:scale-[0.99]">
                      <div className="relative aspect-square w-full bg-stone-100 dark:bg-stone-800">
                        {cover ? (
                          <Image
                            src={cover.url}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl">🪴</div>
                        )}
                        {p.status !== "alive" ? (
                          <Badge className="absolute right-1 top-1 bg-stone-900/70 text-white">
                            {statusLabel(p.status)}
                          </Badge>
                        ) : null}
                        <Badge
                          className={cn(
                            "absolute left-1 bottom-1 backdrop-blur",
                            w.days == null || w.overdue
                              ? "bg-amber-500/90 text-white"
                              : "bg-sky-500/90 text-white",
                          )}
                        >
                          {w.days == null ? "💧 未浇" : `💧 ${w.days}天`}
                        </Badge>
                      </div>
                      <div className="p-3">
                        <CardTitle className="truncate text-sm">{p.name}</CardTitle>
                        <CardDescription className="truncate text-xs">
                          {p.species?.commonName ?? "未分类"}
                          {p.location ? ` · ${p.location}` : ""}
                        </CardDescription>
                        {companionDays != null ? (
                          <p className="mt-1 text-[11px] text-leaf-700 dark:text-leaf-300">
                            🌱 已陪伴 {companionDays} 天
                          </p>
                        ) : null}
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

type LocationRow = {
  location: string;
  total: number;
  overdue: number;
};

type SpeciesRow = {
  name: string;
  total: number;
  speciesId: number | null;
};

type Overview = {
  alive: number;
  dormant: number;
  lost: number;
  archived: number;
  overdue: number;
  species: number;
  locations: LocationRow[];
  speciesBreakdown: SpeciesRow[];
};

function computeOverview(
  plants: (Plant & { species: { commonName: string | null } | null; events: { occurredAt: Date }[] })[],
): Overview {
  const out: Overview = {
    alive: 0,
    dormant: 0,
    lost: 0,
    archived: 0,
    overdue: 0,
    species: 0,
    locations: [],
    speciesBreakdown: [],
  };
  const locMap = new Map<string, LocationRow>();
  const speciesMap = new Map<string, SpeciesRow>();
  const speciesSet = new Set<number>();
  for (const p of plants) {
    if (p.status === "alive") out.alive += 1;
    else if (p.status === "dormant") out.dormant += 1;
    else if (p.status === "lost") out.lost += 1;
    else if (p.status === "archived") out.archived += 1;
    const w = waterStatus(p.events[0]?.occurredAt, p.wateringIntervalDays);
    const isOverdue = p.status === "alive" && w.overdue;
    if (isOverdue) out.overdue += 1;
    if (p.speciesId != null) speciesSet.add(p.speciesId);
    const spName = p.species?.commonName ?? "未分类";
    const spRow = speciesMap.get(spName) ?? { name: spName, total: 0, speciesId: p.speciesId ?? null };
    spRow.total += 1;
    speciesMap.set(spName, spRow);
    if (p.location && p.status === "alive") {
      const row = locMap.get(p.location) ?? { location: p.location, total: 0, overdue: 0 };
      row.total += 1;
      if (isOverdue) row.overdue += 1;
      locMap.set(p.location, row);
    }
  }
  out.species = speciesSet.size;
  out.locations = Array.from(locMap.values()).sort((a, b) => b.total - a.total);
  out.speciesBreakdown = Array.from(speciesMap.values()).sort((a, b) => b.total - a.total);
  return out;
}

function preserveParams({
  q,
  status,
  location,
  water,
  speciesId,
}: {
  q?: string;
  status?: string;
  location?: string;
  water?: string | null;
  speciesId?: string;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status && status !== "alive") params.set("status", status);
  if (location) params.set("location", location);
  if (water) params.set("water", water);
  if (speciesId) params.set("speciesId", speciesId);
  return params;
}

function urlWith(
  base: { q?: string; status?: string; location?: string; water?: string | null; speciesId?: string },
  overrides: Partial<{ status: string; location: string; water: string; speciesId: string }>,
) {
  const merged = { ...base, ...overrides };
  const params = preserveParams(merged);
  const qs = params.toString();
  return qs ? `/plants?${qs}` : "/plants";
}

function OverviewCard({
  overview,
  plantSpend,
  status,
  location,
  water,
  q,
  speciesId,
}: {
  overview: Overview;
  plantSpend: number;
  status: string;
  location: string;
  water: string | null;
  q: string;
  speciesId: string;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>
          🌿 在养 <span className="font-semibold">{overview.alive}</span>
        </span>
        {overview.dormant > 0 ? (
          <span className="text-stone-500">💤 休眠 {overview.dormant}</span>
        ) : null}
        {overview.lost + overview.archived > 0 ? (
          <Link href="/memories" className="text-stone-500 hover:underline">
            🪦 历史 {overview.lost + overview.archived}
          </Link>
        ) : null}
        {overview.species > 0 ? (
          <span className="inline-flex items-center gap-1 text-stone-500">
            <BookOpen className="h-3.5 w-3.5" />
            {overview.species} 个物种
          </span>
        ) : null}
        {plantSpend > 0 ? (
          <span className="text-stone-500">
            💰 已投入 <span className="font-medium text-stone-700">{formatMoney(plantSpend)}</span>
          </span>
        ) : null}
        {overview.overdue > 0 ? (
          <Link
            href={urlWith({ q, status, location, water, speciesId }, { water: "overdue" })}
            scroll={false}
            className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
          >
            💧 需浇 {overview.overdue}
          </Link>
        ) : (
          <span className="ml-auto text-xs text-emerald-700">💧 全部不缺水</span>
        )}
      </div>

      {overview.speciesBreakdown.length > 0 ? (
        <div className="-mx-4 mt-3 overflow-x-auto px-4">
          <div className="flex gap-2 whitespace-nowrap pb-1">
            {overview.speciesBreakdown.map((s) => {
              const sid = s.speciesId != null ? String(s.speciesId) : "none";
              const active = speciesId === sid;
              return (
                <Link
                  key={s.name}
                  href={
                    active
                      ? urlWith({ q, status, location, water, speciesId }, { speciesId: "" })
                      : urlWith({ q, status, location, water, speciesId }, { speciesId: sid })
                  }
                  scroll={false}
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] transition",
                    active
                      ? "border-leaf-600 bg-leaf-600 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300",
                  )}
                >
                  {s.name} <span className={cn("ml-1", active ? "text-leaf-100" : "text-stone-400")}>{s.total}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function StatusChips({
  active,
  location,
  water,
  q,
  speciesId,
}: {
  active: StatusKey;
  location: string;
  water: string | null;
  q: string;
  speciesId: string;
}) {
  return (
    <nav className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 whitespace-nowrap pb-1">
        {STATUS_OPTIONS.map((s) => (
          <Chip
            key={s.key}
            href={urlWith({ q, location, water, speciesId }, { status: s.key })}
            active={active === s.key}
          >
            {s.emoji} {s.label}
          </Chip>
        ))}
      </div>
    </nav>
  );
}

function LocationChips({
  active,
  locations,
  status,
  water,
  q,
  speciesId,
}: {
  active: string;
  locations: string[];
  status: string;
  water: string | null;
  q: string;
  speciesId: string;
}) {
  return (
    <nav className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 whitespace-nowrap pb-1">
        <Chip href={urlWith({ q, status, water, speciesId }, { location: "" })} active={!active}>
          📍 全部位置
        </Chip>
        {locations.map((loc) => (
          <Chip
            key={loc}
            href={urlWith({ q, status, water, speciesId }, { location: loc })}
            active={active === loc}
          >
            {loc}
          </Chip>
        ))}
      </div>
    </nav>
  );
}

function WaterChips({
  active,
  status,
  location,
  q,
  speciesId,
}: {
  active: string | null;
  status: string;
  location: string;
  q: string;
  speciesId: string;
}) {
  return (
    <div className="flex gap-2 whitespace-nowrap">
      <Chip
        size="sm"
        href={urlWith({ q, status, location, speciesId }, { water: "" })}
        active={!active}
      >
        浇水：全部
      </Chip>
      <Chip
        size="sm"
        href={urlWith({ q, status, location, speciesId }, { water: "overdue" })}
        active={active === "overdue"}
      >
        💧 需浇
      </Chip>
      <Chip
        size="sm"
        href={urlWith({ q, status, location, speciesId }, { water: "fresh" })}
        active={active === "fresh"}
      >
        ✓ 不缺水
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

function statusLabel(s: string) {
  return { alive: "在养", dormant: "休眠", lost: "已逝", archived: "归档" }[s] ?? s;
}

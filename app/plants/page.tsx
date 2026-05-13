import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { db } from "@/lib/db";
import { plants, species as speciesTbl } from "@/lib/db/schema";
import { cn, waterStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  location?: string;
  speciesId?: string;
}>;

export default async function PlantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "alive";
  const locationFilter = sp.location ?? "";
  const speciesIdFilter = sp.speciesId ?? "";

  const filters = [];
  if (status !== "all") {
    filters.push(eq(plants.status, status as "alive" | "dormant" | "lost" | "archived"));
  }
  if (locationFilter) {
    filters.push(eq(plants.location, locationFilter));
  }
  if (speciesIdFilter) {
    const sid = Number(speciesIdFilter);
    if (Number.isFinite(sid)) filters.push(eq(plants.speciesId, sid));
  }

  if (q) {
    const pattern = `%${q}%`;
    const matchedSpecies = await db
      .select({ id: speciesTbl.id })
      .from(speciesTbl)
      .where(
        or(like(speciesTbl.commonName, pattern), like(speciesTbl.scientificName, pattern)),
      );
    const ids = matchedSpecies.map((r) => r.id);
    const speciesFilters =
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
    if (speciesFilters) filters.push(speciesFilters);
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, distinctLocations, speciesList] = await Promise.all([
    db.query.plants.findMany({
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
    }),
    db
      .selectDistinct({ location: plants.location })
      .from(plants)
      .where(sql`${plants.location} IS NOT NULL AND ${plants.location} != ''`),
    db.query.species.findMany({
      orderBy: (s, { asc }) => asc(s.commonName),
      columns: { id: true, commonName: true },
    }),
  ]);

  const locations = distinctLocations
    .map((r) => r.location)
    .filter((v): v is string => !!v)
    .sort();

  const hasFilter = !!q || status !== "alive" || !!locationFilter || !!speciesIdFilter;

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
        <form method="get" action="/plants" className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="搜：昵称 / 位置 / 物种 / 备注…"
                className="pl-8"
              />
            </div>
            <Button type="submit" variant="outline">
              筛选
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select name="location" defaultValue={locationFilter}>
              <option value="">全部位置</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </Select>
            <Select name="speciesId" defaultValue={speciesIdFilter}>
              <option value="">全部物种</option>
              {speciesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.commonName}
                </option>
              ))}
            </Select>
            <Select name="status" defaultValue={status}>
              <option value="alive">在养</option>
              <option value="dormant">休眠</option>
              <option value="lost">已逝</option>
              <option value="archived">归档</option>
              <option value="all">全部</option>
            </Select>
          </div>
        </form>

        {rows.length === 0 ? (
          hasFilter ? (
            <EmptyState
              icon="🔎"
              title="没搜到匹配的植物"
              description="换个关键字或把状态切到「全部」试试"
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
            {rows.map((p) => {
              const lastWater = p.events[0];
              const cover = p.coverPhoto ?? p.photos[0];
              const w = waterStatus(lastWater?.occurredAt, p.wateringIntervalDays);
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

function statusLabel(s: string) {
  return { alive: "在养", dormant: "休眠", lost: "已逝", archived: "归档" }[s] ?? s;
}

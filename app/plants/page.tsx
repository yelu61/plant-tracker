import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { plants } from "@/lib/db/schema";
import { cn, waterStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlantsPage() {
  const rows = await db.query.plants.findMany({
    with: {
      species: true,
      events: {
        where: (e, { eq }) => eq(e.type, "water"),
        orderBy: (e, { desc }) => desc(e.occurredAt),
        limit: 1,
      },
    },
    orderBy: desc(plants.createdAt),
  });

  return (
    <>
      <TopBar
        title="植物"
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
        {rows.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="还没有植物"
            description="把你正在养的第一株加进来吧。"
            action={
              <Link href="/plants/new">
                <Button>添第一株</Button>
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map((p) => {
              const lastWater = p.events[0];
              const w = waterStatus(lastWater?.occurredAt, p.wateringIntervalDays);
              return (
                <li key={p.id}>
                  <Link href={`/plants/${p.id}`} className="block">
                    <Card className="transition active:scale-[0.99]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle>{p.name}</CardTitle>
                          <CardDescription>
                            {p.species?.commonName ?? "未分类"}
                            {p.location ? ` · ${p.location}` : ""}
                          </CardDescription>
                        </div>
                        {p.status !== "alive" ? (
                          <Badge className="bg-stone-200 text-stone-700">
                            {statusLabel(p.status)}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-3">
                        <Badge
                          className={cn(
                            w.days == null
                              ? "bg-amber-100 text-amber-700"
                              : w.overdue
                              ? "bg-amber-100 text-amber-700"
                              : "bg-sky-100 text-sky-700",
                          )}
                        >
                          {w.days == null
                            ? "💧 还没浇过"
                            : `💧 ${w.days} 天前${w.overdue ? " · 该浇了" : ""}`}
                        </Badge>
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

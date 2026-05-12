import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { plants } from "@/lib/db/schema";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlantsPage() {
  const rows = await db.query.plants.findMany({
    with: {
      species: true,
      events: { orderBy: (e, { desc }) => desc(e.occurredAt), limit: 1 },
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
              const last = p.events[0];
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
                      <div className="mt-3 text-xs text-stone-500">
                        {last
                          ? `最近 ${last.type === "water" ? "浇水" : last.type} · ${relativeTime(last.occurredAt)}`
                          : "尚未打卡"}
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

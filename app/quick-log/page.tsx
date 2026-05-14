import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { QuickActionRow } from "@/components/quick-actions";
import { TopBar } from "@/components/bottom-nav";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuickLogPage() {
  const rows = await db.query.plants.findMany({
    where: (p, { eq }) => eq(p.status, "alive"),
    with: {
      events: { orderBy: (e, { desc }) => desc(e.occurredAt), limit: 1 },
    },
    orderBy: (p, { asc }) => asc(p.name),
  });

  return (
    <>
      <TopBar title="快速打卡" />
      <div className="space-y-3 px-4 py-4">
        <p className="text-xs text-stone-500">点一下按钮就记下了，长按可在详情页里加备注。</p>
        {rows.length === 0 ? (
          <EmptyState
            icon="🪴"
            title="还没有在养的植物"
            action={
              <Link href="/plants/new">
                <Button>先添一株</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((p) => {
              const last = p.events[0];
              return (
                <li key={p.id}>
                  <Card className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle>{p.name}</CardTitle>
                        <CardDescription>
                          {p.location ?? "—"}
                          {last ? ` · 最近 ${relativeTime(last.occurredAt)}` : " · 尚未打卡"}
                        </CardDescription>
                      </div>
                      <Link
                        href={`/plants/${p.id}`}
                        className="inline-flex items-center gap-0.5 text-xs font-medium text-leaf-700"
                      >
                        详情
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <QuickActionRow plantId={p.id} />
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

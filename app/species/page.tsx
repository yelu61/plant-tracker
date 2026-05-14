import { Plus } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/badge";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SpeciesPage() {
  const rows = await db.query.species.findMany({
    with: { plants: { columns: { id: true } } },
    orderBy: (s, { asc }) => asc(s.commonName),
  });

  return (
    <>
      <TopBar
        title="物种"
        action={
          <Link href="/species/new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              新增
            </Button>
          </Link>
        }
      />
      <div className="space-y-3 px-4 py-4">
        {rows.length === 0 ? (
          <EmptyState
            icon="📚"
            title="还没有物种条目"
            description="把你养过/想养的物种加入知识库，每株植物可关联到一个物种。"
            action={
              <Link href="/species/new">
                <Button>添第一条</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((s) => (
              <li key={s.id}>
                <Card>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{s.commonName}</CardTitle>
                      <CardDescription>
                        {s.scientificName ?? ""}
                        {s.family ? ` · ${s.family}` : ""}
                        {s.category ? ` · ${s.category}` : ""}
                      </CardDescription>
                    </div>
                    <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-medium text-leaf-700">
                      在养 {s.plants.length}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-stone-600 dark:text-stone-400 sm:grid-cols-2">
                    {s.careLight ? <CareLine label="光" value={s.careLight} /> : null}
                    {s.careWater ? <CareLine label="水" value={s.careWater} /> : null}
                    {s.careTemp ? <CareLine label="温" value={s.careTemp} /> : null}
                    {s.careHumidity ? <CareLine label="湿" value={s.careHumidity} /> : null}
                  </dl>
                  {s.careNotes ? (
                    <p className="mt-2 text-xs text-stone-500">{s.careNotes}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function CareLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-5 shrink-0 font-medium text-stone-500">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

import { PenLine } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const rows = await db.query.notes.findMany({
    with: { plant: { columns: { id: true, name: true } }, species: { columns: { id: true, commonName: true } } },
    orderBy: (n, { desc }) => desc(n.createdAt),
  });

  return (
    <>
      <TopBar
        title="经验笔记"
        action={
          <Link href="/notes/new">
            <Button size="sm">
              <PenLine className="h-3.5 w-3.5" />
              写笔记
            </Button>
          </Link>
        }
      />
      <div className="space-y-3 px-4 py-4">
        {rows.length === 0 ? (
          <EmptyState
            icon="📝"
            title="还没有笔记"
            description="把养护的经验、坑、心得记下来，下次就不会再栽。"
            action={
              <Link href="/notes/new">
                <Button>写第一条</Button>
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((n) => (
              <li key={n.id}>
                <Card>
                  <CardTitle>{n.title ?? "（无标题）"}</CardTitle>
                  <CardDescription>
                    {formatDate(n.createdAt)}
                    {n.plant ? ` · 关联 ${n.plant.name}` : ""}
                    {n.species ? ` · ${n.species.commonName}` : ""}
                  </CardDescription>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-300">
                    {n.content}
                  </p>
                  {n.tags && n.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {n.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-leaf-100 px-2 py-0.5 text-xs text-leaf-700"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
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

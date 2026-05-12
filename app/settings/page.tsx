import { sql } from "drizzle-orm";
import { Download } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { careEvents, notes, photos, plants, species, supplies } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const counts = await Promise.all([
    db.select({ c: sql<number>`count(*)`.mapWith(Number) }).from(plants),
    db.select({ c: sql<number>`count(*)`.mapWith(Number) }).from(species),
    db.select({ c: sql<number>`count(*)`.mapWith(Number) }).from(careEvents),
    db.select({ c: sql<number>`count(*)`.mapWith(Number) }).from(supplies),
    db.select({ c: sql<number>`count(*)`.mapWith(Number) }).from(photos),
    db.select({ c: sql<number>`count(*)`.mapWith(Number) }).from(notes),
  ]);
  const [p, s, e, su, ph, no] = counts.map((row) => row[0]?.c ?? 0);

  return (
    <>
      <TopBar title="设置 / 备份" />
      <div className="space-y-4 px-4 py-4">
        <Card>
          <CardTitle>数据备份</CardTitle>
          <CardDescription className="mt-1">
            打包全部数据为 JSON 下载。建议每月手动备份一次，存到云盘/本地。
          </CardDescription>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-stone-500">
            <Stat label="植物" value={p} />
            <Stat label="物种" value={s} />
            <Stat label="事件" value={e} />
            <Stat label="物品" value={su} />
            <Stat label="照片" value={ph} />
            <Stat label="笔记" value={no} />
          </dl>
          <div className="mt-4">
            <Link href="/api/export" prefetch={false}>
              <Button className="w-full">
                <Download className="h-4 w-4" />
                导出 JSON 备份
              </Button>
            </Link>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            注意：导出只含元数据；本地 dev 模式下的图片在 <code>public/uploads/</code>，需要单独备份。Vercel Blob 上的图片留在云端可远程恢复。
          </p>
        </Card>

        <Card>
          <CardTitle>关于</CardTitle>
          <CardDescription className="mt-1">
            植语 · Plant Tracker · v0.1.0 · Next 15 + Drizzle + Turso
          </CardDescription>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-stone-100 px-2 py-2 text-center dark:bg-stone-800">
      <div className="text-base font-semibold text-stone-900 dark:text-stone-100">{value}</div>
      <div className="text-[11px] text-stone-500">{label}</div>
    </div>
  );
}

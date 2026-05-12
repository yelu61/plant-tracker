import { sql } from "drizzle-orm";
import { Calendar, Download, LogOut, Skull } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { calendarUrl } from "@/lib/calendar";
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

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const icsUrl = await calendarUrl(origin);
  const passwordGate = !!process.env.APP_PASSWORD;

  return (
    <>
      <TopBar title="设置 / 备份" />
      <div className="space-y-4 px-4 py-4">
        <Link href="/memories">
          <Card className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-1">
                <Skull className="h-4 w-4" /> 墓园 / 回忆
              </CardTitle>
              <CardDescription className="mt-1">
                已逝去 / 归档 / 休眠的植物在这里
              </CardDescription>
            </div>
            <span className="text-xs text-stone-400">→</span>
          </Card>
        </Link>

        <Card>
          <CardTitle className="flex items-center gap-1">
            <Calendar className="h-4 w-4" /> 浇水日历订阅
          </CardTitle>
          <CardDescription className="mt-1">
            把下面的链接添加到系统日历（iOS / macOS / Google Calendar），就有原生提醒。每株植物按各自的浇水间隔循环。
          </CardDescription>
          <div className="mt-3 break-all rounded-lg bg-stone-100 px-3 py-2 font-mono text-xs dark:bg-stone-800">
            {icsUrl}
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            iOS：「日历」→「日历」→「添加日历」→「添加订阅日历」粘贴上面 URL。Google Calendar：左侧「其他日历」→「+」→「网址」。
          </p>
          {passwordGate ? (
            <p className="mt-1 text-[11px] text-amber-700">
              URL 含个人 token（来自你的 <code>APP_PASSWORD</code> 派生），不要分享给别人。
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-stone-500">
              当前未设置 <code>APP_PASSWORD</code>，链接无 token；上线后设了之后链接会带 token。
            </p>
          )}
        </Card>

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

        {passwordGate ? (
          <Card>
            <CardTitle>退出登录</CardTitle>
            <CardDescription className="mt-1">
              清除本设备上的登录凭据，下次访问需要再输口令。
            </CardDescription>
            <form method="post" action="/api/auth/logout" className="mt-3">
              <Button type="submit" variant="outline" className="w-full">
                <LogOut className="h-4 w-4" />
                退出
              </Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <CardTitle>关于</CardTitle>
          <CardDescription className="mt-1">
            植语 · Plant Tracker · Next 15 + Drizzle + Turso · 单用户 PWA
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

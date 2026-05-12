import { db } from "@/lib/db";
import type { Plant } from "@/lib/db/schema";
import { calendarToken } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const expected = await calendarToken();
  if (expected) {
    const got = url.searchParams.get("token");
    if (got !== expected) return new Response("forbidden", { status: 403 });
  }

  const rows = await db.query.plants.findMany({
    where: (p, { eq }) => eq(p.status, "alive"),
    with: {
      events: {
        where: (e, { eq }) => eq(e.type, "water"),
        orderBy: (e, { desc }) => desc(e.occurredAt),
        limit: 1,
      },
    },
  });

  const ics = buildIcs(
    rows.map((r) => ({ plant: r, lastWaterAt: r.events[0]?.occurredAt ?? null })),
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "max-age=1800",
    },
  });
}

function buildIcs(items: { plant: Plant; lastWaterAt: Date | null }[]): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//plant-tracker//ZH-CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:🌱 植物浇水提醒",
    "X-WR-TIMEZONE:Asia/Shanghai",
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
  ];

  for (const { plant, lastWaterAt } of items) {
    const interval = plant.wateringIntervalDays ?? 7;
    const seed = lastWaterAt ?? now;
    const due = new Date(seed.getTime() + interval * 86400000);
    due.setHours(9, 0, 0, 0);
    if (due.getTime() < now.getTime()) {
      const todayNine = new Date(now);
      todayNine.setHours(9, 0, 0, 0);
      due.setTime(
        todayNine.getTime() > now.getTime()
          ? todayNine.getTime()
          : todayNine.getTime() + 86400000,
      );
    }
    const end = new Date(due.getTime() + 15 * 60 * 1000);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:plant-${plant.id}-water@plant-tracker`);
    lines.push(`DTSTAMP:${icsUtc(now)}`);
    lines.push(`DTSTART:${icsLocal(due)}`);
    lines.push(`DTEND:${icsLocal(end)}`);
    lines.push(
      foldLine(`SUMMARY:💧 浇水：${escapeIcs(plant.name)}`),
    );
    lines.push(
      foldLine(
        `DESCRIPTION:每 ${interval} 天 · 上次浇水 ${
          lastWaterAt ? lastWaterAt.toISOString().slice(0, 10) : "未记录"
        }`,
      ),
    );
    lines.push(`RRULE:FREQ=DAILY;INTERVAL=${interval}`);
    lines.push("BEGIN:VALARM");
    lines.push("TRIGGER:-PT0M");
    lines.push("ACTION:DISPLAY");
    lines.push("DESCRIPTION:浇水时间到");
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function icsLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function icsUtc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function foldLine(s: string): string {
  if (s.length <= 75) return s;
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    const chunk = s.slice(i, i + (i === 0 ? 75 : 74));
    out.push(i === 0 ? chunk : " " + chunk);
    i += i === 0 ? 75 : 74;
  }
  return out.join("\r\n");
}

"use client";

import { useState } from "react";

import { FieldGroup, Input, Select, Textarea } from "@/components/ui/input";

const STATUS_LABELS: Record<string, string> = {
  alive: "在养",
  dormant: "休眠",
  lost: "已逝",
  archived: "归档",
};

function isoDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function StatusFields({
  defaultStatus = "alive",
  defaultEndedAt,
  defaultEndingNote,
}: {
  defaultStatus?: "alive" | "dormant" | "lost" | "archived";
  defaultEndedAt?: Date | string | null;
  defaultEndingNote?: string | null;
}) {
  const [status, setStatus] = useState(defaultStatus);
  const isEnded = status === "lost" || status === "archived";

  return (
    <>
      <FieldGroup label="状态">
        <Select
          name="status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "alive" | "dormant" | "lost" | "archived")
          }
        >
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </FieldGroup>
      {isEnded ? (
        <div className="space-y-3 rounded-lg border border-dashed border-stone-300 p-3 dark:border-stone-700">
          <p className="text-xs font-medium text-stone-500">
            {status === "lost" ? "🪦 离开记录" : "📦 归档信息"}
          </p>
          <FieldGroup label="结束日期">
            <Input
              type="date"
              name="endedAt"
              defaultValue={isoDate(defaultEndedAt)}
            />
          </FieldGroup>
          <FieldGroup
            label={status === "lost" ? "复盘 / 最后的话" : "归档备注"}
            hint={status === "lost" ? "记下原因 / 教训，下次养同种时回看" : "存档时想留的话"}
          >
            <Textarea
              name="endingNote"
              rows={3}
              defaultValue={defaultEndingNote ?? ""}
              placeholder={
                status === "lost"
                  ? "夏季高温没控水，下次试试少水多通风…"
                  : "暂时不再追踪，但留个念想…"
              }
            />
          </FieldGroup>
        </div>
      ) : null}
    </>
  );
}

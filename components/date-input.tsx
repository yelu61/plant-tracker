"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-stone-400 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900";

function isoDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function parseISODate(iso: string) {
  if (!iso) return { year: "", month: "", day: "" };
  const [year, month, day] = iso.split("-");
  return { year, month, day };
}

export function DateInput({
  name,
  defaultValue,
  className,
}: {
  name: string;
  defaultValue?: Date | string | null;
  className?: string;
}) {
  const initial = parseISODate(isoDate(defaultValue));
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: currentYear - 1999 + 1 }, (_, i) => String(2000 + i)),
    [currentYear]
  );
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")),
    []
  );

  const daysInMonth = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0")),
    [daysInMonth]
  );

  useEffect(() => {
    if (day && Number(day) > daysInMonth) {
      setDay(String(daysInMonth).padStart(2, "0"));
    }
  }, [year, month, daysInMonth, day]);

  const value = year && month && day ? `${year}-${month}-${day}` : "";

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        className={cn(baseField, "h-10 flex-1")}
        value={year}
        onChange={(e) => setYear(e.target.value)}
      >
        <option value="">年</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        className={cn(baseField, "h-10 flex-1")}
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      >
        <option value="">月</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {Number(m)}
          </option>
        ))}
      </select>
      <select
        className={cn(baseField, "h-10 flex-1")}
        value={day}
        onChange={(e) => setDay(e.target.value)}
      >
        <option value="">日</option>
        {days.map((d) => (
          <option key={d} value={d}>
            {Number(d)}
          </option>
        ))}
      </select>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

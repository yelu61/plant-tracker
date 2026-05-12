import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function relativeTime(date: Date | number | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "number" ? new Date(date * 1000) : date;
  const diff = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / 86400 / 30), "month");
  return rtf.format(Math.round(diff / 86400 / 365), "year");
}

export function formatDate(date: Date | number | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "number" ? new Date(date * 1000) : date;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatMoney(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(n);
}

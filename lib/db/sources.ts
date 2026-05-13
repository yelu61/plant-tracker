import { sql } from "drizzle-orm";

import { db } from ".";
import { plants, supplies } from "./schema";

const PRESET_PURCHASE_SOURCES = [
  "淘宝",
  "拼多多",
  "京东",
  "咸鱼",
  "花市",
  "苗圃",
  "友赠",
  "自繁殖",
];

const PRESET_UNITS = [
  "袋",
  "包",
  "瓶",
  "罐",
  "kg",
  "g",
  "L",
  "mL",
  "个",
  "把",
  "张",
  "根",
  "米",
  "盒",
  "支",
];

const PRESET_STAGES = [
  "萌发期",
  "幼苗期",
  "生长期",
  "营养期",
  "抽枝期",
  "孕蕾期",
  "花期",
  "结果期",
  "休眠期",
  "越冬期",
];

export async function getDistinctPurchaseSources(): Promise<string[]> {
  const [a, b] = await Promise.all([
    db
      .selectDistinct({ v: plants.acquiredFrom })
      .from(plants)
      .where(sql`${plants.acquiredFrom} IS NOT NULL AND ${plants.acquiredFrom} != ''`),
    db
      .selectDistinct({ v: supplies.purchasedFrom })
      .from(supplies)
      .where(sql`${supplies.purchasedFrom} IS NOT NULL AND ${supplies.purchasedFrom} != ''`),
  ]);
  const set = new Set<string>(PRESET_PURCHASE_SOURCES);
  for (const r of a) if (r.v) set.add(r.v);
  for (const r of b) if (r.v) set.add(r.v);
  return Array.from(set).sort((x, y) => x.localeCompare(y, "zh-Hans-CN"));
}

export async function getDistinctLocations(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ v: plants.location })
    .from(plants)
    .where(sql`${plants.location} IS NOT NULL AND ${plants.location} != ''`);
  return rows
    .map((r) => r.v)
    .filter((v): v is string => !!v)
    .sort((x, y) => x.localeCompare(y, "zh-Hans-CN"));
}

export async function getDistinctUnits(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ v: supplies.unit })
    .from(supplies)
    .where(sql`${supplies.unit} IS NOT NULL AND ${supplies.unit} != ''`);
  const set = new Set<string>(PRESET_UNITS);
  for (const r of rows) if (r.v) set.add(r.v);
  return Array.from(set).sort((x, y) => x.localeCompare(y, "zh-Hans-CN"));
}

export async function getDistinctStages(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ v: plants.stage })
    .from(plants)
    .where(sql`${plants.stage} IS NOT NULL AND ${plants.stage} != ''`);
  const set = new Set<string>(PRESET_STAGES);
  for (const r of rows) if (r.v) set.add(r.v);
  return Array.from(set);
}

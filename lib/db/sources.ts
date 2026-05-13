import { sql } from "drizzle-orm";

import { db } from ".";
import { plants, supplies } from "./schema";

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
  const set = new Set<string>();
  for (const r of a) if (r.v) set.add(r.v);
  for (const r of b) if (r.v) set.add(r.v);
  return Array.from(set).sort();
}

export async function getDistinctLocations(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ v: plants.location })
    .from(plants)
    .where(sql`${plants.location} IS NOT NULL AND ${plants.location} != ''`);
  return rows
    .map((r) => r.v)
    .filter((v): v is string => !!v)
    .sort();
}

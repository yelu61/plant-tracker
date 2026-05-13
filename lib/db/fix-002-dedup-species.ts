import { sql } from "drizzle-orm";

import { db } from "./index";

async function main() {
  // 1. 把重复行只留 id 最小的那一条
  const before = await db.all<{ c: number }>(sql`SELECT count(*) as c FROM species`);
  const dupes = await db.all<{ common_name: string; n: number }>(
    sql`SELECT common_name, count(*) as n FROM species GROUP BY common_name HAVING n > 1`,
  );
  if (dupes.length > 0) {
    console.log("发现重复:");
    for (const d of dupes) console.log(`  · ${d.common_name} x ${d.n}`);
    await db.run(sql`
      DELETE FROM species
      WHERE id NOT IN (SELECT MIN(id) FROM species GROUP BY common_name)
    `);
    console.log(`已去重。`);
  } else {
    console.log("没有重复行。");
  }
  const after = await db.all<{ c: number }>(sql`SELECT count(*) as c FROM species`);
  console.log(`species 从 ${before[0].c} 行 → ${after[0].c} 行`);

  // 2. 给 common_name 加唯一索引（如果还没有的话）
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS species_common_name_unique ON species(common_name)`,
  );
  console.log("已确保 species.common_name 有唯一索引。");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

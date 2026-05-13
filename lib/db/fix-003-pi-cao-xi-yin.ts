import { eq } from "drizzle-orm";

import { db } from "./index";
import { species } from "./schema";

async function main() {
  // 1. 把"皮草花"的学名 / 养护信息纠正成 Primulina（不是 Episcia）
  const updated = await db
    .update(species)
    .set({
      scientificName: "Primulina spp.",
      family: "苦苣苔科",
      category: "苦苣苔",
      careLight: "明亮散光至半阴",
      careWater: "表土微干浇水，浸盆更稳",
      careTemp: "15-25°C",
      careHumidity: "中高",
      careNotes: "叶面有皮革感／绒毛，皮实耐养；春季集中开花。",
    })
    .where(eq(species.commonName, "皮草花"))
    .returning({ id: species.id });
  console.log(`皮草花: 更新了 ${updated.length} 行`);

  // 2. 把"喜荫花" (Episcia cupreata) 作为新独立物种添加
  const inserted = await db
    .insert(species)
    .values({
      commonName: "喜荫花",
      scientificName: "Episcia cupreata",
      family: "苦苣苔科",
      category: "苦苣苔/观叶",
      careLight: "明亮散光",
      careWater: "表土微干就浇，浸盆为主",
      careTemp: "18-28°C",
      careHumidity: "高",
      careNotes: "铜色绒毛叶；叶面忌沾水易留斑；冬季 < 15°C 易冻伤。",
    })
    .onConflictDoNothing()
    .returning({ id: species.id });
  console.log(`喜荫花: 新增 ${inserted.length} 行`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

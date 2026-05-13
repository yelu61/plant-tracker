import { eq } from "drizzle-orm";

import { db } from "./index";
import { species } from "./schema";

type Fix = Partial<typeof species.$inferInsert> & { commonName: string };

const FIXES: Fix[] = [
  {
    commonName: "迷岩",
    scientificName: "Petrocosmea spp.",
    family: "苦苣苔科",
    category: "苦苣苔",
    careLight: "明亮散光，避免直射",
    careWater: "表土微干浇水，避免叶面",
    careTemp: "15-25°C",
    careHumidity: "中高",
    careNotes: "莲座状叶片对生；忌闷热，喜稳定湿度，浸盆更安全。",
  },
  {
    commonName: "迷套",
    scientificName: "Primulina spp.",
    family: "苦苣苔科",
    category: "苦苣苔",
    careLight: "明亮散光",
    careWater: "表土微干浇水，浸盆更稳",
    careTemp: "15-25°C",
    careHumidity: "中高",
    careNotes: "喜稳湿不喜叶面水；夏季多通风防化水。",
  },
  {
    commonName: "花猫",
    scientificName: "Primulina 'Hua Mao'",
    family: "苦苣苔科",
    category: "苦苣苔",
    careLight: "明亮散光",
    careWater: "表土微干浇水，避免叶面",
    careTemp: "15-25°C",
    careHumidity: "中高",
    careNotes: "锦化苦苣苔，光照足时叶纹更清晰；忌烈日。",
  },
  {
    commonName: "堇兰",
    scientificName: "Saintpaulia ionantha",
    family: "苦苣苔科",
    category: "苦苣苔",
    careLight: "明亮散光",
    careWater: "浸盆为主，叶面忌沾水",
    careTemp: "18-25°C",
    careHumidity: "中高",
    careNotes: "即非洲堇；叶面留水会出黄斑；用温水浸盆 20 分钟。",
  },
];

async function main() {
  let updated = 0;
  for (const { commonName, ...rest } of FIXES) {
    const res = await db
      .update(species)
      .set(rest)
      .where(eq(species.commonName, commonName))
      .returning({ id: species.id });
    if (res.length > 0) {
      updated += res.length;
      console.log(`  ✓ ${commonName} → 苦苣苔科`);
    } else {
      console.log(`  · ${commonName} 没在库里，跳过`);
    }
  }
  console.log(`Updated ${updated} species.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

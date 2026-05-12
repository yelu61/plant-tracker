import { db } from "./index";
import { species } from "./schema";

const SEED: (typeof species.$inferInsert)[] = [
  {
    commonName: "绿萝",
    scientificName: "Epipremnum aureum",
    family: "天南星科",
    category: "观叶",
    careLight: "散光，避免直射",
    careWater: "土干透浇透，约 5-10 天 / 次",
    careTemp: "15-28°C",
    careHumidity: "中高湿度，可叶面喷雾",
    careNotes: "极易繁殖，剪枝水插即可生根。",
  },
  {
    commonName: "多肉·桃蛋",
    scientificName: "Graptopetalum amethystinum",
    family: "景天科",
    category: "多肉",
    careLight: "全日照，弱光易徒长",
    careWater: "干透浇透，秋冬控水",
    careTemp: "5-30°C，怕高温闷",
    careHumidity: "低，需通风",
    careNotes: "夏季避免暴晒+雨淋；冷凉季节出粉上色。",
  },
  {
    commonName: "龟背竹",
    scientificName: "Monstera deliciosa",
    family: "天南星科",
    category: "观叶",
    careLight: "明亮散光",
    careWater: "表土干 2-3cm 再浇，约 7 天 / 次",
    careTemp: "18-30°C",
    careHumidity: "中高湿度，叶面喷雾或加湿器",
    careNotes: "立柱可促叶片开裂；春夏施肥 2-4 周一次。",
  },
];

async function main() {
  await db.insert(species).values(SEED).onConflictDoNothing();
  console.log(`Seeded ${SEED.length} species.`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});

import { sql } from "drizzle-orm";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { SpeciesPicker } from "@/components/species-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Textarea } from "@/components/ui/input";
import { db } from "@/lib/db";
import { plants } from "@/lib/db/schema";

import { createPlant } from "@/app/actions/plants";

export const dynamic = "force-dynamic";

export default async function NewPlantPage() {
  const [speciesList, distinctLocations, distinctSources] = await Promise.all([
    db.query.species.findMany({ orderBy: (s, { asc }) => asc(s.commonName) }),
    db
      .selectDistinct({ v: plants.location })
      .from(plants)
      .where(sql`${plants.location} IS NOT NULL AND ${plants.location} != ''`),
    db
      .selectDistinct({ v: plants.acquiredFrom })
      .from(plants)
      .where(sql`${plants.acquiredFrom} IS NOT NULL AND ${plants.acquiredFrom} != ''`),
  ]);
  const locations = distinctLocations.map((r) => r.v).filter((v): v is string => !!v).sort();
  const sources = distinctSources.map((r) => r.v).filter((v): v is string => !!v).sort();

  return (
    <>
      <TopBar title="添植物" />
      <form action={createPlant} className="space-y-4 px-4 py-4">
        <Card className="space-y-4">
          <FieldGroup label="昵称 *">
            <Input name="name" required placeholder="比如：阳台绿萝 #1" autoFocus />
          </FieldGroup>

          <SpeciesPicker species={speciesList} />

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="位置">
              <Input name="location" list="dl-locations" placeholder="阳台 / 客厅 / …" />
              <datalist id="dl-locations">
                {locations.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </FieldGroup>
            <FieldGroup label="盆型/口径">
              <Input name="potSize" placeholder="陶盆 12cm" />
            </FieldGroup>
          </div>

          <FieldGroup label="阶段（选填）" hint="比如 萌发 / 生长期 / 花期 / 休眠期">
            <Input name="stage" placeholder="生长期" />
          </FieldGroup>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-medium text-stone-500">购入信息（选填）</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="购入日期">
              <Input type="date" name="acquiredAt" />
            </FieldGroup>
            <FieldGroup label="价格 (¥)">
              <Input type="number" step="0.01" name="acquiredPrice" placeholder="0.00" />
            </FieldGroup>
          </div>
          <FieldGroup label="购入途径">
            <Input
              name="acquiredFrom"
              list="dl-sources"
              placeholder="花市 / 拼多多 / 朋友送 …"
            />
            <datalist id="dl-sources">
              {sources.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FieldGroup>
        </Card>

        <Card>
          <FieldGroup label="备注">
            <Textarea name="notes" placeholder="任何想记的：脾气、习性、注意点。" rows={4} />
          </FieldGroup>
        </Card>

        <div className="flex gap-3">
          <Link href="/plants" className="flex-1">
            <Button variant="outline" className="w-full">
              取消
            </Button>
          </Link>
          <Button type="submit" className="flex-1">
            保存
          </Button>
        </div>
      </form>
    </>
  );
}

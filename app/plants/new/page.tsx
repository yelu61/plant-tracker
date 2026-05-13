import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { FreeCombobox } from "@/components/free-combobox";
import { SpeciesPicker } from "@/components/species-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/date-input";
import { FieldGroup, Input, Textarea } from "@/components/ui/input";
import { db } from "@/lib/db";
import {
  getDistinctLocations,
  getDistinctPurchaseSources,
  getDistinctStages,
} from "@/lib/db/sources";

import { createPlant } from "@/app/actions/plants";

export const dynamic = "force-dynamic";

export default async function NewPlantPage() {
  const [speciesList, locations, sources, stages] = await Promise.all([
    db.query.species.findMany({ orderBy: (s, { asc }) => asc(s.commonName) }),
    getDistinctLocations(),
    getDistinctPurchaseSources(),
    getDistinctStages(),
  ]);

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
              <FreeCombobox
                name="location"
                options={locations}
                placeholder="阳台 / 客厅 / …"
              />
            </FieldGroup>
            <FieldGroup label="盆型/口径">
              <Input name="potSize" placeholder="陶盆 12cm" />
            </FieldGroup>
          </div>

          <FieldGroup label="阶段（选填）" hint="按需选个标签，可自定义">
            <FreeCombobox
              name="stage"
              options={stages}
              placeholder="生长期 / 花期 / 休眠期 …"
            />
          </FieldGroup>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-medium text-stone-500">购入信息（选填）</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="购入日期">
              <DateInput name="acquiredAt" />
            </FieldGroup>
            <FieldGroup label="价格 (¥)">
              <Input type="number" step="0.01" name="acquiredPrice" placeholder="0.00" />
            </FieldGroup>
          </div>
          <FieldGroup label="购入途径">
            <FreeCombobox
              name="acquiredFrom"
              options={sources}
              placeholder="花市 / 拼多多 / 咸鱼 / 朋友送 …"
            />
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

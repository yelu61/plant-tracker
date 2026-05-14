import { Save } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TopBar } from "@/components/bottom-nav";
import { FreeCombobox } from "@/components/free-combobox";
import { SpeciesPicker } from "@/components/species-picker";
import { StatusFields } from "@/components/status-fields";
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

import { updatePlant } from "@/app/actions/plants";

export const dynamic = "force-dynamic";

export default async function EditPlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const plant = await db.query.plants.findFirst({
    where: (p, { eq }) => eq(p.id, id),
  });
  if (!plant) notFound();

  const [speciesList, locations, sources, stages] = await Promise.all([
    db.query.species.findMany({ orderBy: (s, { asc }) => asc(s.commonName) }),
    getDistinctLocations(),
    getDistinctPurchaseSources(),
    getDistinctStages(),
  ]);

  return (
    <>
      <TopBar title={`编辑：${plant.name}`} />
      <form action={updatePlant.bind(null, plant.id)} className="space-y-4 px-4 py-4">
        <Card className="space-y-4">
          <FieldGroup label="昵称 *">
            <Input name="name" required defaultValue={plant.name} />
          </FieldGroup>
          <SpeciesPicker
            species={speciesList}
            defaultSpeciesId={plant.speciesId ?? null}
            defaultIntervalDays={plant.wateringIntervalDays ?? null}
          />
          <StatusFields
            defaultStatus={plant.status}
            defaultEndedAt={plant.endedAt}
            defaultEndingNote={plant.endingNote}
          />
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="位置">
              <FreeCombobox
                name="location"
                options={locations}
                defaultValue={plant.location}
              />
            </FieldGroup>
            <FieldGroup label="盆型">
              <Input name="potSize" defaultValue={plant.potSize ?? ""} />
            </FieldGroup>
          </div>
          <FieldGroup label="阶段（选填）" hint="按需选个标签，可自定义">
            <FreeCombobox
              name="stage"
              options={stages}
              defaultValue={plant.stage}
              placeholder="生长期 / 花期 / 休眠期 …"
            />
          </FieldGroup>
        </Card>

        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="购入日期">
              <DateInput name="acquiredAt" defaultValue={plant.acquiredAt} />
            </FieldGroup>
            <FieldGroup label="价格 (¥)">
              <Input
                type="number"
                step="0.01"
                name="acquiredPrice"
                defaultValue={plant.acquiredPrice ?? ""}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="购入途径">
            <FreeCombobox
              name="acquiredFrom"
              options={sources}
              defaultValue={plant.acquiredFrom}
            />
          </FieldGroup>
        </Card>

        <Card>
          <FieldGroup label="备注">
            <Textarea name="notes" defaultValue={plant.notes ?? ""} rows={4} />
          </FieldGroup>
        </Card>

        <div className="flex gap-3">
          <Link href={`/plants/${plant.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              取消
            </Button>
          </Link>
          <Button type="submit" className="flex-1">
            <Save className="h-4 w-4" />
            保存
          </Button>
        </div>
      </form>
    </>
  );
}

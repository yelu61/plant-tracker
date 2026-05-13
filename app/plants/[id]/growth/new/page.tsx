import Link from "next/link";
import { notFound } from "next/navigation";

import { TopBar } from "@/components/bottom-nav";
import { MultiPhotoInput } from "@/components/multi-photo-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/date-input";
import { FieldGroup, Input, Textarea } from "@/components/ui/input";
import { db } from "@/lib/db";

import { logGrowth } from "@/app/actions/events";

export const dynamic = "force-dynamic";

export default async function NewGrowthPage({
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

  return (
    <>
      <TopBar title={`记成长：${plant.name}`} />
      <form
        action={logGrowth.bind(null, plant.id)}
        encType="multipart/form-data"
        className="space-y-4 px-4 py-4"
      >
        <Card className="space-y-4">
          <FieldGroup label="照片" hint="可加多张（正/侧/局部），自动压缩上传">
            <MultiPhotoInput />
          </FieldGroup>
          <FieldGroup label="日期">
            <DateInput name="occurredAt" defaultValue={new Date()} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="高度 (cm)">
              <Input type="number" step="0.1" name="heightCm" placeholder="比如 32" />
            </FieldGroup>
            <FieldGroup label="叶子数量">
              <Input type="number" name="leafCount" placeholder="比如 12" />
            </FieldGroup>
          </div>
          <FieldGroup label="备注">
            <Textarea
              name="detail"
              rows={3}
              placeholder="本次观察：抽新叶、长气根、出花苞、叶尖发黄…"
            />
          </FieldGroup>
        </Card>

        <div className="flex gap-3">
          <Link href={`/plants/${plant.id}`} className="flex-1">
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

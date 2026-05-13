import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/delete-button";
import { TopBar } from "@/components/bottom-nav";
import { FreeCombobox } from "@/components/free-combobox";
import { SupplyAmountFields } from "@/components/supply-amount-fields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/date-input";
import { FieldGroup, Input, Textarea } from "@/components/ui/input";
import { db } from "@/lib/db";
import { getDistinctPurchaseSources, getDistinctUnits } from "@/lib/db/sources";

import { deleteSupply, updateSupply } from "@/app/actions/supplies";

export const dynamic = "force-dynamic";

export default async function EditSupplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const supply = await db.query.supplies.findFirst({
    where: (s, { eq }) => eq(s.id, id),
  });
  if (!supply) notFound();

  const [sources, units] = await Promise.all([
    getDistinctPurchaseSources(),
    getDistinctUnits(),
  ]);

  return (
    <>
      <TopBar title={`编辑：${supply.name}`} backHref="/supplies" />
      <form action={updateSupply.bind(null, supply.id)} className="space-y-4 px-4 py-4">
        <Card className="space-y-4">
          <FieldGroup label="名称 *">
            <Input name="name" required defaultValue={supply.name} />
          </FieldGroup>
          <SupplyAmountFields
            defaultCategory={supply.category}
            defaults={{
              quantity: supply.quantity,
              quantityInUse: supply.quantityInUse,
              unit: supply.unit,
              remainingPct: supply.remainingPct,
            }}
            unitOptions={units}
          />
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="购入日期">
              <DateInput name="purchasedAt" defaultValue={supply.purchasedAt} />
            </FieldGroup>
            <FieldGroup label="价格 (¥)">
              <Input
                type="number"
                step="0.01"
                name="price"
                defaultValue={supply.price ?? ""}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="来源 / 购入途径">
            <FreeCombobox
              name="purchasedFrom"
              options={sources}
              defaultValue={supply.purchasedFrom}
            />
          </FieldGroup>
          <FieldGroup label="备注">
            <Textarea name="notes" rows={3} defaultValue={supply.notes ?? ""} />
          </FieldGroup>
        </Card>

        <div className="flex gap-3">
          <Link href="/supplies" className="flex-1">
            <Button variant="outline" className="w-full">
              取消
            </Button>
          </Link>
          <Button type="submit" className="flex-1">
            保存
          </Button>
        </div>

        <div className="pt-2">
          <DeleteButton
            action={deleteSupply.bind(null, supply.id)}
            label="删除这条物品记录"
            confirmText={`确认删除「${supply.name}」？`}
          />
        </div>
      </form>
    </>
  );
}

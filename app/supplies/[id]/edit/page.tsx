import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton } from "@/components/delete-button";
import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/input";
import { SUPPLY_CATEGORY_META } from "@/lib/constants";
import { db } from "@/lib/db";
import { supplyCategories } from "@/lib/db/schema";
import { getDistinctPurchaseSources } from "@/lib/db/sources";

import { deleteSupply, updateSupply } from "@/app/actions/supplies";

export const dynamic = "force-dynamic";

function isoDate(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

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

  const sources = await getDistinctPurchaseSources();

  return (
    <>
      <TopBar title={`编辑：${supply.name}`} />
      <form action={updateSupply.bind(null, supply.id)} className="space-y-4 px-4 py-4">
        <Card className="space-y-4">
          <FieldGroup label="名称 *">
            <Input name="name" required defaultValue={supply.name} />
          </FieldGroup>
          <FieldGroup label="类别 *">
            <Select name="category" required defaultValue={supply.category}>
              {supplyCategories.map((c) => (
                <option key={c} value={c}>
                  {SUPPLY_CATEGORY_META[c].emoji} {SUPPLY_CATEGORY_META[c].label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="购入日期">
              <Input type="date" name="purchasedAt" defaultValue={isoDate(supply.purchasedAt)} />
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
            <Input
              name="purchasedFrom"
              defaultValue={supply.purchasedFrom ?? ""}
              list="dl-sources"
            />
            <datalist id="dl-sources">
              {sources.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </FieldGroup>
          <div className="grid grid-cols-3 gap-3">
            <FieldGroup label="总数量">
              <Input
                type="number"
                step="0.01"
                name="quantity"
                defaultValue={supply.quantity ?? ""}
              />
            </FieldGroup>
            <FieldGroup label="在用">
              <Input
                type="number"
                step="0.01"
                name="quantityInUse"
                defaultValue={supply.quantityInUse ?? ""}
                placeholder="比如盆 3"
              />
            </FieldGroup>
            <FieldGroup label="单位">
              <Input name="unit" defaultValue={supply.unit ?? ""} placeholder="袋 / L / 个" />
            </FieldGroup>
          </div>
          <FieldGroup label="剩余 %" hint="对消耗类物品（土、肥、药）有意义">
            <Input
              type="number"
              name="remainingPct"
              min={0}
              max={100}
              defaultValue={supply.remainingPct ?? 100}
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

import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { FreeCombobox } from "@/components/free-combobox";
import { SupplyAmountFields } from "@/components/supply-amount-fields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateInput } from "@/components/date-input";
import { FieldGroup, Input, Textarea } from "@/components/ui/input";
import { getDistinctPurchaseSources, getDistinctUnits } from "@/lib/db/sources";

import { createSupply } from "@/app/actions/supplies";

export const dynamic = "force-dynamic";

export default async function NewSupplyPage() {
  const [sources, units] = await Promise.all([
    getDistinctPurchaseSources(),
    getDistinctUnits(),
  ]);

  return (
    <>
      <TopBar title="添物品" backHref="/supplies" />
      <form action={createSupply} className="space-y-4 px-4 py-4">
        <Card className="space-y-4">
          <FieldGroup label="名称 *">
            <Input name="name" required placeholder="如：通用配方土 5L" autoFocus />
          </FieldGroup>
          <SupplyAmountFields unitOptions={units} />
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="购入日期">
              <DateInput name="purchasedAt" />
            </FieldGroup>
            <FieldGroup label="价格 (¥)">
              <Input type="number" step="0.01" name="price" placeholder="0.00" />
            </FieldGroup>
          </div>
          <FieldGroup label="来源 / 购入途径">
            <FreeCombobox
              name="purchasedFrom"
              options={sources}
              placeholder="淘宝 / 花市 / 咸鱼 …"
            />
          </FieldGroup>
          <FieldGroup label="备注">
            <Textarea name="notes" rows={3} placeholder="用感、性价比、回购意愿…" />
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
      </form>
    </>
  );
}

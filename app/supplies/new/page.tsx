import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/input";
import { SUPPLY_CATEGORY_META } from "@/lib/constants";
import { supplyCategories } from "@/lib/db/schema";

import { createSupply } from "@/app/actions/supplies";

export default function NewSupplyPage() {
  return (
    <>
      <TopBar title="添物品" />
      <form action={createSupply} className="space-y-4 px-4 py-4">
        <Card className="space-y-4">
          <FieldGroup label="名称 *">
            <Input name="name" required placeholder="如：通用配方土 5L" autoFocus />
          </FieldGroup>
          <FieldGroup label="类别 *">
            <Select name="category" required defaultValue="soil">
              {supplyCategories.map((c) => (
                <option key={c} value={c}>
                  {SUPPLY_CATEGORY_META[c].emoji} {SUPPLY_CATEGORY_META[c].label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="购入日期">
              <Input type="date" name="purchasedAt" />
            </FieldGroup>
            <FieldGroup label="价格 (¥)">
              <Input type="number" step="0.01" name="price" placeholder="0.00" />
            </FieldGroup>
          </div>
          <FieldGroup label="来源">
            <Input name="purchasedFrom" placeholder="淘宝 / 花市 …" />
          </FieldGroup>
          <div className="grid grid-cols-3 gap-3">
            <FieldGroup label="总数量">
              <Input type="number" step="0.01" name="quantity" placeholder="5" />
            </FieldGroup>
            <FieldGroup label="在用">
              <Input type="number" step="0.01" name="quantityInUse" placeholder="3" />
            </FieldGroup>
            <FieldGroup label="单位">
              <Input name="unit" placeholder="袋 / L / 个" />
            </FieldGroup>
          </div>
          <FieldGroup label="剩余 %" hint="对消耗类（土、肥、药）有意义；花盆这类填总数量即可">
            <Input type="number" name="remainingPct" min={0} max={100} defaultValue={100} />
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

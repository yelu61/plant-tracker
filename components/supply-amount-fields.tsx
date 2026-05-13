"use client";

import { useState } from "react";

import { FreeCombobox } from "@/components/free-combobox";
import { FieldGroup, Input, Select } from "@/components/ui/input";
import { isDiscreteSupply, SUPPLY_CATEGORY_META } from "@/lib/constants";
import { supplyCategories } from "@/lib/db/schema";

export function SupplyAmountFields({
  defaultCategory = "soil",
  defaults,
  unitOptions,
}: {
  defaultCategory?: (typeof supplyCategories)[number];
  defaults?: {
    quantity?: number | null;
    quantityInUse?: number | null;
    unit?: string | null;
    remainingPct?: number | null;
  };
  unitOptions: string[];
}) {
  const [category, setCategory] = useState<(typeof supplyCategories)[number]>(defaultCategory);
  const discrete = isDiscreteSupply(category);

  return (
    <>
      <FieldGroup label="类别 *">
        <Select
          name="category"
          required
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as (typeof supplyCategories)[number])
          }
        >
          {supplyCategories.map((c) => (
            <option key={c} value={c}>
              {SUPPLY_CATEGORY_META[c].emoji} {SUPPLY_CATEGORY_META[c].label}
            </option>
          ))}
        </Select>
      </FieldGroup>

      <div className={discrete ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-3"}>
        <FieldGroup label={discrete ? "总数" : "数量"}>
          <Input
            type="number"
            step={discrete ? "1" : "0.01"}
            name="quantity"
            defaultValue={defaults?.quantity ?? ""}
            placeholder={discrete ? "5" : "1"}
          />
        </FieldGroup>
        {discrete ? (
          <FieldGroup label="在用">
            <Input
              type="number"
              step="1"
              name="quantityInUse"
              defaultValue={defaults?.quantityInUse ?? ""}
              placeholder="3"
            />
          </FieldGroup>
        ) : null}
        <FieldGroup label="单位">
          <FreeCombobox
            name="unit"
            options={unitOptions}
            defaultValue={defaults?.unit ?? ""}
            placeholder={discrete ? "个 / 把" : "袋 / L / 瓶"}
          />
        </FieldGroup>
      </div>

      {!discrete ? (
        <FieldGroup
          label="剩余 %"
          hint="给耗品（土/肥/药/种子）用，估摸着填即可"
        >
          <Input
            type="number"
            name="remainingPct"
            min={0}
            max={100}
            defaultValue={defaults?.remainingPct ?? 100}
          />
        </FieldGroup>
      ) : (
        <input type="hidden" name="remainingPct" value="100" />
      )}
    </>
  );
}

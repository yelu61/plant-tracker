"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { FieldGroup, Input } from "@/components/ui/input";
import type { Species } from "@/lib/db/schema";

type LiteSpecies = Pick<
  Species,
  | "id"
  | "commonName"
  | "scientificName"
  | "family"
  | "category"
  | "careLight"
  | "careWater"
  | "careTemp"
  | "careHumidity"
  | "careNotes"
>;

export function SpeciesPicker({
  species,
  defaultSpeciesId,
  defaultIntervalDays,
}: {
  species: LiteSpecies[];
  defaultSpeciesId?: number | null;
  defaultIntervalDays?: number | null;
}) {
  const initial = species.find((s) => s.id === defaultSpeciesId) ?? null;
  const [selected, setSelected] = useState<LiteSpecies | null>(initial);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [interval, setInterval] = useState<string>(
    defaultIntervalDays != null ? String(defaultIntervalDays) : "",
  );
  const intervalDirty = useRef(defaultIntervalDays != null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = species;
    if (!q) return base.slice(0, 8);
    return base
      .filter((s) =>
        [s.commonName, s.scientificName, s.family, s.category]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [query, species]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!selected || intervalDirty.current) return;
    const suggested = suggestIntervalDays(selected.careWater);
    if (suggested != null) setInterval(String(suggested));
  }, [selected]);

  return (
    <div className="space-y-3">
      <FieldGroup label="物种" hint="输入俗名 / 学名 / 科 / 分类，会自动联想">
        <input type="hidden" name="speciesId" value={selected?.id ?? ""} />
        <div ref={wrapRef} className="relative">
          {selected ? (
            <div className="flex items-start justify-between gap-2 rounded-lg border border-leaf-300 bg-leaf-50 px-3 py-2 dark:border-leaf-800 dark:bg-leaf-950/30">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {selected.commonName}
                </div>
                <div className="truncate text-xs text-stone-500">
                  {selected.scientificName ?? ""}
                  {selected.category ? ` · ${selected.category}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setQuery("");
                  setOpen(true);
                }}
                className="text-stone-400 hover:text-rose-600"
                aria-label="清除"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="比如：绿萝、Monstera、多肉…"
                autoComplete="off"
              />
              {open ? (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
                  {filtered.length > 0 ? (
                    <ul>
                      {filtered.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(s);
                              setOpen(false);
                              setQuery("");
                            }}
                            className="block w-full px-3 py-2 text-left hover:bg-leaf-50 dark:hover:bg-leaf-950/30"
                          >
                            <div className="text-sm font-medium">{s.commonName}</div>
                            <div className="truncate text-xs text-stone-500">
                              {s.scientificName ?? ""}
                              {s.category ? ` · ${s.category}` : ""}
                              {s.family ? ` · ${s.family}` : ""}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : query.trim() ? (
                    <div className="p-3 text-xs">
                      <p className="text-stone-500">没找到「{query.trim()}」</p>
                      <Link
                        href={`/species/new?name=${encodeURIComponent(query.trim())}`}
                        className="mt-1 inline-block font-medium text-leaf-700"
                        target="_blank"
                      >
                        + 在另一个标签添「{query.trim()}」到知识库
                      </Link>
                    </div>
                  ) : (
                    <p className="p-3 text-xs text-stone-500">输入关键字开始搜索</p>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </FieldGroup>

      {selected ? <CarePreview species={selected} /> : null}

      <FieldGroup
        label="浇水间隔 (天)"
        hint={
          selected
            ? "已根据所选物种自动推荐，可改"
            : "留空用默认 7 天判断是否该浇了"
        }
      >
        <Input
          type="number"
          min={1}
          max={120}
          name="wateringIntervalDays"
          value={interval}
          onChange={(e) => {
            setInterval(e.target.value);
            intervalDirty.current = true;
          }}
          placeholder="7"
        />
      </FieldGroup>
    </div>
  );
}

function CarePreview({ species: s }: { species: LiteSpecies }) {
  const lines: Array<{ k: string; v: string | null | undefined }> = [
    { k: "💡 光", v: s.careLight },
    { k: "💧 水", v: s.careWater },
    { k: "🌡 温", v: s.careTemp },
    { k: "💨 湿", v: s.careHumidity },
  ];
  return (
    <div className="rounded-lg bg-leaf-50/60 p-3 text-xs dark:bg-leaf-950/20">
      <p className="mb-2 font-medium text-leaf-700 dark:text-leaf-300">养护建议</p>
      <dl className="space-y-1 text-stone-700 dark:text-stone-300">
        {lines
          .filter((l) => l.v)
          .map((l) => (
            <div key={l.k} className="flex gap-2">
              <dt className="w-10 shrink-0 font-medium text-stone-500">{l.k}</dt>
              <dd>{l.v}</dd>
            </div>
          ))}
      </dl>
      {s.careNotes ? (
        <p className="mt-2 text-stone-500">{s.careNotes}</p>
      ) : null}
    </div>
  );
}

function suggestIntervalDays(careWater: string | null | undefined): number | null {
  if (!careWater) return null;
  const m = careWater.match(/(\d+)\s*[-~～至到]\s*(\d+)\s*天/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return Math.round((a + b) / 2);
  }
  const single = careWater.match(/(?:约|每|大约)?\s*(\d+)\s*天/);
  if (single) return Number(single[1]);
  return null;
}

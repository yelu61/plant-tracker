import { Save } from "lucide-react";
import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/input";
import { db } from "@/lib/db";

import { createNote } from "@/app/actions/notes";

export const dynamic = "force-dynamic";

export default async function NewNotePage() {
  const [plantsList, speciesList] = await Promise.all([
    db.query.plants.findMany({ orderBy: (p, { asc }) => asc(p.name) }),
    db.query.species.findMany({ orderBy: (s, { asc }) => asc(s.commonName) }),
  ]);

  return (
    <>
      <TopBar title="写笔记" />
      <form action={createNote} className="space-y-4 px-4 py-4">
        <Card className="space-y-4">
          <FieldGroup label="标题">
            <Input name="title" placeholder="比如：夏季多肉控水心得" autoFocus />
          </FieldGroup>
          <FieldGroup label="内容 *">
            <Textarea name="content" required rows={8} placeholder="记下来…" />
          </FieldGroup>
          <FieldGroup label="标签" hint="用空格或逗号分隔">
            <Input name="tags" placeholder="夏季 控水 多肉" />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="关联植物">
              <Select name="plantId" defaultValue="">
                <option value="">不关联</option>
                {plantsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="关联物种">
              <Select name="speciesId" defaultValue="">
                <option value="">不关联</option>
                {speciesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.commonName}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>
        </Card>

        <div className="flex gap-3">
          <Link href="/notes" className="flex-1">
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

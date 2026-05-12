import Link from "next/link";

import { TopBar } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Textarea } from "@/components/ui/input";

import { createSpecies } from "@/app/actions/species";

export default function NewSpeciesPage() {
  return (
    <>
      <TopBar title="新增物种" />
      <form action={createSpecies} className="space-y-4 px-4 py-4">
        <Card className="space-y-4">
          <FieldGroup label="俗名 *">
            <Input name="commonName" required placeholder="绿萝" autoFocus />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="学名">
              <Input name="scientificName" placeholder="Epipremnum aureum" />
            </FieldGroup>
            <FieldGroup label="科">
              <Input name="family" placeholder="天南星科" />
            </FieldGroup>
          </div>
          <FieldGroup label="分类标签">
            <Input name="category" placeholder="观叶 / 多肉 / 球根 / 木本 …" />
          </FieldGroup>
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-medium text-stone-500">养护建议</p>
          <FieldGroup label="光照">
            <Input name="careLight" placeholder="散光 / 全日照 / 耐阴" />
          </FieldGroup>
          <FieldGroup label="浇水">
            <Input name="careWater" placeholder="干透浇透，约 5-10 天 / 次" />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="温度">
              <Input name="careTemp" placeholder="15-28°C" />
            </FieldGroup>
            <FieldGroup label="湿度">
              <Input name="careHumidity" placeholder="中高湿度" />
            </FieldGroup>
          </div>
          <FieldGroup label="其他提示">
            <Textarea name="careNotes" rows={3} placeholder="繁殖、病虫害、季节注意点…" />
          </FieldGroup>
        </Card>

        <div className="flex gap-3">
          <Link href="/species" className="flex-1">
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

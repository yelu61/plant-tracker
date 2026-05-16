import { Save } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TopBar } from "@/components/bottom-nav";
import { DeleteButton } from "@/components/delete-button";
import { MultiPhotoInput } from "@/components/multi-photo-input";
import { PhotoDeleteButton } from "@/components/photo-delete-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/input";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

import { deleteNote, deleteNotePhoto, updateNote } from "@/app/actions/notes";

export const dynamic = "force-dynamic";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) notFound();

  const note = await db.query.notes.findFirst({
    where: (n, { eq }) => eq(n.id, id),
    with: {
      photos: { orderBy: (p, { asc }) => asc(p.createdAt) },
    },
  });
  if (!note) notFound();

  const [plantsList, speciesList] = await Promise.all([
    db.query.plants.findMany({ orderBy: (p, { asc }) => asc(p.name) }),
    db.query.species.findMany({ orderBy: (s, { asc }) => asc(s.commonName) }),
  ]);

  return (
    <>
      <TopBar title="编辑笔记" backHref="/notes" />
      <form
        action={updateNote.bind(null, note.id)}
        encType="multipart/form-data"
        className="space-y-4 px-4 py-4"
      >
        <Card className="space-y-4">
          <FieldGroup label="标题">
            <Input name="title" defaultValue={note.title ?? ""} placeholder="比如：夏季多肉控水心得" />
          </FieldGroup>
          <FieldGroup label="内容 *">
            <Textarea name="content" required rows={8} defaultValue={note.content} />
          </FieldGroup>

          {note.photos.length > 0 ? (
            <FieldGroup label="已有照片">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {note.photos.map((p) => (
                  <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg">
                    <Link href={p.url} target="_blank" className="block h-full w-full">
                      <Image
                        src={p.url}
                        alt={p.caption ?? ""}
                        width={300}
                        height={300}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </Link>
                    {p.takenAt ? (
                      <span className="absolute left-1 top-1 rounded bg-black/50 px-1 py-0.5 text-[9px] text-white">
                        {formatDate(p.takenAt)}
                      </span>
                    ) : null}
                    <PhotoDeleteButton
                      action={deleteNotePhoto.bind(null, note.id, p.id)}
                      className="absolute right-1 top-1"
                    />
                  </div>
                ))}
              </div>
            </FieldGroup>
          ) : null}

          <FieldGroup label="加照片" hint="可拍照或从相册选，自动压缩">
            <MultiPhotoInput />
          </FieldGroup>
          <FieldGroup label="标签" hint="用空格或逗号分隔">
            <Input name="tags" defaultValue={(note.tags ?? []).join(" ")} placeholder="夏季 控水 多肉" />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="关联植物">
              <Select name="plantId" defaultValue={note.plantId ?? ""}>
                <option value="">不关联</option>
                {plantsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="关联物种">
              <Select name="speciesId" defaultValue={note.speciesId ?? ""}>
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

        <div className="pt-2">
          <DeleteButton
            action={deleteNote.bind(null, note.id)}
            label="删除这条笔记"
            confirmText="确认删除这条笔记？此操作不可撤销。"
          />
        </div>
      </form>
    </>
  );
}

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { careEvents } from "@/lib/db/schema";
import { careEventSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const raw = payload as Record<string, unknown>;
  if (!raw.occurredAt) raw.occurredAt = new Date().toISOString();

  const result = careEventSchema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }
  const parsed = result.data;

  const [row] = await db
    .insert(careEvents)
    .values(parsed)
    .returning({ id: careEvents.id });

  revalidatePath("/");
  revalidatePath("/plants");
  revalidatePath(`/plants/${parsed.plantId}`);
  revalidatePath("/quick-log");

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}

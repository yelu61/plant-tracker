import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [plants, species, careEvents, supplies, photos, notes] = await Promise.all([
    db.query.plants.findMany(),
    db.query.species.findMany(),
    db.query.careEvents.findMany(),
    db.query.supplies.findMany(),
    db.query.photos.findMany(),
    db.query.notes.findMany(),
  ]);

  const data = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    counts: {
      plants: plants.length,
      species: species.length,
      careEvents: careEvents.length,
      supplies: supplies.length,
      photos: photos.length,
      notes: notes.length,
    },
    plants,
    species,
    careEvents,
    supplies,
    photos,
    notes,
  };

  const filename = `plant-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

export const species = sqliteTable("species", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  commonName: text("common_name").notNull(),
  scientificName: text("scientific_name"),
  family: text("family"),
  category: text("category"),
  careLight: text("care_light"),
  careWater: text("care_water"),
  careTemp: text("care_temp"),
  careHumidity: text("care_humidity"),
  careNotes: text("care_notes"),
  createdAt: timestamp("created_at"),
});

export const plants = sqliteTable("plants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  speciesId: integer("species_id").references(() => species.id, {
    onDelete: "set null",
  }),
  location: text("location"),
  potSize: text("pot_size"),
  coverPhotoId: integer("cover_photo_id"),
  acquiredAt: integer("acquired_at", { mode: "timestamp" }),
  acquiredFrom: text("acquired_from"),
  acquiredPrice: real("acquired_price"),
  wateringIntervalDays: integer("watering_interval_days"),
  stage: text("stage"),
  status: text("status", { enum: ["alive", "dormant", "lost", "archived"] })
    .notNull()
    .default("alive"),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  endingNote: text("ending_note"),
  notes: text("notes"),
  createdAt: timestamp("created_at"),
});

export const careEventTypes = [
  "water",
  "fertilize",
  "repot",
  "prune",
  "treat",
  "observe",
  "rotate",
  "move",
  "growth",
] as const;
export type CareEventType = (typeof careEventTypes)[number];

export const careEvents = sqliteTable("care_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  plantId: integer("plant_id")
    .notNull()
    .references(() => plants.id, { onDelete: "cascade" }),
  type: text("type", { enum: careEventTypes }).notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  detail: text("detail"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at"),
});

export const supplyCategories = [
  "soil",
  "pot",
  "tool",
  "fertilizer",
  "pesticide",
  "seed",
  "other",
] as const;
export type SupplyCategory = (typeof supplyCategories)[number];

export const supplies = sqliteTable("supplies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category", { enum: supplyCategories }).notNull(),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }),
  purchasedFrom: text("purchased_from"),
  price: real("price"),
  quantity: real("quantity"),
  unit: text("unit"),
  remainingPct: integer("remaining_pct").default(100),
  notes: text("notes"),
  createdAt: timestamp("created_at"),
});

export const photos = sqliteTable("photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  plantId: integer("plant_id").references(() => plants.id, {
    onDelete: "cascade",
  }),
  eventId: integer("event_id").references(() => careEvents.id, {
    onDelete: "set null",
  }),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  takenAt: integer("taken_at", { mode: "timestamp" }),
  createdAt: timestamp("created_at"),
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title"),
  content: text("content").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  plantId: integer("plant_id").references(() => plants.id, {
    onDelete: "set null",
  }),
  speciesId: integer("species_id").references(() => species.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at"),
});

export const plantsRelations = relations(plants, ({ one, many }) => ({
  species: one(species, {
    fields: [plants.speciesId],
    references: [species.id],
  }),
  events: many(careEvents),
  photos: many(photos),
  notes: many(notes),
}));

export const speciesRelations = relations(species, ({ many }) => ({
  plants: many(plants),
  notes: many(notes),
}));

export const careEventsRelations = relations(careEvents, ({ one, many }) => ({
  plant: one(plants, {
    fields: [careEvents.plantId],
    references: [plants.id],
  }),
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  plant: one(plants, { fields: [photos.plantId], references: [plants.id] }),
  event: one(careEvents, {
    fields: [photos.eventId],
    references: [careEvents.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  plant: one(plants, { fields: [notes.plantId], references: [plants.id] }),
  species: one(species, {
    fields: [notes.speciesId],
    references: [species.id],
  }),
}));

export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;
export type Species = typeof species.$inferSelect;
export type NewSpecies = typeof species.$inferInsert;
export type CareEvent = typeof careEvents.$inferSelect;
export type NewCareEvent = typeof careEvents.$inferInsert;
export type Supply = typeof supplies.$inferSelect;
export type NewSupply = typeof supplies.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

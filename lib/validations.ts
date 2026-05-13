import { z } from "zod";

import { careEventTypes, supplyCategories } from "./db/schema";

const isoDate = z
  .string()
  .min(1)
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), "无效日期");

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : undefined))
  .refine((d) => d === undefined || !Number.isNaN(d.getTime()), "无效日期");

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === "" || v == null) return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  });

export const plantSchema = z.object({
  name: z.string().min(1, "请填昵称").max(60),
  speciesId: optionalNumber,
  location: z.string().max(60).optional().or(z.literal("")).transform((v) => v || undefined),
  potSize: z.string().max(40).optional().or(z.literal("")).transform((v) => v || undefined),
  acquiredAt: optionalDate,
  acquiredFrom: z.string().max(80).optional().or(z.literal("")).transform((v) => v || undefined),
  acquiredPrice: optionalNumber,
  wateringIntervalDays: optionalNumber,
  stage: z.string().max(40).optional().or(z.literal("")).transform((v) => v || undefined),
  status: z.enum(["alive", "dormant", "lost", "archived"]).default("alive"),
  endedAt: optionalDate,
  endingNote: z.string().max(2000).optional().or(z.literal("")).transform((v) => v || undefined),
  notes: z.string().max(2000).optional().or(z.literal("")).transform((v) => v || undefined),
});

export const speciesSchema = z.object({
  commonName: z.string().min(1).max(60),
  scientificName: z.string().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
  family: z.string().max(60).optional().or(z.literal("")).transform((v) => v || undefined),
  category: z.string().max(40).optional().or(z.literal("")).transform((v) => v || undefined),
  careLight: z.string().max(200).optional().or(z.literal("")).transform((v) => v || undefined),
  careWater: z.string().max(200).optional().or(z.literal("")).transform((v) => v || undefined),
  careTemp: z.string().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
  careHumidity: z.string().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
  careNotes: z.string().max(2000).optional().or(z.literal("")).transform((v) => v || undefined),
});

export const careEventSchema = z.object({
  plantId: z.coerce.number().int().positive(),
  type: z.enum(careEventTypes),
  occurredAt: isoDate,
  detail: z.string().max(500).optional().or(z.literal("")).transform((v) => v || undefined),
});

export const supplySchema = z.object({
  name: z.string().min(1).max(80),
  category: z.enum(supplyCategories),
  purchasedAt: optionalDate,
  purchasedFrom: z.string().max(80).optional().or(z.literal("")).transform((v) => v || undefined),
  price: optionalNumber,
  quantity: optionalNumber,
  quantityInUse: optionalNumber,
  unit: z.string().max(20).optional().or(z.literal("")).transform((v) => v || undefined),
  remainingPct: z.coerce.number().int().min(0).max(100).default(100),
  notes: z.string().max(2000).optional().or(z.literal("")).transform((v) => v || undefined),
});

export const noteSchema = z.object({
  title: z.string().max(120).optional().or(z.literal("")).transform((v) => v || undefined),
  content: z.string().min(1),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(/[,，\s]+/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    ),
  plantId: optionalNumber,
  speciesId: optionalNumber,
});

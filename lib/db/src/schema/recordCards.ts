import { pgTable, serial, text, numeric, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recordCardsTable = pgTable("record_cards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  holder: text("holder"),
  value: numeric("value", { precision: 20, scale: 6 }).notNull(),
  unit: text("unit").notNull(),
  previousValue: numeric("previous_value", { precision: 20, scale: 6 }),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  difficulty: text("difficulty").notNull().default("medium"),
  ageRange: text("age_range").default("8-18"),
  recordDate: text("record_date"),
  location: text("location"),
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  verified: boolean("verified").notNull().default(false),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRecordCardSchema = createInsertSchema(recordCardsTable).omit({ id: true, createdAt: true, version: true });
export type InsertRecordCard = z.infer<typeof insertRecordCardSchema>;
export type RecordCard = typeof recordCardsTable.$inferSelect;

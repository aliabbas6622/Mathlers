import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const templatesTable = pgTable("question_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  templateText: text("template_text").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  mathOperation: text("math_operation").notNull(),
  exampleOutput: text("example_output"),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(templatesTable).omit({ id: true, createdAt: true, usageCount: true });
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templatesTable.$inferSelect;

import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  recordCardId: integer("record_card_id").notNull(),
  templateId: integer("template_id"),
  roundName: text("round_name").notNull().default("Warmup"),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  scenario: text("scenario").notNull(),
  questionText: text("question_text").notNull(),
  options: jsonb("options").$type<string[]>().notNull().default([]),
  correctAnswer: text("correct_answer").notNull(),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  knockoutChallenge: text("knockout_challenge"),
  hash: text("hash").notNull().unique(),
  validated: boolean("validated").notNull().default(false),
  timeLimitSeconds: integer("time_limit_seconds").notNull().default(60),
  pointValue: integer("point_value").notNull().default(100),
  providerId: text("provider_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;

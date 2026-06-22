import { pgTable, serial, text, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  mode: text("mode").notNull().default("practice"),
  difficulty: text("difficulty").notNull().default("medium"),
  status: text("status").notNull().default("active"),
  currentRound: integer("current_round").notNull().default(1),
  totalRounds: integer("total_rounds").notNull().default(5),
  score: integer("score").notNull().default(0),
  accuracy: numeric("accuracy", { precision: 5, scale: 2 }).notNull().default("0"),
  streak: integer("streak").notNull().default(0),
  comboMultiplier: numeric("combo_multiplier", { precision: 4, scale: 2 }).notNull().default("1"),
  currentQuestionId: integer("current_question_id"),
  rounds: jsonb("rounds").$type<Array<{
    roundNumber: number;
    roundName: string;
    questionId: number;
    correct: boolean;
    responseTime: number;
    pointsEarned: number;
    selectedAnswer: string;
  }>>().default([]),
  topics: jsonb("topics").$type<string[]>().default([]),
  eloChange: integer("elo_change"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true, completedAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;

import { pgTable, serial, integer, numeric, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentPerformanceTable = pgTable("student_performance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  questionId: integer("question_id").notNull(),
  matchId: integer("match_id"),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(),
  correct: boolean("correct").notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  pointsEarned: integer("points_earned").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPerformanceSchema = createInsertSchema(studentPerformanceTable).omit({ id: true, createdAt: true });
export type InsertPerformance = z.infer<typeof insertPerformanceSchema>;
export type StudentPerformance = typeof studentPerformanceTable.$inferSelect;

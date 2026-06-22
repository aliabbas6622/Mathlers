import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  // Identity
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  parentEmail: text("parent_email"),
  // Academic
  ageGroup: text("age_group").notNull().default("11-13"),
  grade: text("grade"),
  school: text("school"),
  city: text("city"),
  country: text("country").default("Unknown"),
  schoolId: integer("school_id"),
  // Enrollment
  enrollmentCode: text("enrollment_code").unique(),
  status: text("status").notNull().default("active"),
  adminNotes: text("admin_notes"),
  // Ranking
  elo: integer("elo").notNull().default(1000),
  belt: text("belt").notNull().default("bronze"),
  streak: integer("streak").notNull().default(0),
  totalMatches: integer("total_matches").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  favoriteTopics: jsonb("favorite_topics").$type<string[]>().default([]),
  // Timestamps
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({
  id: true, createdAt: true, elo: true, belt: true, streak: true,
  totalMatches: true, totalWins: true, enrollmentCode: true, status: true,
});
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;

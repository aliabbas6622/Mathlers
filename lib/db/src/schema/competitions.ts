import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const schoolsTable = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  country: text("country").notNull().default("Unknown"),
  district: text("district"),
  code: text("code").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const competitionsTable = pgTable("competitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("city"),
  scope: text("scope").notNull().default("city"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  schoolId: integer("school_id"),
  status: text("status").notNull().default("upcoming"),
  maxParticipants: integer("max_participants").notNull().default(64),
  currentParticipants: integer("current_participants").notNull().default(0),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  prizeDescription: text("prize_description"),
  difficulty: text("difficulty").notNull().default("medium"),
  ageGroup: text("age_group"),
  topics: jsonb("topics").$type<string[]>().default([]),
  bracket: jsonb("bracket").$type<Record<string, any>>().default({}),
  winnerId: integer("winner_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const competitionEntriesTable = pgTable("competition_entries", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").notNull(),
  studentId: integer("student_id").notNull(),
  score: integer("score").notNull().default(0),
  rank: integer("rank"),
  matchesPlayed: integer("matches_played").notNull().default(0),
  eliminated: boolean("eliminated").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertSchoolSchema = createInsertSchema(schoolsTable).omit({ id: true, createdAt: true });
export const insertCompetitionSchema = createInsertSchema(competitionsTable).omit({ id: true, createdAt: true });
export const insertCompetitionEntrySchema = createInsertSchema(competitionEntriesTable).omit({ id: true });

export type School = typeof schoolsTable.$inferSelect;
export type Competition = typeof competitionsTable.$inferSelect;
export type CompetitionEntry = typeof competitionEntriesTable.$inferSelect;

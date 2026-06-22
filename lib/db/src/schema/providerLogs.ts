import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providerLogsTable = pgTable("provider_logs", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  model: text("model").notNull(),
  operation: text("operation").notNull(),
  success: boolean("success").notNull(),
  latencyMs: integer("latency_ms"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProviderLogSchema = createInsertSchema(providerLogsTable).omit({ id: true, createdAt: true });
export type InsertProviderLog = z.infer<typeof insertProviderLogSchema>;
export type ProviderLog = typeof providerLogsTable.$inferSelect;

import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analysis = pgTable("analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // text, url, image, document, voice
  result: jsonb("result").notNull(),
  isFlagged: boolean("is_flagged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  analysisId: integer("analysis_id").references(() => analysis.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  isActive: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertAnalysisSchema = createInsertSchema(analysis).pick({
  userId: true,
  content: true,
  contentType: true,
  result: true,
  isFlagged: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  userId: true,
  analysisId: true,
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Analysis = typeof analysis.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type AnalysisResult = {
  classification: "real" | "fake" | "misleading";
  confidence: number;
  explanation: string;
  sources: {
    title: string;
    url: string;
    trustScore: number;
  }[];
  patterns: {
    sensationalist: number;
    unreliableSource: number;
    unverifiedClaims: number;
  };
};

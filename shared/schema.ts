import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analysis = pgTable("analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // text, url, image, document, voice
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
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
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Analysis = typeof analysis.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type AnalysisResult = {
  classification: "real" | "fake" | "misleading";
  confidence: number;
  reasoning: string[];
  sourceCredibility: {
    name: string;
    score: number;
    level: "low" | "medium" | "high";
  };
  factChecks: {
    source: string;
    title: string;
    snippet: string;
    url: string;
  }[];
  sentiment: {
    emotionalTone: string;
    emotionalToneScore: number;
    languageStyle: string;
    languageStyleScore: number;
    politicalLeaning: string;
    politicalLeaningScore: number;
  };
};

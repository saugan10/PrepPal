import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(), // applied, interview, offer, rejected
  tag: text("tag").notNull(), // dream, target, backup
  jobUrl: text("job_url"),
  notes: text("notes").default(""),
  interviewNotes: jsonb("interview_notes").default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const interviewSessions = pgTable("interview_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull(),
  questions: jsonb("questions").notNull(), // Array of questions with answers and feedback
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertApplicationSchema = createInsertSchema(applications).pick({
  company: true,
  role: true,
  status: true,
  tag: true,
  jobUrl: true,
  notes: true,
});

export const updateApplicationSchema = insertApplicationSchema.partial().extend({
  id: z.string(),
});

export const insertSessionSchema = createInsertSchema(interviewSessions).pick({
  applicationId: true,
  questions: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type UpdateApplication = z.infer<typeof updateApplicationSchema>;
export type Application = typeof applications.$inferSelect;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Types for interview chat
export interface ChatMessage {
  id: string;
  type: "question" | "answer" | "feedback";
  content: string;
  timestamp: Date;
  feedback?: InterviewFeedback;
}

export interface InterviewFeedback {
  clarity: number; // 1-5 scale
  relevance: number; // 1-5 scale
  suggestions: string[];
  overall: string;
}

export interface QuestionWithAnswer {
  question: string;
  answer: string;
  feedback: InterviewFeedback;
  timestamp: Date;
}

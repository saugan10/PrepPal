import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// MongoDB Schemas
const applicationSchema = new Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, required: true }, // applied, interview, offer, rejected
  tag: { type: String, required: true }, // dream, target, backup
  jobUrl: { type: String, default: "" },
  notes: { type: String, default: "" },
  interviewNotes: { type: [Schema.Types.Mixed], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const interviewSessionSchema = new Schema({
  applicationId: { type: String, required: true },
  questions: { type: [Schema.Types.Mixed], required: true }, // Array of questions with answers and feedback
  createdAt: { type: Date, default: Date.now },
});

// MongoDB Models
export const Application = mongoose.model("Application", applicationSchema);
export const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);

// Zod validation schemas for API
export const insertApplicationSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["applied", "interview", "offer", "rejected"]),
  tag: z.enum(["dream", "target", "backup"]),
  jobUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const updateApplicationSchema = insertApplicationSchema.partial().extend({
  id: z.string(),
});

export const insertSessionSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  questions: z.array(z.any()),
});

// TypeScript types
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type UpdateApplication = z.infer<typeof updateApplicationSchema>;
export type ApplicationType = {
  id: string;
  company: string;
  role: string;
  status: "applied" | "interview" | "offer" | "rejected";
  tag: "dream" | "target" | "backup";
  jobUrl?: string;
  notes?: string;
  interviewNotes: any[];
  createdAt: Date;
  updatedAt: Date;
};
export type InterviewSessionType = {
  id: string;
  applicationId: string;
  questions: any[];
  createdAt: Date;
};
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
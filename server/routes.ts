import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertApplicationSchema, updateApplicationSchema, insertSessionSchema } from "@shared/schema";
import { generateInterviewQuestions, provideFeedback } from "./services/gemini";
import { isMongoConfigured } from "./database";

export async function registerRoutes(app: Express): Promise<Server> {
  // Application CRUD routes
  app.get("/api/applications", async (req, res) => {
    if (!isMongoConfigured()) {
      return res.status(503).json({ 
        message: "Database not configured. Please set MONGODB_URI environment variable." 
      });
    }

    try {
      const { status, tag, search, page = "1", limit = "10" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const result = await storage.getApplications({
        status: status as string,
        tag: tag as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset,
      });
      
      res.json({
        applications: result.applications,
        total: result.total,
        page: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      });
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const application = await storage.getApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Get interview sessions for this application
      const sessions = await storage.getSessionsByApplication(req.params.id);
      
      res.json({ ...application, sessions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const validatedData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      res.status(400).json({ message: "Invalid application data" });
    }
  });

  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const validatedData = updateApplicationSchema.parse({
        ...req.body,
        id: req.params.id,
      });
      
      const application = await storage.updateApplication(validatedData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      res.status(400).json({ message: "Invalid application data" });
    }
  });

  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteApplication(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Statistics route
  app.get("/api/stats", async (req, res) => {
    if (!isMongoConfigured()) {
      return res.status(503).json({ 
        message: "Database not configured. Please set MONGODB_URI environment variable." 
      });
    }

    try {
      const stats = await storage.getApplicationStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // AI Interview routes
  app.post("/api/ai/questions", async (req, res) => {
    try {
      const { role, company } = req.body;
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }
      
      const questions = await generateInterviewQuestions(role, company);
      res.json({ questions });
    } catch (error) {
      console.error("Failed to generate questions:", error);
      res.status(500).json({ message: "Failed to generate interview questions" });
    }
  });

  app.post("/api/ai/feedback", async (req, res) => {
    try {
      const { question, answer, role } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ message: "Question and answer are required" });
      }
      
      const feedback = await provideFeedback(question, answer, role);
      res.json(feedback);
    } catch (error) {
      console.error("Failed to provide feedback:", error);
      res.status(500).json({ message: "Failed to provide feedback" });
    }
  });

  // Interview sessions
  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.get("/api/sessions/:applicationId", async (req, res) => {
    try {
      const sessions = await storage.getSessionsByApplication(req.params.applicationId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

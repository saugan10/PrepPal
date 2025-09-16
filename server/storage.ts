import { 
  type Application, 
  type InsertApplication,
  type UpdateApplication,
  type InterviewSession,
  type InsertSession,
  type QuestionWithAnswer 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Application CRUD
  getApplication(id: string): Promise<Application | undefined>;
  getApplications(filters?: {
    status?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: Application[]; total: number }>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(application: UpdateApplication): Promise<Application | undefined>;
  deleteApplication(id: string): Promise<boolean>;
  
  // Interview Sessions
  getSessionsByApplication(applicationId: string): Promise<InterviewSession[]>;
  createSession(session: InsertSession): Promise<InterviewSession>;
  
  // Statistics
  getApplicationStats(): Promise<{
    total: number;
    interviews: number;
    offers: number;
    responseRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private applications: Map<string, Application>;
  private sessions: Map<string, InterviewSession>;

  constructor() {
    this.applications = new Map();
    this.sessions = new Map();
  }

  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async getApplications(filters?: {
    status?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: Application[]; total: number }> {
    let apps = Array.from(this.applications.values());
    
    // Apply filters
    if (filters?.status && filters.status !== 'All') {
      apps = apps.filter(app => app.status.toLowerCase() === filters.status?.toLowerCase());
    }
    
    if (filters?.tag && filters.tag !== 'All') {
      apps = apps.filter(app => app.tag.toLowerCase() === filters.tag?.toLowerCase());
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      apps = apps.filter(app => 
        app.company.toLowerCase().includes(search) ||
        app.role.toLowerCase().includes(search)
      );
    }
    
    // Sort by creation date (newest first)
    apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const total = apps.length;
    
    // Apply pagination
    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;
    const paginatedApps = apps.slice(offset, offset + limit);
    
    return { applications: paginatedApps, total };
  }

  async createApplication(insertApp: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const now = new Date();
    const application: Application = {
      ...insertApp,
      id,
      jobUrl: insertApp.jobUrl || null,
      notes: insertApp.notes || null,
      interviewNotes: [],
      createdAt: now,
      updatedAt: now,
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(updateApp: UpdateApplication): Promise<Application | undefined> {
    const existing = this.applications.get(updateApp.id);
    if (!existing) return undefined;
    
    const updated: Application = {
      ...existing,
      ...updateApp,
      updatedAt: new Date(),
    };
    this.applications.set(updateApp.id, updated);
    return updated;
  }

  async deleteApplication(id: string): Promise<boolean> {
    return this.applications.delete(id);
  }

  async getSessionsByApplication(applicationId: string): Promise<InterviewSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.applicationId === applicationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createSession(insertSession: InsertSession): Promise<InterviewSession> {
    const id = randomUUID();
    const session: InterviewSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async getApplicationStats(): Promise<{
    total: number;
    interviews: number;
    offers: number;
    responseRate: number;
  }> {
    const apps = Array.from(this.applications.values());
    const total = apps.length;
    const interviews = apps.filter(app => app.status === 'interview').length;
    const offers = apps.filter(app => app.status === 'offer').length;
    const applied = apps.filter(app => app.status === 'applied').length;
    const responseRate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;
    
    return { total, interviews, offers, responseRate };
  }
}

export const storage = new MemStorage();

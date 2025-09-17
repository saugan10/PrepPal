import { 
  Application,
  InterviewSession,
  type ApplicationType, 
  type InsertApplication,
  type UpdateApplication,
  type InterviewSessionType,
  type InsertSession,
  type QuestionWithAnswer 
} from "@shared/schema";
import { connectToDatabase, isMongoConfigured } from "./database";

export interface IStorage {
  // Application CRUD
  getApplication(id: string): Promise<ApplicationType | undefined>;
  getApplications(filters?: {
    status?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: ApplicationType[]; total: number }>;
  createApplication(application: InsertApplication): Promise<ApplicationType>;
  updateApplication(application: UpdateApplication): Promise<ApplicationType | undefined>;
  deleteApplication(id: string): Promise<boolean>;
  
  // Interview Sessions
  getSessionsByApplication(applicationId: string): Promise<InterviewSessionType[]>;
  createSession(session: InsertSession): Promise<InterviewSessionType>;
  
  // Statistics
  getApplicationStats(): Promise<{
    total: number;
    interviews: number;
    offers: number;
    responseRate: number;
  }>;
}

export class MongoStorage implements IStorage {
  async getApplication(id: string): Promise<ApplicationType | undefined> {
    await connectToDatabase();
    const app = await Application.findById(id).lean();
    return app ? this.transformApplication(app) : undefined;
  }

  async getApplications(filters?: {
    status?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: ApplicationType[]; total: number }> {
    await connectToDatabase();

    // Build query
    const query: any = {};
    
    if (filters?.status && filters.status !== 'All') {
      query.status = { $regex: new RegExp(filters.status, 'i') };
    }
    
    if (filters?.tag && filters.tag !== 'All') {
      query.tag = { $regex: new RegExp(filters.tag, 'i') };
    }
    
    if (filters?.search) {
      const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { company: { $regex: new RegExp(escapedSearch, 'i') } },
        { role: { $regex: new RegExp(escapedSearch, 'i') } }
      ];
    }

    const limit = filters?.limit || 10;
    const offset = filters?.offset || 0;

    const [applications, total] = await Promise.all([
      Application.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Application.countDocuments(query)
    ]);

    return {
      applications: applications.map(app => this.transformApplication(app)),
      total
    };
  }

  async createApplication(insertApp: InsertApplication): Promise<ApplicationType> {
    await connectToDatabase();
    const application = new Application({
      ...insertApp,
      jobUrl: insertApp.jobUrl || "",
      notes: insertApp.notes || "",
      interviewNotes: [],
    });
    
    await application.save();
    return this.transformApplication(application.toObject());
  }

  async updateApplication(updateApp: UpdateApplication): Promise<ApplicationType | undefined> {
    await connectToDatabase();
    const { id, ...updateData } = updateApp;
    
    const updated = await Application.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).lean();
    
    return updated ? this.transformApplication(updated) : undefined;
  }

  async deleteApplication(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await Application.findByIdAndDelete(id);
    
    // Also delete related interview sessions
    if (result) {
      await InterviewSession.deleteMany({ applicationId: id });
    }
    
    return !!result;
  }

  async getSessionsByApplication(applicationId: string): Promise<InterviewSessionType[]> {
    await connectToDatabase();
    const sessions = await InterviewSession.find({ applicationId })
      .sort({ createdAt: -1 })
      .lean();
    
    return sessions.map(session => this.transformSession(session));
  }

  async createSession(insertSession: InsertSession): Promise<InterviewSessionType> {
    await connectToDatabase();
    const session = new InterviewSession(insertSession);
    await session.save();
    return this.transformSession(session.toObject());
  }

  async getApplicationStats(): Promise<{
    total: number;
    interviews: number;
    offers: number;
    responseRate: number;
  }> {
    await connectToDatabase();
    
    const [total, interviews, offers, applied] = await Promise.all([
      Application.countDocuments({}),
      Application.countDocuments({ status: 'interview' }),
      Application.countDocuments({ status: 'offer' }),
      Application.countDocuments({ status: 'applied' })
    ]);
    
    const responseRate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;
    
    return { total, interviews, offers, responseRate };
  }

  private transformApplication(app: any): ApplicationType {
    return {
      id: app._id.toString(),
      company: app.company,
      role: app.role,
      status: app.status,
      tag: app.tag,
      jobUrl: app.jobUrl,
      notes: app.notes,
      interviewNotes: app.interviewNotes,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  private transformSession(session: any): InterviewSessionType {
    return {
      id: session._id.toString(),
      applicationId: session.applicationId,
      questions: session.questions,
      createdAt: session.createdAt,
    };
  }
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private applications: ApplicationType[] = [];
  private sessions: InterviewSessionType[] = [];
  private nextId = 1;

  async getApplication(id: string): Promise<ApplicationType | undefined> {
    return this.applications.find(app => app.id === id);
  }

  async getApplications(filters?: {
    status?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ applications: ApplicationType[]; total: number }> {
    let filtered = [...this.applications];

    // Apply filters
    if (filters?.status && filters.status !== 'All') {
      filtered = filtered.filter(app => 
        app.status.toLowerCase().includes(filters.status!.toLowerCase())
      );
    }
    
    if (filters?.tag && filters.tag !== 'All') {
      filtered = filtered.filter(app => 
        app.tag.toLowerCase().includes(filters.tag!.toLowerCase())
      );
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.company.toLowerCase().includes(searchLower) ||
        app.role.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 10;
    
    const applications = filtered.slice(offset, offset + limit);

    return { applications, total };
  }

  async createApplication(insertApp: InsertApplication): Promise<ApplicationType> {
    const now = new Date();
    const application: ApplicationType = {
      id: this.nextId.toString(),
      company: insertApp.company,
      role: insertApp.role,
      status: insertApp.status,
      tag: insertApp.tag,
      jobUrl: insertApp.jobUrl || "",
      notes: insertApp.notes || "",
      interviewNotes: [],
      createdAt: now,
      updatedAt: now,
    };
    
    this.applications.push(application);
    this.nextId++;
    return application;
  }

  async updateApplication(updateApp: UpdateApplication): Promise<ApplicationType | undefined> {
    const index = this.applications.findIndex(app => app.id === updateApp.id);
    if (index === -1) return undefined;

    const { id, ...updateData } = updateApp;
    const updated = {
      ...this.applications[index],
      ...updateData,
      updatedAt: new Date(),
    };
    
    this.applications[index] = updated;
    return updated;
  }

  async deleteApplication(id: string): Promise<boolean> {
    const index = this.applications.findIndex(app => app.id === id);
    if (index === -1) return false;

    this.applications.splice(index, 1);
    // Also delete related interview sessions
    this.sessions = this.sessions.filter(session => session.applicationId !== id);
    return true;
  }

  async getSessionsByApplication(applicationId: string): Promise<InterviewSessionType[]> {
    return this.sessions
      .filter(session => session.applicationId === applicationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createSession(insertSession: InsertSession): Promise<InterviewSessionType> {
    const session: InterviewSessionType = {
      id: this.nextId.toString(),
      applicationId: insertSession.applicationId,
      questions: insertSession.questions,
      createdAt: new Date(),
    };
    
    this.sessions.push(session);
    this.nextId++;
    return session;
  }

  async getApplicationStats(): Promise<{
    total: number;
    interviews: number;
    offers: number;
    responseRate: number;
  }> {
    const total = this.applications.length;
    const interviews = this.applications.filter(app => app.status === 'interview').length;
    const offers = this.applications.filter(app => app.status === 'offer').length;
    const applied = this.applications.filter(app => app.status === 'applied').length;
    
    const responseRate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;
    
    return { total, interviews, offers, responseRate };
  }
}

// Export a function that returns a runtime-selected singleton storage instance.
let _mongoInstance: MongoStorage | null = null;
let _memInstance: MemStorage | null = null;

export function getStorage(): IStorage {
  if (isMongoConfigured()) {
    if (!_mongoInstance) {
      _mongoInstance = new MongoStorage();
      console.log('Storage: using MongoDB backend');
    }
    return _mongoInstance;
  }

  if (!_memInstance) {
    _memInstance = new MemStorage();
    console.log('Storage: using in-memory fallback');
  }
  return _memInstance;
}
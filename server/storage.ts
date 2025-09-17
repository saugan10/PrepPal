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
import { connectToDatabase } from "./database";

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
      query.$or = [
        { company: { $regex: new RegExp(filters.search, 'i') } },
        { role: { $regex: new RegExp(filters.search, 'i') } }
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
      _id: app._id.toString(),
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
      _id: session._id.toString(),
      applicationId: session.applicationId,
      questions: session.questions,
      createdAt: session.createdAt,
    };
  }
}

export const storage = new MongoStorage();
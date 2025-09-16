import { apiRequest } from "./queryClient";
import type { 
  Application, 
  InsertApplication, 
  UpdateApplication, 
  InterviewSession,
  InterviewFeedback 
} from "@shared/schema";

export interface ApplicationsResponse {
  applications: Application[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApplicationStats {
  total: number;
  interviews: number;
  offers: number;
  responseRate: number;
}

export const api = {
  // Applications
  getApplications: async (filters?: {
    status?: string;
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApplicationsResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await fetch(`/api/applications?${params}`);
    return response.json();
  },

  getApplication: async (id: string): Promise<Application> => {
    const response = await fetch(`/api/applications/${id}`);
    return response.json();
  },

  createApplication: async (application: InsertApplication): Promise<Application> => {
    const response = await apiRequest('POST', '/api/applications', application);
    return response.json();
  },

  updateApplication: async (application: UpdateApplication): Promise<Application> => {
    const response = await apiRequest('PATCH', `/api/applications/${application.id}`, application);
    return response.json();
  },

  deleteApplication: async (id: string): Promise<void> => {
    await apiRequest('DELETE', `/api/applications/${id}`);
  },

  getStats: async (): Promise<ApplicationStats> => {
    const response = await fetch('/api/stats');
    return response.json();
  },

  // AI Services
  generateQuestions: async (role: string, company?: string): Promise<{ questions: string[] }> => {
    const response = await apiRequest('POST', '/api/ai/questions', { role, company });
    return response.json();
  },

  getFeedback: async (question: string, answer: string, role?: string): Promise<InterviewFeedback> => {
    const response = await apiRequest('POST', '/api/ai/feedback', { question, answer, role });
    return response.json();
  },

  // Sessions
  createSession: async (applicationId: string, questions: any[]): Promise<InterviewSession> => {
    const response = await apiRequest('POST', '/api/sessions', { applicationId, questions });
    return response.json();
  },

  getSessions: async (applicationId: string): Promise<InterviewSession[]> => {
    const response = await fetch(`/api/sessions/${applicationId}`);
    return response.json();
  },
};

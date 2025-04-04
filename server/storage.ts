import { 
  users, type User, type InsertUser, 
  analysis, type Analysis, type InsertAnalysis,
  feedback, type Feedback, type InsertFeedback 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(user: User): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Analysis operations
  saveAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getUserAnalyses(userId: number): Promise<Analysis[]>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAllAnalyses(): Promise<Analysis[]>;
  getFlaggedAnalyses(): Promise<Analysis[]>;
  flagAnalysis(id: number, isFlagged: boolean): Promise<Analysis | undefined>;
  
  // Feedback operations
  saveFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getAnalysisFeedback(analysisId: number): Promise<Feedback[]>;
  getAllFeedback(): Promise<Feedback[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private analyses: Map<number, Analysis>;
  private feedbacks: Map<number, Feedback>;
  private userIdCounter: number;
  private analysisIdCounter: number;
  private feedbackIdCounter: number;

  constructor() {
    this.users = new Map();
    this.analyses = new Map();
    this.feedbacks = new Map();
    this.userIdCounter = 1;
    this.analysisIdCounter = 1;
    this.feedbackIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const role = insertUser.role || "user";
    const user: User = { 
      ...insertUser, 
      id, 
      role, 
      createdAt 
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  // Analysis operations
  async saveAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.analysisIdCounter++;
    const createdAt = new Date();
    const isFlagged = insertAnalysis.isFlagged || false;
    const userId = insertAnalysis.userId || null;
    
    const analysisRecord: Analysis = {
      id,
      userId, 
      content: insertAnalysis.content,
      contentType: insertAnalysis.contentType,
      result: insertAnalysis.result,
      isFlagged,
      createdAt
    };
    
    this.analyses.set(id, analysisRecord);
    return analysisRecord;
  }

  async getUserAnalyses(userId: number): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }

  async getFlaggedAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.isFlagged)
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }

  async flagAnalysis(id: number, isFlagged: boolean): Promise<Analysis | undefined> {
    const analysis = this.analyses.get(id);
    if (!analysis) return undefined;
    
    const updatedAnalysis = { ...analysis, isFlagged };
    this.analyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  // Feedback operations
  async saveFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.feedbackIdCounter++;
    const createdAt = new Date();
    const userId = insertFeedback.userId || null;
    const analysisId = insertFeedback.analysisId || null;
    
    const feedbackRecord: Feedback = {
      id,
      userId,
      analysisId,
      content: insertFeedback.content,
      createdAt
    };
    
    this.feedbacks.set(id, feedbackRecord);
    return feedbackRecord;
  }

  async getAnalysisFeedback(analysisId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.analysisId === analysisId)
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }
}

export const storage = new MemStorage();

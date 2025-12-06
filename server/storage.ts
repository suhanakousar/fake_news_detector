import { 
  users, type User, type InsertUser, 
  analysis, type Analysis, type InsertAnalysis,
  feedback, type Feedback, type InsertFeedback 
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
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

// Initialize database connection
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(databaseUrl);
    db = drizzle(sql);
  }
  return db;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await getDb().insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await getDb().select().from(users);
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await getDb()
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Analysis operations
  async saveAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const result = await getDb().insert(analysis).values(insertAnalysis).returning();
    return result[0];
  }

  async getUserAnalyses(userId: number): Promise<Analysis[]> {
    return await getDb()
      .select()
      .from(analysis)
      .where(eq(analysis.userId, userId))
      .orderBy(desc(analysis.createdAt));
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const result = await getDb().select().from(analysis).where(eq(analysis.id, id)).limit(1);
    return result[0];
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return await getDb().select().from(analysis).orderBy(desc(analysis.createdAt));
  }

  async getFlaggedAnalyses(): Promise<Analysis[]> {
    return await getDb()
      .select()
      .from(analysis)
      .where(eq(analysis.isFlagged, true))
      .orderBy(desc(analysis.createdAt));
  }

  async flagAnalysis(id: number, isFlagged: boolean): Promise<Analysis | undefined> {
    const result = await getDb()
      .update(analysis)
      .set({ isFlagged })
      .where(eq(analysis.id, id))
      .returning();
    return result[0];
  }

  // Feedback operations
  async saveFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const result = await getDb().insert(feedback).values(insertFeedback).returning();
    return result[0];
  }

  async getAnalysisFeedback(analysisId: number): Promise<Feedback[]> {
    return await getDb()
      .select()
      .from(feedback)
      .where(eq(feedback.analysisId, analysisId))
      .orderBy(desc(feedback.createdAt));
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return await getDb().select().from(feedback).orderBy(desc(feedback.createdAt));
  }
}

// In-memory storage for fallback/development
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
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
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

// Use database storage if DATABASE_URL is set, otherwise fall back to memory storage
export const storage: IStorage = process.env.DATABASE_URL 
  ? new DatabaseStorage()
  : new MemStorage();

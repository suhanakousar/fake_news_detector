import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertAnalysisSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { analyzeText } from "./lib/analyzer";
import { analyzeImage } from "./lib/imageAnalyzer";
import { analyzeUrl } from "./lib/urlAnalyzer";
import { analyzeDocument } from "./lib/documentAnalyzer";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";

// Create a memory store for sessions
const SessionStore = MemoryStore(session);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "truthlens-secret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Middleware to check if user is an admin
  const isAdmin = async (req: Request, res: Response, next: Function) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      console.error("Error in admin middleware:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(parsedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(parsedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(parsedData.password, salt);

      // Create the user
      const newUser = await storage.createUser({
        ...parsedData,
        password: hashedPassword,
      });

      // Set user session
      req.session.userId = newUser.id;

      // Remove the password before returning the user
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "An error occurred during registration" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsedData = loginSchema.parse(req.body);
      
      // Find the user
      const user = await storage.getUserByUsername(parsedData.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(parsedData.password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user session
      req.session.userId = user.id;

      // Remove the password before returning the user
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "An error occurred during login" });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove the password before returning the user
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Analysis routes
  app.post("/api/analyze/text", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ message: "Text is required" });
      }

      const result = await analyzeText(text);
      
      // If user is authenticated, save the analysis
      if (req.session.userId) {
        await storage.saveAnalysis({
          userId: req.session.userId,
          content: text,
          contentType: "text",
          result,
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error analyzing text:", error);
      res.status(500).json({ message: "An error occurred during analysis" });
    }
  });

  app.post("/api/analyze/url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return res.status(400).json({ message: "URL is required" });
      }

      const result = await analyzeUrl(url);
      
      // If user is authenticated, save the analysis
      if (req.session.userId) {
        await storage.saveAnalysis({
          userId: req.session.userId,
          content: url,
          contentType: "url",
          result,
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error analyzing URL:", error);
      res.status(500).json({ message: "An error occurred during URL analysis" });
    }
  });

  app.post("/api/analyze/image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const result = await analyzeImage(req.file.buffer);
      
      // If user is authenticated, save the analysis
      if (req.session.userId) {
        await storage.saveAnalysis({
          userId: req.session.userId,
          content: "Image upload", // Since we can't easily store the actual image
          contentType: "image",
          result,
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ message: "An error occurred during image analysis" });
    }
  });

  app.post("/api/analyze/document", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Document file is required" });
      }

      const result = await analyzeDocument(req.file.buffer, req.file.originalname);
      
      // If user is authenticated, save the analysis
      if (req.session.userId) {
        await storage.saveAnalysis({
          userId: req.session.userId,
          content: req.file.originalname,
          contentType: "document",
          result,
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error analyzing document:", error);
      res.status(500).json({ message: "An error occurred during document analysis" });
    }
  });

  // History routes
  app.get("/api/history", isAuthenticated, async (req, res) => {
    try {
      const analyses = await storage.getUserAnalyses(req.session.userId!);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ message: "An error occurred while fetching history" });
    }
  });

  app.get("/api/analysis/:id", isAuthenticated, async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Check if the analysis belongs to the authenticated user
      if (analysis.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to this analysis" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "An error occurred while fetching analysis" });
    }
  });
  
  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords before sending
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "An error occurred while fetching users" });
    }
  });
  
  app.get("/api/admin/analyses", isAdmin, async (req, res) => {
    try {
      const analyses = await storage.getAllAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching all analyses:", error);
      res.status(500).json({ message: "An error occurred while fetching analyses" });
    }
  });
  
  app.get("/api/admin/analyses/flagged", isAdmin, async (req, res) => {
    try {
      const flaggedAnalyses = await storage.getFlaggedAnalyses();
      res.json(flaggedAnalyses);
    } catch (error) {
      console.error("Error fetching flagged analyses:", error);
      res.status(500).json({ message: "An error occurred while fetching flagged analyses" });
    }
  });
  
  app.patch("/api/admin/analysis/:id/flag", isAdmin, async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }
      
      const { isFlagged } = req.body;
      if (typeof isFlagged !== 'boolean') {
        return res.status(400).json({ message: "isFlagged parameter must be a boolean" });
      }
      
      const analysis = await storage.flagAnalysis(analysisId, isFlagged);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error flagging analysis:", error);
      res.status(500).json({ message: "An error occurred while flagging analysis" });
    }
  });
  
  app.get("/api/admin/feedback", isAdmin, async (req, res) => {
    try {
      const feedback = await storage.getAllFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "An error occurred while fetching feedback" });
    }
  });
  
  app.post("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const { analysisId, content } = req.body;
      if (!analysisId || !content) {
        return res.status(400).json({ message: "Analysis ID and content are required" });
      }
      
      const feedback = await storage.saveFeedback({
        userId: req.session.userId!,
        analysisId,
        content
      });
      
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error saving feedback:", error);
      res.status(500).json({ message: "An error occurred while saving feedback" });
    }
  });
  
  // Temporary route for testing purposes - make a user an admin
  app.post("/api/make-admin", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user role to admin
      user.role = "admin";
      
      // Save the updated user
      await storage.updateUser(user);
      
      // Update session with the new user data
      req.session.userId = user.id;
      
      // Remove password before returning
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

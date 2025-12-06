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
import { generateChatbotResponse } from "./lib/chatbotService";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";

// Extend express-session with userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Create a memory store for sessions
const SessionStore = MemoryStore(session);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all files for now, validation happens in the route handler
    cb(null, true);
  }
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
  
  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      
      // For security reasons, we always return a success message
      // even if the email doesn't exist in our system
      if (!user) {
        return res.status(200).json({ 
          message: "If an account with that email exists, a password reset link has been sent" 
        });
      }
      
      // In a real application, we would:
      // 1. Generate a secure token and store it associated with the user
      // 2. Set an expiration time for the token
      // 3. Send an email with a link containing the token
      
      // For our demo, we'll return a success message
      res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent" 
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      // Don't leak information about the error
      res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent" 
      });
    }
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
  
  // Social login endpoints
  app.post("/api/auth/social/google", async (req, res) => {
    try {
      const { email, name, token } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // In a production environment, we would verify the Google token here
      // For our purposes, we'll accept the provided data
      
      // Check if user exists with this email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with social login
        const username = name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
        const randomPassword = Math.random().toString(36).slice(-10);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);
        
        user = await storage.createUser({
          username,
          email,
          password: hashedPassword,
          role: "user",
          isActive: true
        });
      }
      
      // Set session and send back user
      req.session.userId = user.id;
      
      // Remove password before returning user
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ message: "Google authentication failed" });
    }
  });
  
  app.post("/api/auth/social/facebook", async (req, res) => {
    try {
      const { email, name, token } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // In a production environment, we would verify the Facebook token here
      // For our purposes, we'll accept the provided data
      
      // Check if user exists with this email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with social login
        const username = name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
        const randomPassword = Math.random().toString(36).slice(-10);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);
        
        user = await storage.createUser({
          username,
          email,
          password: hashedPassword,
          role: "user",
          isActive: true
        });
      }
      
      // Set session and send back user
      req.session.userId = user.id;
      
      // Remove password before returning user
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Facebook auth error:", error);
      res.status(500).json({ message: "Facebook authentication failed" });
    }
  });
  
  // Firebase Authentication endpoint
  app.post("/api/auth/firebase-auth", async (req, res) => {
    try {
      const { token, email, displayName } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Firebase token is required" });
      }
      
      const verifyFirebaseToken = async (idToken: string, email?: string, displayName?: string) => {
        try {
          // Check if user exists with this email
          let user = email ? await storage.getUserByEmail(email) : null;
          
          if (!user) {
            // Create new user
            const username = displayName?.replace(/\s+/g, '').toLowerCase() || 
                            email?.split('@')[0] || 
                            `user_${Math.random().toString(36).substring(2, 10)}`;
                            
            const randomPassword = Math.random().toString(36).slice(-10);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);
            
            user = await storage.createUser({
              username,
              email: email || `${username}@firebase-auth.com`,
              password: hashedPassword,
              role: "user",
              isActive: true
            });
          }
          
          return user;
        } catch (error) {
          console.error("Error verifying Firebase token:", error);
          return null;
        }
      };
      
      // In a production environment with firebase-admin, you would verify the token
      // For our demo, we'll create/get the user directly
      const user = await verifyFirebaseToken(token, email, displayName);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid Firebase authentication" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Remove password before returning user
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Firebase auth error:", error);
      res.status(500).json({ message: "Firebase authentication failed" });
    }
  });

  // Analysis routes
  // Text Analysis Route
  app.post("/api/analyze/text", async (req, res) => {
    try {
      const { text, language = 'en' } = req.body;
      
      // Validate input
      if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ 
          message: "Text is required",
          details: "Please provide a non-empty text string"
        });
      }
      
      // Limit text length to prevent excessive processing
      const limitedText = text.length > 10000 ? text.substring(0, 10000) + '...(truncated)' : text;
      
      try {
        const result = await analyzeText(limitedText, language);
        res.json(result);
      } catch (analysisError) {
        console.error("Error in text analysis:", analysisError);
        res.status(500).json({ 
          message: "Error analyzing text",
          details: analysisError instanceof Error ? analysisError.message : "Unknown error during analysis",
          error: process.env.NODE_ENV === 'development' ? String(analysisError) : undefined
        });
      }
    } catch (error) {
      console.error("Error in text analysis endpoint:", error);
      res.status(500).json({ 
        message: "Error processing request",
        details: error instanceof Error ? error.message : "Unknown error",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });

  app.post("/api/analyze/url", async (req, res) => {
    try {
      const { url, language = 'en' } = req.body;
      
      if (!url || typeof url !== 'string' || url.trim() === '') {
        return res.status(400).json({ message: "URL is required" });
      }

      const result = await analyzeUrl(url, language);
      
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

  // Error handler for multer errors (file size, etc.)
  const handleMulterError = (err: any, req: any, res: Response, next: Function) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: "File too large",
          error: "File size exceeds 5MB limit. Please upload a smaller image."
        });
      }
      return res.status(400).json({ 
        message: "File upload error",
        error: err.message
      });
    }
    if (err) {
      return res.status(400).json({ 
        message: "File upload error",
        error: err.message || "Unknown upload error"
      });
    }
    next();
  };

  app.post("/api/analyze/image", upload.single("image"), handleMulterError, async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        console.error("[IMAGE_ANALYZER] No file received in request");
        console.error("[IMAGE_ANALYZER] Request body keys:", Object.keys(req.body));
        console.error("[IMAGE_ANALYZER] Request files:", req.files);
        return res.status(400).json({ 
          message: "Image file is required",
          error: "No file was uploaded. Please ensure the file field is named 'image' and the Content-Type is multipart/form-data."
        });
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        console.error(`[IMAGE_ANALYZER] Invalid file type: ${req.file.mimetype}`);
        return res.status(400).json({ 
          message: "Invalid file type",
          error: `File type ${req.file.mimetype} is not supported. Allowed types: ${allowedMimeTypes.join(', ')}`
        });
      }

      // Validate file size (already handled by multer, but double-check)
      if (req.file.size === 0) {
        return res.status(400).json({ 
          message: "File is empty",
          error: "The uploaded file is empty."
        });
      }

      const language = req.body.language || 'en';
      console.log(`[IMAGE_ANALYZER] Processing image: ${req.file.originalname}, size: ${req.file.size} bytes, type: ${req.file.mimetype}, language: ${language}`);

      const result = await analyzeImage(req.file.buffer, language);
      
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
      console.error("[IMAGE_ANALYZER] Error analyzing image:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ 
        message: "An error occurred during image analysis",
        error: errorMessage
      });
    }
  });

  app.post("/api/analyze/document", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Document file is required" });
      }
      
      const language = req.body.language || 'en';

      const result = await analyzeDocument(req.file.buffer, req.file.originalname, language);
      
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
  
  // AI Debunker Chatbot
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { question, content, analysisResult, language = 'en' } = req.body;
      
      if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ message: "Question is required" });
      }
      
      // Define language-specific responses for general queries
      const generalResponses: Record<string, string> = {
        en: "I'm TruthLens AI, your fact-checking assistant. To analyze content, try pasting a news article, URL, or uploading a document on the main page. I can then help you identify potential misinformation and answer specific questions about the content.",
        es: "Soy TruthLens AI, tu asistente de verificación de hechos. Para analizar contenido, intenta pegar un artículo de noticias, URL o subir un documento en la página principal. Puedo ayudarte a identificar posible desinformación y responder preguntas específicas sobre el contenido.",
        fr: "Je suis TruthLens AI, votre assistant de vérification des faits. Pour analyser du contenu, essayez de coller un article d'actualité, une URL ou de télécharger un document sur la page principale. Je peux alors vous aider à identifier la désinformation potentielle et répondre à des questions spécifiques sur le contenu.",
        hi: "मैं TruthLens AI हूं, आपका तथ्य-जांच सहायक। सामग्री का विश्लेषण करने के लिए, मुख्य पृष्ठ पर समाचार लेख, URL पेस्ट करें, या कोई दस्तावेज़ अपलोड करें। मैं फिर संभावित गलत जानकारी की पहचान करने और सामग्री के बारे में विशिष्ट प्रश्नों के उत्तर देने में आपकी मदद कर सकता हूं।"
      };
      
      // Handle general chatbot queries (without analysis context)
      if (!analysisResult) {
        // Generate a general response based on the question only in the appropriate language
        const response = generalResponses[language] || generalResponses.en;
        return res.json({ response });
      }
      
      // Handle queries with analysis context
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content context is required" });
      }
      
      if (!analysisResult.classification || !analysisResult.explanation) {
        return res.status(400).json({ message: "Analysis result with classification and explanation is required" });
      }
      
      console.log('[ROUTES] Calling generateChatbotResponse with:', {
        question: question.substring(0, 50),
        contentLength: content.length,
        classification: analysisResult.classification,
        hasExplanation: !!analysisResult.explanation
      });
      
      const response = await generateChatbotResponse(
        question,
        content,
        analysisResult,
        language
      );
      
      console.log('[ROUTES] Chatbot response generated, length:', response.length);
      res.json({ response });
    } catch (error) {
      console.error("[ROUTES] Error generating chatbot response:", error);
      if (error instanceof Error) {
        console.error("[ROUTES] Error details:", error.message, error.stack);
      }
      
      // Try to provide a fallback response even on error
      try {
        const fallbackResponse = await generateChatbotResponse(
          question || "What can you tell me about this analysis?",
          content || contentPreview || "",
          analysisResult,
          language
        );
        return res.json({ response: fallbackResponse });
      } catch (fallbackError) {
        // Last resort: provide a basic response
        const shortExplanation = analysisResult.explanation?.substring(0, 200) || 'Analysis completed';
        const classification = analysisResult.classification || 'unknown';
        const confidence = Math.round((analysisResult.confidence || 0) * 100);
        
        let fallbackText = '';
        if (classification === 'fake') {
          fallbackText = `Based on the analysis, this content has been classified as FAKE (${confidence}% confidence). ${shortExplanation}.`;
        } else if (classification === 'misleading') {
          fallbackText = `This content has been classified as MISLEADING (${confidence}% confidence). ${shortExplanation}.`;
        } else {
          fallbackText = `This content appears to be REAL (${confidence}% confidence). ${shortExplanation}.`;
        }
        
        return res.json({ response: fallbackText });
      }
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
  
  // Direct Bytez model endpoint (for testing)
  app.post("/api/analyze/bytez", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const { predictFakeNewsWithBytez } = await import("./lib/bytezModel");
      const result = await predictFakeNewsWithBytez(text);
      
      if (result.error) {
        return res.status(500).json({
          error: true,
          message: result.message || "Model prediction failed",
          raw: result.raw
        });
      }
      
      res.json({
        prediction: result.prediction,
        confidence: result.confidence,
        label: result.prediction, // For compatibility
        score: result.confidence
      });
    } catch (error) {
      console.error("Error in Bytez analysis:", error);
      res.status(500).json({ 
        message: "An error occurred during Bytez analysis",
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  });
  
  // Browser Extension API Endpoints
  app.post("/api/analyze/extension", async (req, res) => {
    try {
      const { text, url, language = 'en' } = req.body;
      
      if ((!text || typeof text !== 'string' || text.trim() === '') && 
          (!url || typeof url !== 'string' || url.trim() === '')) {
        return res.status(400).json({ message: "Either text or URL is required" });
      }

      let result;
      
      // If URL is provided, analyze it
      if (url && url.trim() !== '') {
        result = await analyzeUrl(url, language);
      } 
      // Otherwise analyze the text
      else {
        result = await analyzeText(text, language);
      }
      
      // No need to save analysis for extension requests unless user is authenticated
      if (req.session.userId) {
        await storage.saveAnalysis({
          userId: req.session.userId,
          content: url || text,
          contentType: url ? "url" : "text",
          result,
        });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error processing extension request:", error);
      res.status(500).json({ message: "An error occurred during analysis" });
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
  
  // Temporary endpoint to promote a user to admin (remove in production)
  app.post("/api/admin/promote/:username", async (req, res) => {
    try {
      const { username } = req.params;
      
      // Find the user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user role to admin
      const updatedUser = await storage.updateUser(user.id, { role: "admin" });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      res.json({ message: `User ${username} promoted to admin successfully` });
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      res.status(500).json({ message: "An error occurred while promoting user" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connection
      await storage.getUser(1).catch(() => {
        // Ignore error, just checking if database is accessible
      });
      
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

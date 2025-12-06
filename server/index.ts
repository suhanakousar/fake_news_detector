// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { type CorsRequest } from 'cors';
import cors from 'cors';
import path from "path";
import fs from "fs";

const app = express();

// Add startup logging
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Configure CORS and other middleware
// In production, allow requests from Render domain and localhost for development
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.RENDER_EXTERNAL_URL, // Render's external URL
      process.env.RENDER_EXTERNAL_HOSTNAME, // Alternative Render hostname format
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ].filter(Boolean) // Remove undefined values
  : [
      'http://localhost:5002', 
      'http://127.0.0.1:5002', 
      'http://localhost:5173', 
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    if (!origin) return callback(null, true);
    
    // In production, be more strict; in development, allow all localhost
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins in production for now (adjust if needed)
      }
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add this before registerRoutes
app.options('/api/analyze/text', (req, res) => {
  res.status(204).end();
});

(async () => {
  try {
    const server = await registerRoutes(app);
    
    // Determine if we're in production
    // Check multiple signals: NODE_ENV, existence of built files, or Render environment
    const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    const hasBuiltFiles = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"));
    const explicitProduction = process.env.NODE_ENV === "production";
    const isRender = !!process.env.RENDER; // Render sets this automatically
    
    // Use production mode if:
    // 1. NODE_ENV is explicitly "production", OR
    // 2. Built files exist (we're running a built version), OR
    // 3. We're on Render (and not explicitly in development)
    const isProduction = explicitProduction || 
                        (hasBuiltFiles && process.env.NODE_ENV !== "development") ||
                        (isRender && process.env.NODE_ENV !== "development");
    
    log(`🔍 Production detection: NODE_ENV=${process.env.NODE_ENV}, hasBuiltFiles=${hasBuiltFiles}, isRender=${isRender}, isProduction=${isProduction}`);
    
    // Setup Vite for development, serve static files in production
    if (!isProduction) {
      log(`🔧 Using Vite dev server`);
      await setupVite(app, server);
    } else {
      log(`📦 Using production static file serving`);
      // In production, serve the built React app
      serveStatic(app);
    }
    
    const port = process.env.PORT || 5002;
    server.listen(port, "0.0.0.0", () => {
      log(`🚀 Server running on port ${port}`);
      log(`📦 Environment: ${isProduction ? 'production' : 'development'}`);
      if (isProduction) {
        log(`🌐 Serving static files from: ${distPath}`);
      }
    });

    // Add error handler for server
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Error: Port ${port} is already in use`);
      } else {
        log('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    log('Failed to start server:', error);
    process.exit(1);
  }
})();

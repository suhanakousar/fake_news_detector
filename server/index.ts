// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { type CorsRequest } from 'cors';
import cors from 'cors';

const app = express();

// Add startup logging
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Configure CORS and other middleware
app.use(cors({
  origin: [
    'http://localhost:5002', 
    'http://127.0.0.1:5002', 
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
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
    
    // Setup Vite for development
    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    const port = process.env.PORT || 5002;
    server.listen(port, "0.0.0.0", () => {
      log(`Server running on port ${port}`);
      log(`CORS enabled for origins: ${['http://localhost:5002', 'http://127.0.0.1:5002', 'http://localhost:5173', 'http://127.0.0.1:5173']}`);
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

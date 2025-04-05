import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "truthlens-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Regular username/password strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Regular auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      // Check if user exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: "user",
        isActive: true
      });

      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json({ 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { id, username, email, role } = req.user;
    res.json({ id, username, email, role });
  });

  // Social login mock routes (for demonstration purposes)
  app.post("/api/auth/social/google", async (req, res) => {
    try {
      // In a real implementation, you'd verify the Google token
      // For demo purposes, we'll create or find a user based on the email
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if user exists with this email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with random password (they'll use Google to login)
        const username = name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
        const randomPassword = randomBytes(16).toString('hex');
        const hashedPassword = await hashPassword(randomPassword);
        
        user = await storage.createUser({
          username,
          email,
          password: hashedPassword,
          role: "user",
          isActive: true
        });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.status(200).json({ 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        });
      });
    } catch (error) {
      console.error("Google login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/social/facebook", async (req, res) => {
    try {
      // In a real implementation, you'd verify the Facebook token
      // For demo purposes, we'll create or find a user based on the email
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if user exists with this email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with random password (they'll use Facebook to login)
        const username = name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
        const randomPassword = randomBytes(16).toString('hex');
        const hashedPassword = await hashPassword(randomPassword);
        
        user = await storage.createUser({
          username,
          email,
          password: hashedPassword,
          role: "user",
          isActive: true
        });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.status(200).json({ 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        });
      });
    } catch (error) {
      console.error("Facebook login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Forgot password route (simulation for demo)
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Check if user exists
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return res.status(200).json({ message: "If an account with that email exists, we've sent a password reset link" });
    }
    
    // In a real implementation, you would:
    // 1. Generate a token
    // 2. Store it with the user record with an expiration
    // 3. Send an email with a link containing the token
    
    return res.status(200).json({ message: "Password reset email sent" });
  });
}
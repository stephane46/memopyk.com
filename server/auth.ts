import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "memopyk2024admin";
const SESSION_SECRET = process.env.SESSION_SECRET || "memopyk-admin-secret-key";

// In-memory session store (replace with Redis in production)
const sessions = new Map<string, { userId: string; expiresAt: Date }>();

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function createSession(userId: string): string {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  sessions.set(sessionId, { userId, expiresAt });
  
  // Clean up expired sessions
  cleanupExpiredSessions();
  
  return sessionId;
}

export function validateSession(sessionId: string): string | null {
  const session = sessions.get(sessionId);
  
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      sessions.delete(sessionId);
    }
    return null;
  }
  
  return session.userId;
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function cleanupExpiredSessions(): void {
  const now = new Date();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
    }
  }
}

export function validatePassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const userId = validateSession(sessionId);
  
  if (!userId) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
  
  req.user = { id: userId };
  next();
}

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: Date }>();

export function rateLimitLogin(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = new Date();
  
  let attempts = loginAttempts.get(ip);
  
  if (!attempts || attempts.resetAt < now) {
    attempts = { count: 0, resetAt: new Date(now.getTime() + 15 * 60 * 1000) }; // 15 minutes
    loginAttempts.set(ip, attempts);
  }
  
  if (attempts.count >= 5) {
    return res.status(429).json({ 
      message: "Too many login attempts. Please try again later.",
      resetAt: attempts.resetAt
    });
  }
  
  // Increment attempt count for failed attempts (handled in route)
  req.loginAttempts = attempts;
  next();
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      loginAttempts?: { count: number; resetAt: Date };
    }
  }
}

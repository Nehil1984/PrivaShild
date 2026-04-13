import type { Request, Response, NextFunction } from "express";

const loginAttempts = new Map<string, { count: number; firstAt: number; blockedUntil: number }>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

function clientKey(req: Request) {
  return String(req.ip || req.socket.remoteAddress || "unknown");
}

export function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = clientKey(req);
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current) return next();

  if (current.blockedUntil > now) {
    const retryAfter = Math.ceil((current.blockedUntil - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({ message: "Zu viele Login-Versuche. Bitte später erneut versuchen." });
  }

  if (now - current.firstAt > WINDOW_MS) {
    loginAttempts.delete(key);
  }

  next();
}

export function registerLoginFailure(req: Request) {
  const key = clientKey(req);
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || now - current.firstAt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: now, blockedUntil: 0 });
    return;
  }

  current.count += 1;
  if (current.count >= MAX_ATTEMPTS) {
    current.blockedUntil = now + BLOCK_MS;
  }
  loginAttempts.set(key, current);
}

export function clearLoginFailures(req: Request) {
  loginAttempts.delete(clientKey(req));
}

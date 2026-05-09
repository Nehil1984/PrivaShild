// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const loginAttempts = new Map<string, { count: number; firstAt: number; blockedUntil: number }>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;
const CSRF_COOKIE_NAME = "privashield_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const TRUSTED_PROXY_HEADERS = ["x-forwarded-host", "x-forwarded-proto"] as const;
const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecret(): string | null {
  return JWT_SECRET || null;
}

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

function readNamedCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${name}=`)) continue;
    const rawValue = trimmed.slice(name.length + 1);
    if (!rawValue) return null;
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

export function issueCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function setCsrfCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === "production";
  const cookie = [
    `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${8 * 60 * 60}`,
    isProduction ? "Secure" : "",
  ].filter(Boolean).join("; ");
  res.append("Set-Cookie", cookie);
}

export function clearCsrfCookie(res: Response) {
  const isProduction = process.env.NODE_ENV === "production";
  const cookie = [
    `${CSRF_COOKIE_NAME}=`,
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
    isProduction ? "Secure" : "",
  ].filter(Boolean).join("; ");
  res.append("Set-Cookie", cookie);
}

function normalizeOrigin(value: string | undefined | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function getRequestOrigin(req: Request) {
  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  const referer = Array.isArray(refererHeader) ? refererHeader[0] : refererHeader;
  return normalizeOrigin(origin) || normalizeOrigin(referer) || null;
}

function getExpectedOrigin(req: Request) {
  const forwardedHost = req.headers[TRUSTED_PROXY_HEADERS[0]];
  const forwardedProto = req.headers[TRUSTED_PROXY_HEADERS[1]];
  const hostHeader = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
  const protoHeader = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const protocol = String(protoHeader || req.protocol || (process.env.NODE_ENV === "production" ? "https" : "http"));
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!host) return null;
  return `${protocol}://${host}`;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (CSRF_SAFE_METHODS.has(req.method.toUpperCase())) return next();

  const requestOrigin = getRequestOrigin(req);
  const expectedOrigin = getExpectedOrigin(req);
  if (requestOrigin && expectedOrigin && requestOrigin !== expectedOrigin) {
    return res.status(403).json({ message: "Origin-Prüfung fehlgeschlagen" });
  }

  const authCookie = readNamedCookie(req, "privashield_auth");
  const secret = getJwtSecret();

  if (authCookie && secret) {
    try {
      jwt.verify(authCookie, secret);
      return next();
    } catch {
      // fall through to explicit csrf token validation
    }
  }

  const cookieToken = readNamedCookie(req, CSRF_COOKIE_NAME);
  const headerToken = req.headers[CSRF_HEADER_NAME] || req.headers[CSRF_HEADER_NAME.toUpperCase()];
  const requestToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;

  if (!cookieToken || !requestToken || cookieToken !== requestToken) {
    return res.status(403).json({ message: "CSRF-Prüfung fehlgeschlagen" });
  }

  next();
}

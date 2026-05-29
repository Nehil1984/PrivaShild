// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import express, { type Express, type Request, type Response, type NextFunction } from "express";
import type { Server } from "http";
import { storage, reloadStorage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readDbBackend, writeDbBackend } from "./db-config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { clearCsrfCookie, clearLoginFailures, csrfProtection, issueCsrfToken, loginRateLimit, registerLoginFailure, setCsrfCookie } from "./security";
import { inspectBackup, inspectUploadedBackup, listBackups, nextBackupRunEstimate, readBackupConfig, readBackupStatus, restoreBackup, restoreUploadedBackup, runBackupNow, startBackupScheduler, writeBackupConfig } from "./backup";
import { validateBody } from "./validation";
import { insertAuditSchema, insertAvvSchema, insertDatenpanneSchema, insertDokumentSchema, insertDsfaSchema, insertDsrSchema, insertLoeschkonzeptSchema, insertMandantenGruppeSchema, insertInterneNotizSchema, insertMandantSchema, insertPdcaSchema, insertTomSchema, insertUserSchema, insertVorlagenpaketSchema, insertVvtSchema, requestAuditSchema, requestAvvSchema, requestBackupConfigSchema, requestBackupRestoreSchema, requestDatenpanneSchema, requestDokumentSchema, requestDsfaSchema, requestDsrSchema, requestInterneNotizSchema, requestLoeschkonzeptSchema, requestPdcaSchema, requestTomSchema, requestVvtSchema } from "@shared/schema";
import { z, type ZodTypeAny } from "zod";

const JWT_SECRET = process.env.JWT_SECRET;

const metaBranchen = [
  "Dienstleistung", "Handel", "Industrie", "Gesundheit", "IT / SaaS", "Bildung", "Finanzen", "Öffentlicher Bereich", "Immobilien", "Logistik", "Marketing", "Personalwesen"
];

const metaLoeschfristen = [
  { key: "frei", label: "Freie / manuelle Frist", frist: "", referenzen: ["Freie Eingabe / interne Vorgabe"] },
  { key: "6_monate_bewerber", label: "6 Monate, Bewerbungsverfahren", frist: "6 Monate", referenzen: ["§ 15 Abs. 4 AGG / Verteidigung gegen AGG-Ansprüche"] },
  { key: "2_jahre_handelsbriefe", label: "2 Jahre, steuerliche Sonderfälle", frist: "2 Jahre", referenzen: ["§ 147a AO in Sonderkonstellationen"] },
  { key: "3_jahre_regel", label: "3 Jahre, regelmäßige Verjährung", frist: "3 Jahre", referenzen: ["§§ 195, 199 BGB"] },
  { key: "5_jahre_gw", label: "5 Jahre, Geldwäsche- und Sanktionsunterlagen", frist: "5 Jahre", referenzen: ["§ 8 GwG"] },
  { key: "6_jahre_hgb", label: "6 Jahre, Handels- und Geschäftsbriefe", frist: "6 Jahre", referenzen: ["§ 257 Abs. 1 Nr. 2 und 3 HGB", "§ 147 Abs. 1 Nr. 2, 3, 5 AO"] },
  { key: "8_jahre_buchung", label: "8 Jahre, Buchungsbelege", frist: "8 Jahre", referenzen: ["§ 147 Abs. 3 AO"] },
  { key: "10_jahre_ao_hgb", label: "10 Jahre, Buchführungs- und Steuerunterlagen", frist: "10 Jahre", referenzen: ["§ 257 Abs. 1 Nr. 1 und 4 HGB", "§ 147 Abs. 1 Nr. 1, 4, 4a AO"] },
  { key: "30_jahre_titel", label: "30 Jahre, titulierte Forderungen / Spezialfälle", frist: "30 Jahre", referenzen: ["§ 197 BGB"] },
];

const metaVvtLoeschmapping = [
  { pattern: "bewerber", fristKategorie: "6_monate_bewerber", loeschklasse: "LK4", gesetzlicheFrist: "§ 15 Abs. 4 AGG / Verteidigung gegen AGG-Ansprüche" },
  { pattern: "personal", fristKategorie: "10_jahre_ao_hgb", loeschklasse: "LK4", gesetzlicheFrist: "§ 147 AO / § 257 HGB, soweit abrechnungs- und nachweispflichtig" },
  { pattern: "crm|kunden", fristKategorie: "3_jahre_regel", loeschklasse: "LK2", gesetzlicheFrist: "§§ 195, 199 BGB" },
  { pattern: "newsletter", fristKategorie: "3_jahre_regel", loeschklasse: "LK2", gesetzlicheFrist: "§§ 195, 199 BGB, Nachweis über Einwilligung" },
  { pattern: "video", fristKategorie: "frei", loeschklasse: "LK5", gesetzlicheFrist: "Kurzfristige Speicherfrist nach Erforderlichkeit" },
  { pattern: "ki", fristKategorie: "frei", loeschklasse: "LK5", gesetzlicheFrist: "Einzelfallabhängig nach Use Case und Rechtsgrundlage" },
];


const metaBeschaeftigtenDatenschutz = {
  zielgruppen: ["Beschäftigte", "Führungskräfte", "HR", "IT", "Support", "Vertrieb"],
  schulungsformate: ["praesenz", "online", "hybrid"],
  standardIntervallMonate: 12,
  module: ["datenschutzerklaerung_beschaeftigte", "verpflichtung_verschwiegenheit", "verpflichtung_telekommunikation", "schulungen"],
};

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET ist nicht gesetzt. Bitte sichere Umgebungsvariable konfigurieren.");
  }
  return JWT_SECRET;
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

function readCookieToken(req: Request): string | null {
  return readNamedCookie(req, "privashield_auth");
}

function attachCsrfToken(user: any) {
  const csrfToken = issueCsrfToken();
  return { user: { ...user, csrfToken }, csrfToken };
}

function normalizeProto(value: string | undefined | null) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .find(Boolean) || null;
}

function shouldUseSecureCookies(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protoHeader = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const normalizedForwardedProto = normalizeProto(protoHeader);

  if (normalizedForwardedProto) {
    return normalizedForwardedProto === "https";
  }

  const encryptedHeader = req.headers["x-forwarded-ssl"];
  const encryptedValue = Array.isArray(encryptedHeader) ? encryptedHeader[0] : encryptedHeader;
  if (String(encryptedValue || "").trim().toLowerCase() === "on") {
    return true;
  }

  const forwardedPort = req.headers["x-forwarded-port"];
  const portValue = Array.isArray(forwardedPort) ? forwardedPort[0] : forwardedPort;
  if (String(portValue || "").trim() === "443") {
    return true;
  }

  return req.protocol === "https";
}

function setAuthCookie(req: Request, res: Response, token: string) {
  const secure = shouldUseSecureCookies(req);
  const cookie = [
    `privashield_auth=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${8 * 60 * 60}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
  res.setHeader("Set-Cookie", cookie);
}

function clearAuthCookie(req: Request, res: Response) {
  const secure = shouldUseSecureCookies(req);
  const cookie = [
    "privashield_auth=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
  res.setHeader("Set-Cookie", cookie);
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = readCookieToken(req);
  if (!token) return res.status(401).json({ message: "Nicht authentifiziert" });
  try {
    const payload = jwt.verify(token, getJwtSecret()) as unknown as { userId: number; role: string };
    (req as any).userId = payload.userId;
    (req as any).userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ message: "Token ungültig" });
  }
}

function adminOnly(req: Request, res: Response, next: NextFunction) {
  if ((req as any).userRole !== "admin") return res.status(403).json({ message: "Nur für Administratoren" });
  next();
}

async function auditLog(event: {
  mandantId?: number | null;
  userId?: number | null;
  userName?: string;
  aktion: string;
  modul: string;
  entitaetTyp?: string;
  entitaetId?: number | null;
  beschreibung: string;
  details?: Record<string, unknown>;
}) {
  const mId = event.mandantId ?? 0;
  let uName = event.userName;
  if (!uName && event.userId) {
    const user = await storage.getUserById(event.userId);
    if (user) uName = user.name;
  }
  await storage.createMandantenLog({
    mandantId: mId,
    userId: event.userId ?? null,
    userName: uName || "System",
    aktion: event.aktion,
    modul: event.modul,
    entitaetTyp: event.entitaetTyp,
    entitaetId: event.entitaetId ?? null,
    beschreibung: event.beschreibung,
    detailsJson: JSON.stringify(event.details || {}),
  });
}

function diffObjects(before: Record<string, any> | undefined, after: Record<string, any> | undefined) {
  const previous = before || {};
  const next = after || {};
  const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(next)])).sort();
  const changes: Array<{ field: string; before: unknown; after: unknown }> = [];

  for (const key of keys) {
    const a = previous[key];
    const b = next[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({ field: key, before: a, after: b });
    }
  }

  return changes;
}

function normalizeDsfaRisks(raw: unknown) {
  const input = typeof raw === "string"
    ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      })()
    : raw;

  if (!Array.isArray(input)) {
    throw new Error("DSFA-Risiken müssen als JSON-Liste übergeben werden.");
  }

  return input.map((risk, index) => {
    if (!risk || typeof risk !== "object" || Array.isArray(risk)) {
      throw new Error(`DSFA-Risiko ${index + 1} ist ungültig.`);
    }

    const normalized = {
      titel: String((risk as any).titel || "").trim(),
      beschreibung: String((risk as any).beschreibung || "").trim(),
      betroffeneRechte: String((risk as any).betroffeneRechte || "").trim(),
      betroffeneGruppen: String((risk as any).betroffeneGruppen || "").trim(),
      datenarten: String((risk as any).datenarten || "").trim(),
      ursache: String((risk as any).ursache || "").trim(),
      bestehendeKontrollen: String((risk as any).bestehendeKontrollen || "").trim(),
      eintrittswahrscheinlichkeit: String((risk as any).eintrittswahrscheinlichkeit || "").trim(),
      schweregrad: String((risk as any).schweregrad || "").trim(),
      inhärentesRisiko: String((risk as any).inhärentesRisiko || "").trim(),
      restrisiko: String((risk as any).restrisiko || "").trim(),
      weitereMassnahmen: String((risk as any).weitereMassnahmen || "").trim(),
      verantwortlicher: String((risk as any).verantwortlicher || "").trim(),
      status: String((risk as any).status || "offen").trim() || "offen",
    };

    if (!normalized.titel) {
      throw new Error(`DSFA-Risiko ${index + 1} benötigt einen Titel.`);
    }

    return normalized;
  });
}

function sanitizeDsfaPayload(payload: Record<string, unknown>) {
  if (!("risiken" in payload)) return payload;
  return {
    ...payload,
    risiken: JSON.stringify(normalizeDsfaRisks(payload.risiken)),
  };
}

function normalizeAuditPdcaIds(raw: unknown): string {
  const input = typeof raw === "string"
    ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      })()
    : raw;

  if (!Array.isArray(input)) return "[]";
  const normalized = Array.from(new Set(input.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)));
  return JSON.stringify(normalized);
}

function sanitizeAuditPayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    verknuepftePdcaIds: normalizeAuditPdcaIds(payload.verknuepftePdcaIds),
  };
}

function sanitizePdcaPayload(payload: Record<string, unknown>) {
  const rawAuditId = payload.verknuepftesAuditId;
  const normalizedAuditId = rawAuditId === null || rawAuditId === undefined || rawAuditId === "" || rawAuditId === "none"
    ? null
    : Number(rawAuditId);

  return {
    ...payload,
    verknuepftesAuditId: Number.isInteger(normalizedAuditId) && (normalizedAuditId as number) > 0 ? normalizedAuditId : null,
  };
}

async function syncAuditPdcaLinks(mandantId: number) {
  const [audits, pdcaEntries] = await Promise.all([
    storage.getAuditsByMandant(mandantId),
    storage.getPdcaByMandant(mandantId),
  ]);

  const linkedAuditIds = new Set<number>();

  for (const audit of audits) {
    let pdcaIds: number[] = [];
    try {
      pdcaIds = JSON.parse((audit as any).verknuepftePdcaIds || "[]");
    } catch {
      pdcaIds = [];
    }

    const validPdcaIds = pdcaIds.filter((id) => pdcaEntries.some((entry) => entry.id === id));
    if (JSON.stringify(validPdcaIds) !== JSON.stringify(pdcaIds)) {
      await storage.updateAudit(audit.id, { verknuepftePdcaIds: JSON.stringify(validPdcaIds) } as any);
    }

    for (const pdcaId of validPdcaIds) {
      const entry = pdcaEntries.find((item) => item.id === pdcaId);
      if (!entry) continue;
      linkedAuditIds.add(audit.id);
      if ((entry as any).verknuepftesAuditId !== audit.id) {
        await storage.updatePdca(entry.id, { verknuepftesAuditId: audit.id } as any);
      }
    }
  }

  for (const entry of pdcaEntries) {
    const auditId = (entry as any).verknuepftesAuditId;
    if (!auditId) continue;
    const audit = audits.find((item) => item.id === auditId);
    if (!audit) {
      await storage.updatePdca(entry.id, { verknuepftesAuditId: null } as any);
      continue;
    }
    let auditLinks: number[] = [];
    try {
      auditLinks = JSON.parse((audit as any).verknuepftePdcaIds || "[]");
    } catch {
      auditLinks = [];
    }
    if (!auditLinks.includes(entry.id)) {
      auditLinks.push(entry.id);
      await storage.updateAudit(audit.id, { verknuepftePdcaIds: JSON.stringify(Array.from(new Set(auditLinks))) } as any);
    }
  }
}

async function getAllowedMandantIds(req: any): Promise<number[]> {
  if (req.userRole === "admin") {
    const all = await storage.getMandanten();
    return all.map((m) => m.id);
  }
  const user = await storage.getUserById(req.userId);
  try {
    return JSON.parse(user?.mandantIds || "[]");
  } catch {
    return [];
  }
}

async function canAccessMandant(req: any, mandantId: number): Promise<boolean> {
  if (req.userRole === "admin") return true;
  const ids = await getAllowedMandantIds(req);
  return ids.includes(mandantId);
}

async function getAccessibleGruppenIds(req: any): Promise<number[]> {
  if (req.userRole === "admin") {
    const gruppen = await storage.getMandantenGruppen();
    return gruppen.map((gruppe) => gruppe.id);
  }

  const mandanten = await storage.getMandanten();
  const allowedMandantIds = await getAllowedMandantIds(req);
  return Array.from(new Set(
    mandanten
      .filter((mandant) => allowedMandantIds.includes(mandant.id) && Number.isInteger(mandant.gruppeId) && (mandant.gruppeId as number) > 0)
      .map((mandant) => mandant.gruppeId as number),
  ));
}

async function canAccessGruppe(req: any, gruppenId: number): Promise<boolean> {
  if (req.userRole === "admin") return true;
  const ids = await getAccessibleGruppenIds(req);
  return ids.includes(gruppenId);
}

async function requireMandantAccess(req: any, res: Response, mandantId: number): Promise<boolean> {
  if (await canAccessMandant(req, mandantId)) return true;
  res.status(403).json({ message: "Kein Zugriff auf diesen Mandanten" });
  return false;
}

async function requireEntityAccess(req: any, res: Response, item: any | undefined): Promise<boolean> {
  if (!item) {
    res.status(404).json({ message: "Nicht gefunden" });
    return false;
  }
  return requireMandantAccess(req, res, item.mandantId);
}

const TEMP_LOGIN_LOCK_AFTER = 5;
const TEMP_LOGIN_LOCK_MS = 15 * 60 * 1000;
const ADMIN_LOCK_AFTER = 15;

function getLoginLockState(user: any) {
  const now = Date.now();
  const tempUntil = user?.temporaryLockUntil ? new Date(user.temporaryLockUntil).getTime() : 0;
  return {
    isTempLocked: tempUntil > now,
    retryAfterSeconds: tempUntil > now ? Math.ceil((tempUntil - now) / 1000) : 0,
    isAdminLocked: !!user?.adminLocked,
  };
}

function sanitizeUser(user: any) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function pickAllowedUserUpdateFields(body: Record<string, unknown>) {
  const allowed: Record<string, unknown> = {};
  for (const key of ["name", "email", "password", "role", "mandantIds", "aktiv"]) {
    if (key in body) allowed[key] = body[key];
  }
  return allowed;
}

// Seed initial admin if no users exist
async function seedAdmin() {
  const all = await storage.getAllUsers();
  if (all.length > 0) return;

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME || "Administrator";

  if (!email || !password) {
    console.warn("Kein Initial-Admin erstellt: INITIAL_ADMIN_EMAIL und INITIAL_ADMIN_PASSWORD fehlen.");
    return;
  }

  if (password.length < 12 || /bitte-sicheres-einmalpasswort-setzen/i.test(password)) {
    throw new Error("Unsichere Produktionskonfiguration: INITIAL_ADMIN_PASSWORD ist für das Initial-Seeding zu schwach.");
  }

  await storage.createUser({
    email,
    password,
    name,
    role: "admin",
    mandantIds: "[]",
  });
  console.log(`Initialer Admin-Benutzer erstellt: ${email}`);
}

async function seedVorlagenpakete() {
  try {
    const existing = await storage.getVorlagenpakete();
    if (existing.length > 0) return;

    const { defaultData } = await import("./storage-lowdb.js");
    for (const p of defaultData.vorlagenpakete) {
      await storage.createVorlagenpaket({
        name: p.name,
        beschreibung: p.beschreibung,
        kategorie: p.kategorie,
        version: p.version,
        aktiv: p.aktiv,
        inhaltJson: p.inhaltJson,
      });
    }
    console.log(`Initial-Seeding: ${defaultData.vorlagenpakete.length} Vorlagenpakete erfolgreich in Datenbank geladen.`);
  } catch (error) {
    console.error("Fehler beim Seeding der Vorlagenpakete:", error);
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await seedAdmin();
  await seedVorlagenpakete();

  getJwtSecret();

  // ─── AUTH ────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", loginRateLimit, async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || !user.aktiv) {
      registerLoginFailure(req);
      return res.status(401).json({ message: "E-Mail oder Passwort falsch" });
    }

    const lockState = getLoginLockState(user);
    if (lockState.isAdminLocked) {
      return res.status(423).json({ message: "Benutzer ist administrativ gesperrt. Bitte Administrator kontaktieren." });
    }
    if (lockState.isTempLocked) {
      res.setHeader("Retry-After", String(lockState.retryAfterSeconds));
      return res.status(423).json({ message: "Benutzer ist nach mehreren Fehlversuchen vorübergehend gesperrt. Bitte später erneut versuchen." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      registerLoginFailure(req);
      const failedAttempts = Number(user.failedLoginAttempts || 0) + 1;
      const updates: any = { failedLoginAttempts: failedAttempts, lastFailedLoginAt: new Date().toISOString() };
      let message = "E-Mail oder Passwort falsch";

      if (failedAttempts >= ADMIN_LOCK_AFTER) {
        updates.adminLocked = true;
        updates.adminLockedAt = new Date().toISOString();
        updates.temporaryLockUntil = null;
        message = "Benutzer ist gesperrt und muss durch einen Administrator freigeschaltet werden.";
      } else if (failedAttempts >= TEMP_LOGIN_LOCK_AFTER) {
        updates.temporaryLockUntil = new Date(Date.now() + TEMP_LOGIN_LOCK_MS).toISOString();
        message = "Zu viele Fehlversuche. Benutzer wurde vorübergehend gesperrt.";
      }

      await storage.updateUser(user.id, updates);
      await auditLog({
        mandantId: null,
        userId: user.id,
        userName: user.name,
        aktion: "login_fehlgeschlagen",
        modul: "auth",
        entitaetTyp: "user",
        entitaetId: user.id,
        beschreibung: "Fehlgeschlagener Login-Versuch",
        details: { email, failedAttempts },
      });
      return res.status(failedAttempts >= TEMP_LOGIN_LOCK_AFTER ? 423 : 401).json({ message });
    }
    clearLoginFailures(req);
    if (user.failedLoginAttempts || user.temporaryLockUntil || user.lastFailedLoginAt) {
      await storage.updateUser(user.id, {
        failedLoginAttempts: 0,
        temporaryLockUntil: null,
        lastFailedLoginAt: null,
      } as any);
    }
    const refreshedUser = await storage.getUserById(user.id);
    const safeUser = sanitizeUser(refreshedUser || user);
    const authPayload = attachCsrfToken(safeUser);
    const token = jwt.sign({ userId: user.id, role: user.role, csrfToken: authPayload.csrfToken }, getJwtSecret(), { expiresIn: "8h" });
    setAuthCookie(req, res, token);
    setCsrfCookie(req, res, authPayload.csrfToken);
    await auditLog({
      mandantId: null,
      userId: user.id,
      userName: user.name,
      aktion: "login_erfolgreich",
      modul: "auth",
      entitaetTyp: "user",
      entitaetId: user.id,
      beschreibung: "Erfolgreicher Login",
      details: { email, role: user.role },
    });
    res.json({ user: authPayload.user });
  });

  app.post("/api/auth/logout", authMiddleware, csrfProtection, async (_req, res) => {
    clearAuthCookie(_req, res);
    clearCsrfCookie(_req, res);
    res.json({ ok: true });
  });

  app.get("/api/auth/me", authMiddleware, async (req: any, res) => {
    const user = await storage.getUserById(req.userId);
    if (!user) return res.status(404).json({ message: "Benutzer nicht gefunden" });
    const authPayload = attachCsrfToken(sanitizeUser(user));
    setCsrfCookie(req, res, authPayload.csrfToken);
    res.json(authPayload.user);
  });


  // ─── META APIs ───────────────────────────────────────────────────────────
  app.get("/api/meta/loeschfristen", authMiddleware, async (_req, res) => {
    res.json(metaLoeschfristen);
  });

  app.get("/api/meta/branchen", authMiddleware, async (_req, res) => {
    res.json(metaBranchen);
  });

  app.get("/api/meta/vvt-loeschmapping", authMiddleware, async (_req, res) => {
    res.json(metaVvtLoeschmapping);
  });

  app.get("/api/meta/beschaeftigten-datenschutz", authMiddleware, async (_req, res) => {
    res.json(metaBeschaeftigtenDatenschutz);
  });

  app.post("/api/mandanten/:mid/loeschkonzept/import-vvt/:vvtId", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const vvtId = Number(req.params.vvtId);
    const vvt = await storage.getVvt(vvtId);
    if (!vvt || vvt.mandantId !== mandantId) return res.status(404).json({ message: "VVT nicht gefunden" });
    const mapping = metaVvtLoeschmapping.find((entry) => new RegExp(entry.pattern, "i").test(vvt.bezeichnung || ""));
    const frist = metaLoeschfristen.find((f) => f.key === mapping?.fristKategorie);
    const draft = {
      bezeichnung: vvt.bezeichnung,
      datenart: vvt.datenkategorien || "",
      loeschklasse: vvt.loeschklasse || mapping?.loeschklasse || "LK2",
      fristKategorie: mapping?.fristKategorie || "frei",
      gesetzlicheFrist: mapping?.gesetzlicheFrist || "",
      quelleVvtId: vvt.id,
      quelleVvtBezeichnung: vvt.bezeichnung,
      aufbewahrungsfrist: vvt.loeschfrist || frist?.frist || "",
      loeschereignis: vvt.aufbewahrungsgrund || "",
      rechtsgrundlage: vvt.rechtsgrundlage || "",
      systeme: "",
      verantwortlicher: vvt.verantwortlicher || "",
      loeschverantwortlicher: vvt.verantwortlicher || "",
      kontrolle: "",
      nachweis: "",
      status: "entwurf",
    };
    res.json(draft);
  });

  app.get("/api/mandanten/:mid/loeschkonzept", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    res.json(await storage.getLoeschkonzeptByMandant(mandantId));
  });

  app.post("/api/mandanten/:mid/loeschkonzept", authMiddleware, validateBody(requestLoeschkonzeptSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createLoeschkonzept({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: "loeschkonzept_erstellt",
      modul: "loeschkonzept",
      entitaetTyp: "loeschkonzept",
      entitaetId: item.id,
      beschreibung: "Löschkonzept-Eintrag wurde angelegt.",
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.put("/api/loeschkonzept/:id", authMiddleware, validateBody(requestLoeschkonzeptSchema.partial()), async (req: any, res) => {
    const existing = await storage.getLoeschkonzept(Number(req.params.id));
    if (!(await requireEntityAccess(req, res, existing))) return;
    const updated = await storage.updateLoeschkonzept(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Nicht gefunden" });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId: updated.mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: "loeschkonzept_aktualisiert",
      modul: "loeschkonzept",
      entitaetTyp: "loeschkonzept",
      entitaetId: updated.id,
      beschreibung: "Löschkonzept-Eintrag wurde aktualisiert.",
      detailsJson: JSON.stringify({ before: existing, after: updated, changes: diffObjects(existing as any, updated as any) }),
    });
    res.json(updated);
  });

  app.delete("/api/loeschkonzept/:id", authMiddleware, async (req: any, res) => {
    const existing = await storage.getLoeschkonzept(Number(req.params.id));
    if (!(await requireEntityAccess(req, res, existing))) return;
    await storage.deleteLoeschkonzept(Number(req.params.id));
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId: existing!.mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: "loeschkonzept_geloescht",
      modul: "loeschkonzept",
      entitaetTyp: "loeschkonzept",
      entitaetId: existing!.id,
      beschreibung: "Löschkonzept-Eintrag wurde gelöscht.",
      detailsJson: JSON.stringify(existing),
    });
    res.json({ ok: true });
  });

  app.get("/api/mandanten/:mid/export-context", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const [mandant, logs, stats, vvt, avv, dsfa, datenpannen, dsr, tom, audits, pdca, loeschkonzept, aufgaben, dokumente, interneNotizen] = await Promise.all([
      storage.getMandant(mandantId),
      storage.getMandantenLogs(mandantId),
      storage.getStatsForMandant(mandantId),
      storage.getVvtByMandant(mandantId),
      storage.getAvvByMandant(mandantId),
      storage.getDsfaByMandant(mandantId),
      storage.getDatenpannenByMandant(mandantId),
      storage.getDsrByMandant(mandantId),
      storage.getTomByMandant(mandantId),
      storage.getAuditsByMandant(mandantId),
      storage.getPdcaByMandant(mandantId),
      storage.getLoeschkonzeptByMandant(mandantId),
      storage.getAufgabenByMandant(mandantId),
      storage.getDokumenteByMandant(mandantId),
      storage.getInterneNotizenByMandant(mandantId),
    ]);
    res.json({ mandant, logs, stats, modules: { vvt, avv, dsfa, datenpannen, dsr, tom, audits, pdca, loeschkonzept, aufgaben, dokumente, interne_notizen: interneNotizen } });
  });

  // ─── AES-256-GCM Verschlüsselungs-Helfer ──────────────────────────────────────
  function encryptData(dataStr: string, password?: string): any {
    if (!password) {
      return { encrypted: false, data: JSON.parse(dataStr) };
    }
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    let ciphertext = cipher.update(dataStr, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
      encrypted: true,
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      ciphertext
    };
  }

  function decryptData(payload: any, password?: string): string {
    if (!payload.encrypted) {
      return typeof payload.data === "string" ? payload.data : JSON.stringify(payload.data);
    }
    if (!password) {
      throw new Error("Entschlüsselungspasswort erforderlich");
    }
    const salt = Buffer.from(payload.salt, "hex");
    const iv = Buffer.from(payload.iv, "hex");
    const authTag = Buffer.from(payload.authTag, "hex");
    const ciphertext = payload.ciphertext;

    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // POST /api/mandanten/:mid/export-download
  app.post("/api/mandanten/:mid/export-download", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;

    const { modules = [], password } = req.body;
    
    try {
      const [
        mandant,
        vvt,
        avv,
        dsfa,
        datenpannen,
        dsr,
        tom,
        audits,
        pdca,
        loeschkonzept,
        aufgaben,
        dokumente,
        interneNotizen
      ] = await Promise.all([
        storage.getMandant(mandantId),
        modules.includes("vvt") ? storage.getVvtByMandant(mandantId) : Promise.resolve(null),
        modules.includes("avv") ? storage.getAvvByMandant(mandantId) : Promise.resolve(null),
        modules.includes("dsfa") ? storage.getDsfaByMandant(mandantId) : Promise.resolve(null),
        modules.includes("datenpannen") ? storage.getDatenpannenByMandant(mandantId) : Promise.resolve(null),
        modules.includes("dsr") ? storage.getDsrByMandant(mandantId) : Promise.resolve(null),
        modules.includes("tom") ? storage.getTomByMandant(mandantId) : Promise.resolve(null),
        modules.includes("audits") ? storage.getAuditsByMandant(mandantId) : Promise.resolve(null),
        modules.includes("pdca") ? storage.getPdcaByMandant(mandantId) : Promise.resolve(null),
        modules.includes("loeschkonzept") ? storage.getLoeschkonzeptByMandant(mandantId) : Promise.resolve(null),
        modules.includes("aufgaben") ? storage.getAufgabenByMandant(mandantId) : Promise.resolve(null),
        modules.includes("dokumente") ? storage.getDokumenteByMandant(mandantId) : Promise.resolve(null),
        modules.includes("interne_notizen") ? storage.getInterneNotizenByMandant(mandantId) : Promise.resolve(null),
      ]);

      const pkgPath = path.resolve("package.json");
      let appVer = "1.24.4";
      try {
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
          appVer = pkg.version || appVer;
        }
      } catch (e) {}

      const exportData: any = {
        meta: {
          version: "1.0",
          appVersion: appVer,
          exportedAt: new Date().toISOString(),
          mandantName: mandant?.name || `Mandant ${mandantId}`,
          modules,
          encrypted: !!password
        },
        data: {}
      };

      if (modules.includes("mandant")) {
        exportData.data.mandant = mandant;
      }
      if (vvt) exportData.data.vvt = vvt;
      if (avv) exportData.data.avv = avv;
      if (dsfa) exportData.data.dsfa = dsfa;
      if (datenpannen) exportData.data.datenpannen = datenpannen;
      if (dsr) exportData.data.dsr = dsr;
      if (tom) exportData.data.tom = tom;
      if (audits) exportData.data.audits = audits;
      if (pdca) exportData.data.pdca = pdca;
      if (loeschkonzept) exportData.data.loeschkonzept = loeschkonzept;
      if (aufgaben) exportData.data.aufgaben = aufgaben;
      if (dokumente) exportData.data.dokumente = dokumente;
      if (interneNotizen) exportData.data.interne_notizen = interneNotizen;

      const payload = encryptData(JSON.stringify(exportData), password);

      const sanitizedName = (mandant?.name || "export").replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
      const dateStr = new Date().toISOString().split("T")[0];
      
      res.setHeader("Content-Disposition", `attachment; filename="${sanitizedName}_${dateStr}.privashield"`);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(payload));
    } catch (error: any) {
      res.status(500).json({ message: `Export fehlgeschlagen: ${error?.message || error}` });
    }
  });

  // POST /api/mandanten/:mid/import
  app.post("/api/mandanten/:mid/import", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;

    const { fileContent, password, strategy = "hinzufuegen" } = req.body;

    if (!fileContent) {
      return res.status(400).json({ message: "Kein Datei-Inhalt übergeben" });
    }

    try {
      let rawPayload: any;
      try {
        rawPayload = JSON.parse(fileContent);
      } catch (e) {
        return res.status(400).json({ message: "Ungültiges Dateiformat. Keine korrekte JSON-Datei." });
      }

      if (rawPayload.encrypted && !password) {
        return res.status(400).json({ message: "password_required" });
      }

      let decryptedStr: string;
      try {
        decryptedStr = decryptData(rawPayload, password);
      } catch (e: any) {
        return res.status(400).json({ message: "Falsches Passwort oder beschädigte Datei." });
      }

      let importObj: any;
      try {
        importObj = JSON.parse(decryptedStr);
      } catch (e) {
        return res.status(400).json({ message: "Entschlüsselter Inhalt ist kein gültiges JSON." });
      }

      const meta = importObj.meta || {};
      const data = importObj.data || {};
      const modules = meta.modules || [];

      if (!Array.isArray(modules)) {
        return res.status(400).json({ message: "Ungültige Metadaten: Module fehlen." });
      }

      const tomIdMap = new Map<number, number>();
      const avvIdMap = new Map<number, number>();
      const vvtIdMap = new Map<number, number>();
      const auditIdMap = new Map<number, { dbId: number; origPdcaIds: any }>();
      const pdcaIdMap = new Map<number, number>();

      const importedStats: Record<string, number> = {};

      // 1. Mandant-Stammdaten
      if (modules.includes("mandant") && data.mandant) {
        const { id, name, createdAt, logo, ...mandantFields } = data.mandant;
        await storage.updateMandant(mandantId, mandantFields);
        importedStats["mandant"] = 1;
      }

      // 2. TOM
      if (modules.includes("tom") && Array.isArray(data.tom)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getTomByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteTom(item.id);
          }
        }
        importedStats["tom"] = 0;
        for (const item of data.tom) {
          const oldId = item.id;
          const { id, createdAt, updatedAt, mandantId: _mid, ...fields } = item;
          const created = await storage.createTom({ ...fields, mandantId });
          tomIdMap.set(oldId, created.id);
          importedStats["tom"]++;
        }
      }

      // 3. AVV
      if (modules.includes("avv") && Array.isArray(data.avv)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getAvvByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteAvv(item.id);
          }
        }
        importedStats["avv"] = 0;
        for (const item of data.avv) {
          const oldId = item.id;
          const { id, createdAt, updatedAt, mandantId: _mid, ...fields } = item;
          const created = await storage.createAvv({ ...fields, mandantId });
          avvIdMap.set(oldId, created.id);
          importedStats["avv"]++;
        }
      }

      // 4. VVT
      if (modules.includes("vvt") && Array.isArray(data.vvt)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getVvtByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteVvt(item.id);
          }
        }
        importedStats["vvt"] = 0;
        for (const item of data.vvt) {
          const oldId = item.id;
          const { id, createdAt, updatedAt, mandantId: _mid, verknuepfte_tom_ids, verknuepfteTomIds, ...fields } = item;
          
          let tomIdsArr: any[] = [];
          try {
            const tomIdsVal = verknuepfteTomIds || verknuepfte_tom_ids || "[]";
            const parsed = typeof tomIdsVal === "string" ? JSON.parse(tomIdsVal) : tomIdsVal;
            if (Array.isArray(parsed)) {
              tomIdsArr = parsed.map(tid => tomIdMap.get(Number(tid)) || tid);
            }
          } catch (e) {}

          const created = await storage.createVvt({
            ...fields,
            mandantId,
            verknuepfteTomIds: JSON.stringify(tomIdsArr)
          });
          vvtIdMap.set(oldId, created.id);
          importedStats["vvt"]++;
        }
      }

      // 5. DSFA
      if (modules.includes("dsfa") && Array.isArray(data.dsfa)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getDsfaByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteDsfa(item.id);
          }
        }
        importedStats["dsfa"] = 0;
        for (const item of data.dsfa) {
          const { id, createdAt, updatedAt, mandantId: _mid, vvtId, ...fields } = item;
          const mappedVvtId = vvtId ? (vvtIdMap.get(Number(vvtId)) || vvtId) : null;
          await storage.createDsfa({
            ...fields,
            vvtId: mappedVvtId,
            mandantId
          });
          importedStats["dsfa"]++;
        }
      }

      // 6. Datenpannen
      if (modules.includes("datenpannen") && Array.isArray(data.datenpannen)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getDatenpannenByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteDatenpanne(item.id);
          }
        }
        importedStats["datenpannen"] = 0;
        for (const item of data.datenpannen) {
          const { id, createdAt, updatedAt, mandantId: _mid, ...fields } = item;
          await storage.createDatenpanne({ ...fields, mandantId });
          importedStats["datenpannen"]++;
        }
      }

      // 7. DSR
      if (modules.includes("dsr") && Array.isArray(data.dsr)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getDsrByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteDsr(item.id);
          }
        }
        importedStats["dsr"] = 0;
        for (const item of data.dsr) {
          const { id, createdAt, updatedAt, mandantId: _mid, ...fields } = item;
          await storage.createDsr({ ...fields, mandantId });
          importedStats["dsr"]++;
        }
      }

      // 8. Audits
      if (modules.includes("audits") && Array.isArray(data.audits)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getAuditsByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteAudit(item.id);
          }
        }
        importedStats["audits"] = 0;
        for (const item of data.audits) {
          const oldId = item.id;
          const { id, createdAt, updatedAt, mandantId: _mid, verknuepftePdcaIds, ...fields } = item;
          const created = await storage.createAudit({
            ...fields,
            verknuepftePdcaIds: "[]",
            mandantId
          });
          auditIdMap.set(oldId, { dbId: created.id, origPdcaIds: verknuepftePdcaIds });
          importedStats["audits"]++;
        }
      }

      // 9. PDCA
      if (modules.includes("pdca") && Array.isArray(data.pdca)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getPdcaByMandant(mandantId);
          for (const item of existing) {
            await storage.deletePdca(item.id);
          }
        }
        importedStats["pdca"] = 0;
        for (const item of data.pdca) {
          const oldId = item.id;
          const { id, createdAt, updatedAt, mandantId: _mid, verknuepftesAuditId, ...fields } = item;
          const mappedAuditId = verknuepftesAuditId ? (auditIdMap.has(Number(verknuepftesAuditId)) ? auditIdMap.get(Number(verknuepftesAuditId)).dbId : verknuepftesAuditId) : null;
          const created = await storage.createPdca({
            ...fields,
            verknuepftesAuditId: mappedAuditId,
            mandantId
          });
          pdcaIdMap.set(oldId, created.id);
          importedStats["pdca"]++;
        }

        // Update Audits' verknuepftePdcaIds
        for (const [oldAuditId, info] of auditIdMap.entries()) {
          try {
            const parsed = typeof info.origPdcaIds === "string" ? JSON.parse(info.origPdcaIds) : info.origPdcaIds;
            if (Array.isArray(parsed)) {
              const mappedPdcaIds = parsed.map(pid => pdcaIdMap.get(Number(pid)) || pid);
              await storage.updateAudit(info.dbId, { verknuepftePdcaIds: JSON.stringify(mappedPdcaIds) });
            }
          } catch (e) {}
        }
      }

      // 10. Löschkonzept
      if (modules.includes("loeschkonzept") && Array.isArray(data.loeschkonzept)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getLoeschkonzeptByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteLoeschkonzept(item.id);
          }
        }
        importedStats["loeschkonzept"] = 0;
        for (const item of data.loeschkonzept) {
          const { id, createdAt, updatedAt, mandantId: _mid, quelleVvtId, ...fields } = item;
          const mappedVvtId = quelleVvtId ? (vvtIdMap.get(Number(quelleVvtId)) || quelleVvtId) : null;
          await storage.createLoeschkonzept({
            ...fields,
            quelleVvtId: mappedVvtId,
            mandantId
          });
          importedStats["loeschkonzept"]++;
        }
      }

      // 11. Aufgaben
      if (modules.includes("aufgaben") && Array.isArray(data.aufgaben)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getAufgabenByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteAufgabe(item.id);
          }
        }
        importedStats["aufgaben"] = 0;
        for (const item of data.aufgaben) {
          const { id, createdAt, updatedAt, mandantId: _mid, referenzId, kategorie: taskKategorie, ...fields } = item;
          let mappedReferenzId = referenzId;
          if (referenzId) {
            if (taskKategorie === "pdca") {
              mappedReferenzId = pdcaIdMap.get(Number(referenzId)) || referenzId;
            } else if (taskKategorie === "audit") {
              mappedReferenzId = auditIdMap.has(Number(referenzId)) ? auditIdMap.get(Number(referenzId)).dbId : referenzId;
            } else if (taskKategorie === "vvt") {
              mappedReferenzId = vvtIdMap.get(Number(referenzId)) || referenzId;
            }
          }
          await storage.createAufgabe({
            ...fields,
            kategorie: taskKategorie,
            referenzId: mappedReferenzId,
            mandantId
          });
          importedStats["aufgaben"]++;
        }
      }

      // 12. Dokumente
      if (modules.includes("dokumente") && Array.isArray(data.dokumente)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getDokumenteByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteDokument(item.id);
          }
        }
        importedStats["dokumente"] = 0;
        for (const item of data.dokumente) {
          const { id, createdAt, updatedAt, mandantId: _mid, ...fields } = item;
          await storage.createDokument({ ...fields, mandantId });
          importedStats["dokumente"]++;
        }
      }

      // 13. Interne Notizen
      if (modules.includes("interne_notizen") && Array.isArray(data.interne_notizen)) {
        if (strategy === "ersetzen") {
          const existing = await storage.getInterneNotizenByMandant(mandantId);
          for (const item of existing) {
            await storage.deleteInterneNotiz(item.id);
          }
        }
        importedStats["interne_notizen"] = 0;
        for (const item of data.interne_notizen) {
          const { id, createdAt, updatedAt, mandantId: _mid, ...fields } = item;
          await storage.createInterneNotiz({ ...fields, mandantId });
          importedStats["interne_notizen"]++;
        }
      }

      const user = await storage.getUserById(req.userId);
      await storage.createMandantenLog({
        mandantId,
        userId: req.userId,
        userName: user?.name,
        aktion: `import_erfolgt`,
        modul: "system",
        entitaetTyp: "mandant",
        entitaetId: mandantId,
        beschreibung: `Import von Mandantendaten durchgeführt (${strategy === "ersetzen" ? "Ersetzen" : "Hinzufügen"}).`,
        detailsJson: JSON.stringify({ importedStats, strategy }),
      });

      res.json({ ok: true, importedStats });
    } catch (err: any) {
      res.status(500).json({ message: `Import fehlgeschlagen: ${err?.message || err}` });
    }
  });

  // ─── BENUTZER (Admin only) ────────────────────────────────────────────────
  app.get("/api/users", authMiddleware, adminOnly, async (_req, res) => {
    const all = await storage.getAllUsers();
    res.json(all.map((u) => sanitizeUser(u)));
  });
  app.post("/api/users", authMiddleware, adminOnly, validateBody(insertUserSchema), async (req, res) => {
    try {
      const existing = await storage.getUserByEmail(req.body.email);
      if (existing) return res.status(400).json({ message: "Benutzer existiert bereits" });

      const user = await storage.createUser(req.body);
      await auditLog({
        mandantId: 0,
        userId: (req as any).userId,
        aktion: "user_erstellt",
        modul: "admin",
        entitaetTyp: "user",
        entitaetId: user.id,
        beschreibung: `Benutzer ${user.name} (${user.email}) wurde erstellt`,
        details: { email: user.email, role: user.role, mandantIds: user.mandantIds },
      });

      res.status(201).json(sanitizeUser(user));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  const updateUserSchema = insertUserSchema.partial().extend({
    unlockUser: z.boolean().optional(),
  });

  app.put("/api/users/:id", authMiddleware, adminOnly, validateBody(updateUserSchema), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const oldUser = await storage.getUserById(userId);
      if (!oldUser) return res.status(404).json({ message: "Nicht gefunden" });

      if (req.body.email) {
        const existing = await storage.getUserByEmail(req.body.email);
        if (existing && existing.id !== userId) {
          return res.status(400).json({ message: "E-Mail-Adresse bereits vergeben" });
        }
      }

      const body = pickAllowedUserUpdateFields(req.body || {});

      if (req.body?.unlockUser === true) {
        Object.assign(body, {
          adminLocked: false,
          adminLockedAt: null,
          failedLoginAttempts: 0,
          temporaryLockUntil: null,
          lastFailedLoginAt: null,
        });
      }

      const user = await storage.updateUser(userId, body as any);
      if (!user) return res.status(404).json({ message: "Nicht gefunden" });

      const diff = diffObjects(sanitizeUser(oldUser), sanitizeUser(user));
      await auditLog({
        mandantId: 0,
        userId: (req as any).userId,
        aktion: "user_aktualisiert",
        modul: "admin",
        entitaetTyp: "user",
        entitaetId: user.id,
        beschreibung: `Benutzer ${user.name} (${user.email}) wurde aktualisiert`,
        details: { changes: diff, unlockUser: req.body?.unlockUser === true },
      });

      res.json(sanitizeUser(user));
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/users/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const oldUser = await storage.getUserById(userId);
      if (oldUser) {
        await storage.deleteUser(userId);
        await auditLog({
          mandantId: 0,
          userId: (req as any).userId,
          aktion: "user_geloescht",
          modul: "admin",
          entitaetTyp: "user",
          entitaetId: oldUser.id,
          beschreibung: `Benutzer ${oldUser.name} (${oldUser.email}) wurde gelöscht`,
          details: { email: oldUser.email, role: oldUser.role },
        });
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // ─── MANDANTEN ────────────────────────────────────────────────────────────
  app.get("/api/mandanten", authMiddleware, async (req: any, res) => {
    const all = await storage.getMandanten();
    if (req.userRole === "admin") return res.json(all);
    const user = await storage.getUserById(req.userId);
    const ids: number[] = JSON.parse(user?.mandantIds || "[]");
    res.json(all.filter((m) => ids.includes(m.id)));
  });
  app.get("/api/mandanten/:id", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    const m = await storage.getMandant(mandantId);
    if (!m) return res.status(404).json({ message: "Nicht gefunden" });
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    res.json(m);
  });
  app.post("/api/mandanten", authMiddleware, adminOnly, validateBody(insertMandantSchema), async (req: any, res) => {
    try {
      const m = await storage.createMandant(req.body);
      await auditLog({
        mandantId: m.id,
        userId: req.userId,
        aktion: "mandant_erstellt",
        modul: "admin",
        entitaetTyp: "mandant",
        entitaetId: m.id,
        beschreibung: `Mandant ${m.name} wurde erstellt`,
        details: m,
      });
      res.status(201).json(m);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.put("/api/mandanten/:id", authMiddleware, adminOnly, validateBody(insertMandantSchema.partial()), async (req: any, res) => {
    try {
      const mandantId = Number(req.params.id);
      const oldMandant = await storage.getMandant(mandantId);
      if (!oldMandant) return res.status(404).json({ message: "Nicht gefunden" });

      const m = await storage.updateMandant(mandantId, req.body);
      if (!m) return res.status(404).json({ message: "Nicht gefunden" });

      const diff = diffObjects(oldMandant, m);
      await auditLog({
        mandantId: m.id,
        userId: req.userId,
        aktion: "mandant_aktualisiert",
        modul: "admin",
        entitaetTyp: "mandant",
        entitaetId: m.id,
        beschreibung: `Mandant ${m.name} wurde aktualisiert`,
        details: { changes: diff },
      });
      res.json(m);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/mandanten/:id", authMiddleware, adminOnly, async (req: any, res) => {
    try {
      const mandantId = Number(req.params.id);
      const oldMandant = await storage.getMandant(mandantId);
      if (oldMandant) {
        await storage.deleteMandant(mandantId);
        await auditLog({
          mandantId: 0,
          userId: req.userId,
          aktion: "mandant_geloescht",
          modul: "admin",
          entitaetTyp: "mandant",
          entitaetId: mandantId,
          beschreibung: `Mandant ${oldMandant.name} wurde gelöscht`,
          details: oldMandant,
        });
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/mandanten/:id/logs", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const logs = await storage.getMandantenLogs(mandantId);
    res.json(logs);
  });

  app.get("/api/mandanten/:id/vorlagen-historie", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const historie = await storage.getVorlagenpaketHistorie(mandantId);
    res.json(historie);
  });

  app.get("/api/mandanten-gruppen", authMiddleware, async (req: any, res) => {
    const gruppen = await storage.getMandantenGruppen();
    if (req.userRole === "admin") return res.json(gruppen);
    const allowedGruppenIds = await getAccessibleGruppenIds(req);
    res.json(gruppen.filter((gruppe) => allowedGruppenIds.includes(gruppe.id)));
  });
  app.post("/api/mandanten-gruppen", authMiddleware, adminOnly, validateBody(insertMandantenGruppeSchema), async (req: any, res) => {
    try {
      const gruppe = await storage.createMandantenGruppe(req.body);
      await auditLog({
        mandantId: 0,
        userId: req.userId,
        aktion: "mandantengruppe_erstellt",
        modul: "mandanten-gruppen",
        entitaetTyp: "mandantengruppe",
        entitaetId: gruppe.id,
        beschreibung: `Mandantengruppe ${gruppe.name} wurde erstellt`,
        details: gruppe,
      });
      res.status(201).json(gruppe);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.put("/api/mandanten-gruppen/:id", authMiddleware, adminOnly, validateBody(insertMandantenGruppeSchema.partial()), async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const oldGruppe = await storage.getMandantenGruppe(id);
      if (!oldGruppe) return res.status(404).json({ message: "Nicht gefunden" });

      const gruppe = await storage.updateMandantenGruppe(id, req.body);
      if (!gruppe) return res.status(404).json({ message: "Nicht gefunden" });

      const diff = diffObjects(oldGruppe, gruppe);
      await auditLog({
        mandantId: 0,
        userId: req.userId,
        aktion: "mandantengruppe_aktualisiert",
        modul: "mandanten-gruppen",
        entitaetTyp: "mandantengruppe",
        entitaetId: gruppe.id,
        beschreibung: `Mandantengruppe ${gruppe.name} wurde aktualisiert`,
        details: { changes: diff },
      });
      res.json(gruppe);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/mandanten-gruppen/:id", authMiddleware, adminOnly, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const oldGruppe = await storage.getMandantenGruppe(id);
      if (oldGruppe) {
        await storage.deleteMandantenGruppe(id);
        await auditLog({
          mandantId: 0,
          userId: req.userId,
          aktion: "mandantengruppe_geloescht",
          modul: "mandanten-gruppen",
          entitaetTyp: "mandantengruppe",
          entitaetId: id,
          beschreibung: `Mandantengruppe ${oldGruppe.name} wurde gelöscht`,
          details: oldGruppe,
        });
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/vorlagenpakete", authMiddleware, async (_req, res) => {
    res.json(await storage.getVorlagenpakete());
  });
  app.post("/api/vorlagenpakete", authMiddleware, adminOnly, validateBody(insertVorlagenpaketSchema), async (req: any, res) => {
    try {
      const paket = await storage.createVorlagenpaket(req.body);
      await auditLog({
        mandantId: 0,
        userId: req.userId,
        aktion: "vorlagenpaket_erstellt",
        modul: "vorlagenpakete",
        entitaetTyp: "vorlagenpaket",
        entitaetId: paket.id,
        beschreibung: `Vorlagenpaket ${paket.name} wurde erstellt`,
        details: paket,
      });
      res.status(201).json(paket);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.put("/api/vorlagenpakete/:id", authMiddleware, adminOnly, validateBody(insertVorlagenpaketSchema.partial()), async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const oldPaket = await storage.getVorlagenpaket(id);
      if (!oldPaket) return res.status(404).json({ message: "Nicht gefunden" });

      const paket = await storage.updateVorlagenpaket(id, req.body);
      if (!paket) return res.status(404).json({ message: "Nicht gefunden" });

      const diff = diffObjects(oldPaket, paket);
      await auditLog({
        mandantId: 0,
        userId: req.userId,
        aktion: "vorlagenpaket_aktualisiert",
        modul: "vorlagenpakete",
        entitaetTyp: "vorlagenpaket",
        entitaetId: paket.id,
        beschreibung: `Vorlagenpaket ${paket.name} wurde aktualisiert`,
        details: { changes: diff },
      });
      res.json(paket);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.delete("/api/vorlagenpakete/:id", authMiddleware, adminOnly, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const oldPaket = await storage.getVorlagenpaket(id);
      if (oldPaket) {
        await storage.deleteVorlagenpaket(id);
        await auditLog({
          mandantId: 0,
          userId: req.userId,
          aktion: "vorlagenpaket_geloescht",
          modul: "vorlagenpakete",
          entitaetTyp: "vorlagenpaket",
          entitaetId: id,
          beschreibung: `Vorlagenpaket ${oldPaket.name} wurde gelöscht`,
          details: oldPaket,
        });
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  app.get("/api/mandanten/:id/vorlagenpakete/:paketId/preflight", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    try {
      const result = await storage.getVorlagenpaketPreflight(mandantId, Number(req.params.paketId));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/mandanten/:id/vorlagenpakete/:paketId/apply", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const strategy = req.body?.strategy;
    const result = await storage.applyVorlagenpaketToMandant(
      mandantId,
      Number(req.params.paketId),
      {
        id: req.userId,
        name: (await storage.getUserById(req.userId))?.name,
      },
      strategy
    );
    res.json(result);
  });


  app.post("/api/gruppen/:gruppenId/vorlagenpakete/:paketId/apply", authMiddleware, adminOnly, async (req: any, res) => {
    const gruppenId = Number(req.params.gruppenId);
    if (!(await canAccessGruppe(req, gruppenId))) return res.status(403).json({ message: "Kein Zugriff auf diese Gruppe" });
    const gruppe = await storage.getMandantenGruppe(gruppenId);
    if (!gruppe) return res.status(404).json({ message: "Gruppe nicht gefunden" });
    const paketId = Number(req.params.paketId);
    const mandanten = await storage.getMandanten();
    const targets = mandanten.filter((m) => m.gruppeId === gruppenId);
    const user = await storage.getUserById(req.userId);
    const results = [];
    for (const m of targets) {
      results.push({ mandantId: m.id, mandantName: m.name, ...(await storage.applyVorlagenpaketToMandant(m.id, paketId, { id: req.userId, name: user?.name })) });
    }
    res.json({ ok: true, count: results.length, results });
  });

  app.post("/api/mandanten/:mid/vvt", authMiddleware, validateBody(requestVvtSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createVvt({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `vvt_erstellt`,
      modul: "vvt",
      entitaetTyp: "vvt",
      entitaetId: item.id,
      beschreibung: `vvt wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/avv", authMiddleware, validateBody(requestAvvSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createAvv({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `avv_erstellt`,
      modul: "avv",
      entitaetTyp: "avv",
      entitaetId: item.id,
      beschreibung: `avv wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/dsfa", authMiddleware, validateBody(requestDsfaSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    let sanitizedBody: ReturnType<typeof sanitizeDsfaPayload>;
    try {
      sanitizedBody = sanitizeDsfaPayload(req.body);
    } catch (error: any) {
      return res.status(400).json({ message: error?.message || "Ungültige DSFA-Risiken" });
    }
    const item = await storage.createDsfa({ ...(req.body as typeof req.body & { titel: string }), ...sanitizedBody, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `dsfa_erstellt`,
      modul: "dsfa",
      entitaetTyp: "dsfa",
      entitaetId: item.id,
      beschreibung: `dsfa wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/datenpannen", authMiddleware, validateBody(requestDatenpanneSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createDatenpanne({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `datenpanne_erstellt`,
      modul: "datenpannen",
      entitaetTyp: "datenpanne",
      entitaetId: item.id,
      beschreibung: `datenpanne wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/dsr", authMiddleware, validateBody(requestDsrSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createDsr({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `dsr_erstellt`,
      modul: "dsr",
      entitaetTyp: "dsr",
      entitaetId: item.id,
      beschreibung: `dsr wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/tom", authMiddleware, validateBody(requestTomSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createTom({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `tom_erstellt`,
      modul: "tom",
      entitaetTyp: "tom",
      entitaetId: item.id,
      beschreibung: `tom wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/audits", authMiddleware, validateBody(requestAuditSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createAudit({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `audit_erstellt`,
      modul: "audits",
      entitaetTyp: "audit",
      entitaetId: item.id,
      beschreibung: `audit wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  app.post("/api/mandanten/:mid/dokumente", authMiddleware, validateBody(requestDokumentSchema), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const item = await storage.createDokument({ ...req.body, mandantId });
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `dokument_erstellt`,
      modul: "dokumente",
      entitaetTyp: "dokument",
      entitaetId: item.id,
      beschreibung: `dokument wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    res.status(201).json(item);
  });

  // ─── STATS ────────────────────────────────────────────────────────────────
  app.get("/api/mandanten/:mid/interne-notizen", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    res.json(await storage.getInterneNotizenByMandant(mandantId));
  });
  app.post("/api/mandanten/:mid/interne-notizen", authMiddleware, validateBody(requestInterneNotizSchema as ZodTypeAny), async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    res.status(201).json(await storage.createInterneNotiz({ ...req.body, mandantId }));
  });
  app.put("/api/interne-notizen/:id", authMiddleware, async (req: any, res) => {
    const item = await storage.getInterneNotiz(Number(req.params.id));
    if (!(await requireEntityAccess(req, res, item))) return;
    res.json(await storage.updateInterneNotiz(Number(req.params.id), req.body));
  });
  app.delete("/api/interne-notizen/:id", authMiddleware, async (req: any, res) => {
    const item = await storage.getInterneNotiz(Number(req.params.id));
    if (!(await requireEntityAccess(req, res, item))) return;
    await storage.deleteInterneNotiz(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/mandanten/:id/stats", authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.id);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const stats = await storage.getStatsForMandant(mandantId);
    res.json(stats);
  });

  // ─── GENERIC CRUD FACTORY ────────────────────────────────────────────────
  function crudRoutes(
    path: string,
    getAll: (mid: number) => Promise<any[]>,
    getOne: (id: number) => Promise<any>,
    create: (data: any) => Promise<any>,
    update: (id: number, data: any) => Promise<any>,
    remove: (id: number) => Promise<void>,
    updateSchema?: ZodTypeAny,
  ) {
    app.get(`/api/mandanten/:mid/${path}`, authMiddleware, async (req: any, res) => {
      const mandantId = Number(req.params.mid);
      if (!(await requireMandantAccess(req, res, mandantId))) return;
      res.json(await getAll(mandantId));
    });
    app.get(`/api/${path}/:id`, authMiddleware, async (req: any, res) => {
      const item = await getOne(Number(req.params.id));
      if (!(await requireEntityAccess(req, res, item))) return;
      res.json(item);
    });
    app.post(`/api/mandanten/:mid/${path}`, authMiddleware, async (req: any, res) => {
      const mandantId = Number(req.params.mid);
      if (!(await requireMandantAccess(req, res, mandantId))) return;
      const body = path === "audits"
        ? sanitizeAuditPayload(req.body)
        : path === "pdca"
          ? sanitizePdcaPayload(req.body)
          : req.body;
      const item = await create({ ...body, mandantId });
      const user = await storage.getUserById(req.userId);
      await storage.createMandantenLog({
        mandantId,
        userId: req.userId,
        userName: user?.name,
        aktion: `${path}_erstellt`,
        modul: path,
        entitaetTyp: path,
        entitaetId: item.id,
        beschreibung: `${path} wurde angelegt.`,
        detailsJson: JSON.stringify(item),
      });
      if (path === "audits" || path === "pdca") await syncAuditPdcaLinks(mandantId);
      res.status(201).json(item);
    });
    app.put(`/api/${path}/:id`, authMiddleware, async (req: any, res, next) => {
      if (updateSchema) {
        return validateBody(updateSchema)(req, res, async () => {
          const existing = await getOne(Number(req.params.id));
          if (!(await requireEntityAccess(req, res, existing))) return;
          const body = path === "audits"
            ? sanitizeAuditPayload(req.body)
            : path === "pdca"
              ? sanitizePdcaPayload(req.body)
              : req.body;
          const item = await update(Number(req.params.id), body);
          if (!item) return res.status(404).json({ message: "Nicht gefunden" });
          const user = await storage.getUserById(req.userId);
          await storage.createMandantenLog({
            mandantId: item.mandantId,
            userId: req.userId,
            userName: user?.name,
            aktion: `${path}_aktualisiert`,
            modul: path,
            entitaetTyp: path,
            entitaetId: item.id,
            beschreibung: `${path} wurde aktualisiert.`,
            detailsJson: JSON.stringify({ after: item, changes: diffObjects(existing, item) }),
          });
          if (path === "audits" || path === "pdca") await syncAuditPdcaLinks(item.mandantId);
          res.json(item);
        });
      }

      const existing = await getOne(Number(req.params.id));
      if (!(await requireEntityAccess(req, res, existing))) return;
      const body = path === "audits"
        ? sanitizeAuditPayload(req.body)
        : path === "pdca"
          ? sanitizePdcaPayload(req.body)
          : req.body;
      const item = await update(Number(req.params.id), body);
      if (!item) return res.status(404).json({ message: "Nicht gefunden" });
      const user = await storage.getUserById(req.userId);
      await storage.createMandantenLog({
        mandantId: item.mandantId,
        userId: req.userId,
        userName: user?.name,
        aktion: `${path}_aktualisiert`,
        modul: path,
        entitaetTyp: path,
        entitaetId: item.id,
        beschreibung: `${path} wurde aktualisiert.`,
        detailsJson: JSON.stringify({ after: item, changes: diffObjects(existing, item) }),
      });
      if (path === "audits" || path === "pdca") await syncAuditPdcaLinks(item.mandantId);
      res.json(item);
    });
    app.delete(`/api/${path}/:id`, authMiddleware, async (req: any, res) => {
      const existing = await getOne(Number(req.params.id));
      if (!existing) return res.status(404).json({ message: "Nicht gefunden" });
      if (!(await requireEntityAccess(req, res, existing))) return;
      await remove(Number(req.params.id));
      const user = await storage.getUserById(req.userId);
      await storage.createMandantenLog({
        mandantId: existing.mandantId,
        userId: req.userId,
        userName: user?.name,
        aktion: `${path}_geloescht`,
        modul: path,
        entitaetTyp: path,
        entitaetId: existing.id,
        beschreibung: `${path} wurde gelöscht.`,
        detailsJson: JSON.stringify({ before: existing }),
      });
      res.json({ ok: true });
    });
  }

  crudRoutes("vvt", storage.getVvtByMandant.bind(storage), storage.getVvt.bind(storage), storage.createVvt.bind(storage), storage.updateVvt.bind(storage), storage.deleteVvt.bind(storage), insertVvtSchema.partial());
  crudRoutes("avv", storage.getAvvByMandant.bind(storage), storage.getAvv.bind(storage), storage.createAvv.bind(storage), storage.updateAvv.bind(storage), storage.deleteAvv.bind(storage), insertAvvSchema.partial());
  app.get(`/api/mandanten/:mid/dsfa`, authMiddleware, async (req: any, res) => {
    const mandantId = Number(req.params.mid);
    if (!(await requireMandantAccess(req, res, mandantId))) return;
    const rows = await storage.getDsfaByMandant(mandantId);
    res.json(rows.sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))));
  });
  app.get(`/api/dsfa`, authMiddleware, async (req: any, res) => {
    const allMandants = await storage.getMandanten();
    const allowedMandants = await getAllowedMandantIds(req);
    const rows = [] as any[];
    for (const mandant of allMandants) {
      if (req.userRole !== "admin" && !allowedMandants.includes(mandant.id)) continue;
      rows.push(...await storage.getDsfaByMandant(mandant.id));
    }
    res.json(rows.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))));
  });

  app.get(`/api/dsfa/:id`, authMiddleware, async (req: any, res) => {
    const existing = await storage.getDsfa(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Nicht gefunden" });
    if (!(await requireEntityAccess(req, res, existing))) return;
    res.json(existing);
  });

  const handleDsfaUpdate = async (req: any, res: any) => {
    const existing = await storage.getDsfa(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Nicht gefunden" });
    if (!(await requireEntityAccess(req, res, existing))) return;
    let sanitizedBody;
    try {
      sanitizedBody = sanitizeDsfaPayload(req.body);
    } catch (error: any) {
      return res.status(400).json({ message: error?.message || "Ungültige DSFA-Risiken" });
    }
    const updated = await storage.updateDsfa(Number(req.params.id), sanitizedBody);
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId: existing.mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `dsfa_aktualisiert`,
      modul: "dsfa",
      entitaetTyp: "dsfa",
      entitaetId: existing.id,
      beschreibung: `dsfa wurde aktualisiert.`,
      detailsJson: JSON.stringify({ before: existing, after: updated }),
    });
    res.json(updated);
  };

  app.put(`/api/dsfa/:id`, authMiddleware, validateBody(insertDsfaSchema.partial()), handleDsfaUpdate);
  app.patch(`/api/dsfa/:id`, authMiddleware, validateBody(insertDsfaSchema.partial()), handleDsfaUpdate);

  app.delete(`/api/dsfa/:id`, authMiddleware, async (req: any, res) => {
    const existing = await storage.getDsfa(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Nicht gefunden" });
    if (!(await requireEntityAccess(req, res, existing))) return;
    await storage.deleteDsfa(Number(req.params.id));
    const user = await storage.getUserById(req.userId);
    await storage.createMandantenLog({
      mandantId: existing.mandantId,
      userId: req.userId,
      userName: user?.name,
      aktion: `dsfa_geloescht`,
      modul: "dsfa",
      entitaetTyp: "dsfa",
      entitaetId: existing.id,
      beschreibung: `dsfa wurde gelöscht.`,
      detailsJson: JSON.stringify({ before: existing }),
    });
    res.json({ ok: true });
  });

  crudRoutes("datenpannen", storage.getDatenpannenByMandant.bind(storage), storage.getDatenpanne.bind(storage), storage.createDatenpanne.bind(storage), storage.updateDatenpanne.bind(storage), storage.deleteDatenpanne.bind(storage), insertDatenpanneSchema.partial());
  crudRoutes("dsr", storage.getDsrByMandant.bind(storage), storage.getDsr.bind(storage), storage.createDsr.bind(storage), storage.updateDsr.bind(storage), storage.deleteDsr.bind(storage), insertDsrSchema.partial());
  crudRoutes("tom", storage.getTomByMandant.bind(storage), storage.getTom.bind(storage), storage.createTom.bind(storage), storage.updateTom.bind(storage), storage.deleteTom.bind(storage), insertTomSchema.partial());
  crudRoutes("audits", storage.getAuditsByMandant.bind(storage), storage.getAudit.bind(storage), storage.createAudit.bind(storage), storage.updateAudit.bind(storage), storage.deleteAudit.bind(storage), insertAuditSchema.partial());
  crudRoutes("pdca", storage.getPdcaByMandant.bind(storage), storage.getPdca.bind(storage), storage.createPdca.bind(storage), storage.updatePdca.bind(storage), storage.deletePdca.bind(storage), insertPdcaSchema.partial());
  crudRoutes("aufgaben", storage.getAufgabenByMandant.bind(storage), storage.getAufgabe.bind(storage), storage.createAufgabe.bind(storage), storage.updateAufgabe.bind(storage), storage.deleteAufgabe.bind(storage));
  crudRoutes("dokumente", storage.getDokumenteByMandant.bind(storage), storage.getDokument.bind(storage), storage.createDokument.bind(storage), storage.updateDokument.bind(storage), storage.deleteDokument.bind(storage), insertDokumentSchema.partial());

  // ─── DB-BACKEND UMSCHALTER (Admin only) ─────────────────────────────────
  app.get("/api/admin/db-config", authMiddleware, adminOnly, (_req, res) => {
    res.json({ backend: readDbBackend() });
  });

  app.get("/api/admin/backups/config", authMiddleware, adminOnly, (_req, res) => {
    const cfg = readBackupConfig();
    res.json({
      backupDir: cfg.backupDir,
      retention: cfg.retention,
      encrypt: cfg.encrypt,
      passwordHint: cfg.passwordHint || "",
      ...readBackupStatus(),
    });
  });

  app.post("/api/admin/backups/config", authMiddleware, adminOnly, validateBody(requestBackupConfigSchema as ZodTypeAny), async (req: any, res) => {
    const cfg = writeBackupConfig(req.body || {});
    startBackupScheduler();
    res.json({
      backupDir: cfg.backupDir,
      retention: cfg.retention,
      encrypt: cfg.encrypt,
      passwordHint: cfg.passwordHint || "",
      ...readBackupStatus(),
    });
  });

  app.get("/api/admin/backups", authMiddleware, adminOnly, (_req, res) => {
    res.json(listBackups());
  });

  app.post("/api/admin/backups/run", authMiddleware, adminOnly, async (req, res) => {
    try {
      const result = runBackupNow(req.body?.password);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Backup fehlgeschlagen" });
    }
  });

  app.post("/api/admin/backups/restore", authMiddleware, adminOnly, validateBody(requestBackupRestoreSchema as ZodTypeAny), async (req: any, res) => {
    try {
      const preflight = inspectBackup(req.body?.fileName, req.body?.password);
      if (req.body?.dryRun === true) return res.json({ ok: true, dryRun: true, preflight });
      const result = await restoreBackup(req.body?.fileName, req.body?.password);
      res.json({ ...result, preflight });
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Backup konnte nicht wiederhergestellt werden" });
    }
  });

  app.post("/api/admin/backups/restore-upload", authMiddleware, adminOnly, express.raw({ type: "application/octet-stream", limit: "250mb" }), async (req: any, res) => {
    try {
      const fileName = String(req.query.fileName || "").trim();
      const password = typeof req.query.password === "string" ? req.query.password : undefined;
      const dryRun = String(req.query.dryRun || "").trim() === "true";
      if (!fileName) return res.status(400).json({ message: "Dateiname fehlt" });
      if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ message: "Keine Backup-Datei hochgeladen" });
      const preflight = inspectUploadedBackup(fileName, req.body, password);
      if (dryRun) return res.json({ ok: true, dryRun: true, preflight });
      const result = await restoreUploadedBackup(fileName, req.body, password);
      res.json({ ...result, preflight });
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Hochgeladenes Backup konnte nicht wiederhergestellt werden" });
    }
  });

  app.post("/api/admin/db-config", authMiddleware, adminOnly, async (req: any, res) => {
    const { backend } = req.body;
    if (backend !== "lowdb" && backend !== "sqlite") {
      return res.status(400).json({ message: "Ungültiges Backend. Erlaubt: lowdb | sqlite" });
    }
    writeDbBackend(backend);
    await reloadStorage();
    res.json({ ok: true, backend, message: `Backend auf '${backend}' umgestellt. Änderungen sofort aktiv.` });
  });

  return httpServer;
}

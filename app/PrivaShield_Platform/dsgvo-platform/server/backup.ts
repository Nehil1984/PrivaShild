// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { readDbBackend, writeDbBackend, type DbBackend } from "./db-config";
import { reloadStorage } from "./storage";

export type BackupRetentionConfig = {
  hourly: number;
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
};

export type BackupConfig = {
  enabled: boolean;
  backupDir: string;
  retention: BackupRetentionConfig;
  encrypt: boolean;
  passwordHint?: string;
  updatedAt: string;
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
};

export type BackupRecord = {
  fileName: string;
  filePath: string;
  createdAt: string;
  size: number;
  encrypted: boolean;
  slot: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  label: string;
  backend: DbBackend | null;
  backendMismatch: boolean;
};

const BACKUP_META_PREFIX = "PSMETA1\n";

type BackupMeta = {
  backend: DbBackend;
  createdAt: string;
  sourceFile: string;
};

type LowdbPayload = {
  meta?: { nextId?: Record<string, number> };
  mandanten?: any[];
  mandantenGruppen?: any[];
  vorlagenpakete?: any[];
  mandantenLogs?: any[];
  vorlagenpaketHistorie?: any[];
  users?: any[];
  vvt?: any[];
  avv?: any[];
  dsfa?: any[];
  datenpannen?: any[];
  dsr?: any[];
  tom?: any[];
  aufgaben?: any[];
  dokumente?: any[];
  loeschkonzept?: any[];
  audits?: any[];
  pdca?: any[];
  interneNotizen?: any[];
};

const defaultRetention: BackupRetentionConfig = {
  hourly: 24,
  daily: 7,
  weekly: 4,
  monthly: 12,
  yearly: 2,
};

function getDataDir() {
  return process.env.DATABASE_PATH ? path.dirname(process.env.DATABASE_PATH) : path.resolve("data");
}

function getBackupDir() {
  return path.join(getDataDir(), "backups");
}

function getConfigPath() {
  return path.join(getBackupDir(), "backup-config.json");
}

function ensureBackupDir() {
  fs.mkdirSync(getBackupDir(), { recursive: true });
}

export function readBackupConfig(): BackupConfig {
  ensureBackupDir();
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    const cfg: BackupConfig = {
      enabled: false,
      backupDir: getBackupDir(),
      retention: defaultRetention,
      encrypt: false,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), "utf-8");
    return cfg;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return {
      enabled: !!parsed.enabled,
      backupDir: parsed.backupDir || getBackupDir(),
      retention: { ...defaultRetention, ...(parsed.retention || {}) },
      encrypt: !!parsed.encrypt,
      passwordHint: parsed.passwordHint || "",
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      lastRunAt: parsed.lastRunAt || undefined,
      lastSuccessAt: parsed.lastSuccessAt || undefined,
      lastErrorAt: parsed.lastErrorAt || undefined,
      lastErrorMessage: parsed.lastErrorMessage || undefined,
    };
  } catch {
    return {
      enabled: false,
      backupDir: getBackupDir(),
      retention: defaultRetention,
      encrypt: false,
      updatedAt: new Date().toISOString(),
      lastRunAt: undefined,
      lastSuccessAt: undefined,
      lastErrorAt: undefined,
      lastErrorMessage: undefined,
    };
  }
}

export function writeBackupConfig(next: Partial<BackupConfig> & { retention?: Partial<BackupRetentionConfig> }) {
  const current = readBackupConfig();
  const cfg: BackupConfig = {
    ...current,
    ...next,
    retention: { ...current.retention, ...(next.retention || {}) },
    backupDir: next.backupDir || current.backupDir || getBackupDir(),
    updatedAt: new Date().toISOString(),
  };
  fs.mkdirSync(cfg.backupDir, { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify(cfg, null, 2), "utf-8");
  return cfg;
}

function updateBackupStatus(patch: Partial<BackupConfig>) {
  const current = readBackupConfig();
  const next: BackupConfig = {
    ...current,
    ...patch,
    updatedAt: patch.updatedAt || current.updatedAt,
  };
  fs.mkdirSync(next.backupDir, { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export function readBackupStatus() {
  const cfg = readBackupConfig();
  return {
    enabled: cfg.enabled,
    updatedAt: cfg.updatedAt,
    nextRunAt: nextBackupRunEstimate(),
    lastRunAt: cfg.lastRunAt || null,
    lastSuccessAt: cfg.lastSuccessAt || null,
    lastErrorAt: cfg.lastErrorAt || null,
    lastErrorMessage: cfg.lastErrorMessage || "",
    schedulerActive: !!backupTimer && cfg.enabled,
    schedulerRuntimePasswordConfigured: !!process.env.PRIVASHIELD_BACKUP_PASSWORD,
  };
}

function getSourceFile() {
  const backend = readDbBackend();
  if (backend === "sqlite") return process.env.DATABASE_PATH || path.resolve("data.db");
  const dataDir = getDataDir();
  return path.join(dataDir, "privashield.json");
}

function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function weekStart(d: Date) {
  const day = d.getUTCDay() || 7;
  const base = startOfDay(d);
  base.setUTCDate(base.getUTCDate() - (day - 1));
  return base;
}
function monthStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function yearStart(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
}

function buildLabel(slot: BackupRecord["slot"], d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  if (slot === "hourly") return `${y}${m}${day}-${h}`;
  if (slot === "daily") return `${y}${m}${day}`;
  if (slot === "weekly") {
    const ws = weekStart(d);
    return `${ws.getUTCFullYear()}-W${String(Math.ceil((((ws.getTime() - Date.UTC(ws.getUTCFullYear(),0,1))/86400000)+1)/7)).padStart(2, "0")}`;
  }
  if (slot === "monthly") return `${y}-${m}`;
  return `${y}`;
}

function slotMatches(slot: BackupRecord["slot"], createdAt: Date, now: Date) {
  if (slot === "hourly") return true;
  if (slot === "daily") return startOfDay(createdAt).getTime() === startOfDay(now).getTime();
  if (slot === "weekly") return weekStart(createdAt).getTime() === weekStart(now).getTime();
  if (slot === "monthly") return monthStart(createdAt).getTime() === monthStart(now).getTime();
  return yearStart(createdAt).getTime() === yearStart(now).getTime();
}

function encryptBuffer(buffer: Buffer, password: string) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from("PSB1"), salt, iv, tag, encrypted]);
}

function decryptBuffer(buffer: Buffer, password: string) {
  const magic = buffer.subarray(0, 4).toString("utf8");
  if (magic !== "PSB1") throw new Error("Ungültiges verschlüsseltes Backup-Format");
  const salt = buffer.subarray(4, 20);
  const iv = buffer.subarray(20, 32);
  const tag = buffer.subarray(32, 48);
  const encrypted = buffer.subarray(48);
  const key = crypto.scryptSync(password, salt, 32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

function parseBackupMeta(raw: Buffer, encrypted: boolean, passwordOverride?: string): BackupMeta | null {
  let decoded = raw;
  if (encrypted) {
    const password = passwordOverride || process.env.PRIVASHIELD_BACKUP_PASSWORD;
    if (!password) return null;
    try {
      decoded = decryptBuffer(raw, password);
    } catch {
      return null;
    }
  }
  const text = decoded.toString("utf8");
  if (!text.startsWith(BACKUP_META_PREFIX)) return null;
  const end = text.indexOf("\n", BACKUP_META_PREFIX.length);
  if (end === -1) return null;
  try {
    const meta = JSON.parse(text.slice(BACKUP_META_PREFIX.length, end));
    if (meta?.backend === "lowdb" || meta?.backend === "sqlite") {
      return meta as BackupMeta;
    }
  } catch {}
  return null;
}

function splitBackupPayload(raw: Buffer, encrypted: boolean, passwordOverride?: string) {
  const meta = parseBackupMeta(raw, encrypted, passwordOverride);
  if (!meta) return { meta: null, payload: raw };

  let decoded = raw;
  if (encrypted) {
    const password = passwordOverride || process.env.PRIVASHIELD_BACKUP_PASSWORD;
    if (!password) throw new Error("Für verschlüsselte Wiederherstellung wurde kein Kennwort übergeben");
    try {
      decoded = decryptBuffer(raw, password);
    } catch {
      throw new Error("Backup-Kennwort ist ungültig oder Backup-Datei beschädigt");
    }
  }

  const firstNewline = decoded.indexOf(0x0a, BACKUP_META_PREFIX.length);
  if (firstNewline === -1) return { meta, payload: decoded };
  return { meta, payload: decoded.subarray(firstNewline + 1) };
}

function parseFile(filePath: string): BackupRecord | null {
  const name = path.basename(filePath);
  const match = /^backup-(hourly|daily|weekly|monthly|yearly)-([^.]+)\.(bak|enc)$/.exec(name);
  if (!match) return null;
  const stat = fs.statSync(filePath);
  const encrypted = match[3] === "enc";
  const meta = parseBackupMeta(fs.readFileSync(filePath), encrypted);
  const currentBackend = readDbBackend();
  return {
    fileName: name,
    filePath,
    createdAt: stat.mtime.toISOString(),
    size: stat.size,
    encrypted,
    slot: match[1] as any,
    label: match[2],
    backend: meta?.backend || null,
    backendMismatch: !!meta?.backend && meta.backend !== currentBackend,
  };
}

export function listBackups(): BackupRecord[] {
  const cfg = readBackupConfig();
  fs.mkdirSync(cfg.backupDir, { recursive: true });
  return fs.readdirSync(cfg.backupDir)
    .map((f) => parseFile(path.join(cfg.backupDir, f)))
    .filter(Boolean)
    .sort((a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt))) as BackupRecord[];
}

function pruneSlot(slot: BackupRecord["slot"], keep: number) {
  const rows = listBackups().filter((r) => r.slot === slot);
  const grouped = new Map<string, BackupRecord[]>();
  for (const row of rows) {
    const arr = grouped.get(row.label) || [];
    arr.push(row);
    grouped.set(row.label, arr);
  }
  const labels = Array.from(grouped.keys()).sort().reverse();
  labels.slice(keep).forEach((label) => {
    for (const row of grouped.get(label) || []) {
      if (fs.existsSync(row.filePath)) fs.unlinkSync(row.filePath);
    }
  });
}

export function runBackupNow(passwordOverride?: string) {
  const runAt = new Date().toISOString();
  try {
    const cfg = readBackupConfig();
    const source = getSourceFile();
    const backend = readDbBackend();
    if (!fs.existsSync(source)) throw new Error(`Quelldatei nicht gefunden: ${source}`);
    fs.mkdirSync(cfg.backupDir, { recursive: true });
    const now = new Date();
    const sourceBuffer = fs.readFileSync(source);
    const metaBuffer = Buffer.from(`${BACKUP_META_PREFIX}${JSON.stringify({ backend, createdAt: now.toISOString(), sourceFile: source })}\n`, "utf8");
    const buffer = Buffer.concat([metaBuffer, sourceBuffer]);
    const useEncryption = cfg.encrypt;
    const password = passwordOverride || undefined;
    if (useEncryption && !password) throw new Error("Verschlüsselung aktiv, aber kein Kennwort übergeben.");
    const payload = useEncryption ? encryptBuffer(buffer, password!) : buffer;
    const ext = useEncryption ? "enc" : "bak";

    const slots: BackupRecord["slot"][] = ["hourly", "daily", "weekly", "monthly", "yearly"];
    const created: BackupRecord[] = [];
    for (const slot of slots) {
      const label = buildLabel(slot, now);
      const existing = listBackups().find((row) => row.slot === slot && row.label === label);
      if (existing && slotMatches(slot, new Date(existing.createdAt), now)) continue;
      const fileName = `backup-${slot}-${label}.${ext}`;
      const filePath = path.join(cfg.backupDir, fileName);
      fs.writeFileSync(filePath, payload);
      const stat = fs.statSync(filePath);
      created.push({ fileName, filePath, createdAt: stat.mtime.toISOString(), size: stat.size, encrypted: useEncryption, slot, label, backend, backendMismatch: false });
    }

    pruneSlot("hourly", cfg.retention.hourly);
    pruneSlot("daily", cfg.retention.daily);
    pruneSlot("weekly", cfg.retention.weekly);
    pruneSlot("monthly", cfg.retention.monthly);
    pruneSlot("yearly", cfg.retention.yearly);

    updateBackupStatus({
      lastRunAt: runAt,
      lastSuccessAt: runAt,
      lastErrorAt: undefined,
      lastErrorMessage: undefined,
    });

    return {
      source,
      backend,
      encrypted: useEncryption,
      created,
      retention: cfg.retention,
      backups: listBackups(),
    };
  } catch (error: any) {
    updateBackupStatus({
      lastRunAt: runAt,
      lastErrorAt: runAt,
      lastErrorMessage: error?.message || "Backup fehlgeschlagen",
    });
    throw error;
  }
}

function normalizeArray<T>(rows: T[] | undefined | null) {
  return Array.isArray(rows) ? rows : [];
}

async function migrateLowdbPayloadToSqlite(payload: Buffer) {
  const json = JSON.parse(payload.toString("utf8")) as LowdbPayload;
  const targetFile = getSourceFile();
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  if (fs.existsSync(targetFile)) fs.unlinkSync(targetFile);

  writeDbBackend("sqlite");
  await reloadStorage();

  const targetPath = process.env.DATABASE_PATH || path.resolve("data.db");
  const { db } = await import("./db.js");

  const insertMany = (table: any, rows: any[]) => {
    if (!rows.length) return;
    db.insert(table).values(rows).run();
  };

  insertMany((await import("@shared/schema")).mandantenGruppen, normalizeArray(json.mandantenGruppen));
  insertMany((await import("@shared/schema")).mandanten, normalizeArray(json.mandanten));
  insertMany((await import("@shared/schema")).vorlagenpakete, normalizeArray(json.vorlagenpakete));
  insertMany((await import("@shared/schema")).users, normalizeArray(json.users).map((row: any) => ({
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role,
    mandantIds: row.mandantIds,
    aktiv: row.aktiv,
    failedLoginAttempts: row.failedLoginAttempts ?? 0,
    temporaryLockUntil: row.temporaryLockUntil ?? null,
    adminLocked: row.adminLocked ?? false,
    adminLockedAt: row.adminLockedAt ?? null,
    lastFailedLoginAt: row.lastFailedLoginAt ?? null,
    createdAt: row.createdAt,
  })));
  insertMany((await import("@shared/schema")).vvt, normalizeArray(json.vvt));
  insertMany((await import("@shared/schema")).avv, normalizeArray(json.avv));
  insertMany((await import("@shared/schema")).dsfa, normalizeArray(json.dsfa));
  insertMany((await import("@shared/schema")).datenpannen, normalizeArray(json.datenpannen));
  insertMany((await import("@shared/schema")).dsr, normalizeArray(json.dsr));
  insertMany((await import("@shared/schema")).tom, normalizeArray(json.tom));
  insertMany((await import("@shared/schema")).audits, normalizeArray(json.audits));
  insertMany((await import("@shared/schema")).pdca, normalizeArray(json.pdca));
  insertMany((await import("@shared/schema")).loeschkonzept, normalizeArray(json.loeschkonzept));
  insertMany((await import("@shared/schema")).aufgaben, normalizeArray(json.aufgaben));
  insertMany((await import("@shared/schema")).dokumente, normalizeArray(json.dokumente));
  insertMany((await import("@shared/schema")).interneNotizen, normalizeArray(json.interneNotizen));
  insertMany((await import("@shared/schema")).mandantenLogs, normalizeArray(json.mandantenLogs));
  insertMany((await import("@shared/schema")).vorlagenpaketHistorie, normalizeArray(json.vorlagenpaketHistorie));

  return { targetFile: targetPath, migratedFrom: "lowdb", migratedTo: "sqlite" };
}

async function restoreBackupBuffer(fileName: string, raw: Buffer, encrypted: boolean, passwordOverride?: string) {
  const currentBackend = readDbBackend();
  const { meta, payload } = splitBackupPayload(raw, encrypted, passwordOverride);

  if (meta?.backend === "lowdb" && currentBackend === "sqlite") {
    const migration = await migrateLowdbPayloadToSqlite(payload);
    updateBackupStatus({ lastErrorAt: undefined, lastErrorMessage: undefined });
    return {
      ok: true,
      restoredFrom: fileName,
      restoredAt: new Date().toISOString(),
      targetFile: migration.targetFile,
      backend: "sqlite",
      backendMismatch: false,
      migrated: true,
      migratedFrom: "lowdb",
      migratedTo: "sqlite",
    };
  }

  if (meta?.backend && meta.backend !== currentBackend) {
    throw new Error(`Backup-Backend '${meta.backend}' passt nicht zum aktuell aktiven Backend '${currentBackend}'. Bitte Zielsystem umstellen oder eine Migration durchführen.`);
  }

  const targetFile = getSourceFile();
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, payload);
  updateBackupStatus({
    lastErrorAt: undefined,
    lastErrorMessage: undefined,
  });

  return {
    ok: true,
    restoredFrom: fileName,
    restoredAt: new Date().toISOString(),
    targetFile,
    backend: meta?.backend || currentBackend,
    backendMismatch: !!meta?.backend && meta.backend !== currentBackend,
  };
}

export async function restoreBackup(fileName: string, passwordOverride?: string) {
  const backup = listBackups().find((row) => row.fileName === fileName);
  if (!backup) throw new Error("Backup nicht gefunden");
  if (!fs.existsSync(backup.filePath)) throw new Error("Backup-Datei nicht gefunden");
  return restoreBackupBuffer(backup.fileName, fs.readFileSync(backup.filePath), backup.encrypted, passwordOverride);
}

export async function restoreUploadedBackup(fileName: string, raw: Buffer, passwordOverride?: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext !== ".bak" && ext !== ".enc") throw new Error("Nur Backup-Dateien mit .bak oder .enc sind erlaubt");
  return restoreBackupBuffer(fileName, raw, ext === ".enc", passwordOverride);
}

export function nextBackupRunEstimate() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next.toISOString();
}

let backupTimer: NodeJS.Timeout | null = null;
export function startBackupScheduler() {
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = null;
  const cfg = readBackupConfig();
  if (!cfg.enabled) return;
  const schedule = () => {
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);
    const delay = Math.max(1000, next.getTime() - now.getTime());
    backupTimer = setTimeout(() => {
      try {
        const current = readBackupConfig();
        if (current.enabled) {
          runBackupNow(process.env.PRIVASHIELD_BACKUP_PASSWORD);
        }
      } catch (error) {
        console.error('[Backup] Scheduler-Lauf fehlgeschlagen', error);
      } finally {
        schedule();
      }
    }, delay);
  };
  schedule();
}

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
import { readDbBackend } from "./db-config";

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
  passwordHash?: string;
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
      passwordHash: parsed.passwordHash || undefined,
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

export function writeBackupConfig(next: Partial<BackupConfig> & { retention?: Partial<BackupRetentionConfig>; password?: string }) {
  const current = readBackupConfig();
  const passwordHash = next.password ? crypto.scryptSync(next.password, "privashield-backup", 32).toString("hex") : current.passwordHash;
  const cfg: BackupConfig = {
    ...current,
    ...next,
    retention: { ...current.retention, ...(next.retention || {}) },
    passwordHash,
    backupDir: next.backupDir || current.backupDir || getBackupDir(),
    updatedAt: new Date().toISOString(),
  };
  delete (cfg as any).password;
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

function parseFile(filePath: string): BackupRecord | null {
  const name = path.basename(filePath);
  const match = /^backup-(hourly|daily|weekly|monthly|yearly)-([^.]+)\.(bak|enc)$/.exec(name);
  if (!match) return null;
  const stat = fs.statSync(filePath);
  return {
    fileName: name,
    filePath,
    createdAt: stat.mtime.toISOString(),
    size: stat.size,
    encrypted: match[3] === "enc",
    slot: match[1] as any,
    label: match[2],
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
    if (!fs.existsSync(source)) throw new Error(`Quelldatei nicht gefunden: ${source}`);
    fs.mkdirSync(cfg.backupDir, { recursive: true });
    const now = new Date();
    const buffer = fs.readFileSync(source);
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
      created.push({ fileName, filePath, createdAt: stat.mtime.toISOString(), size: stat.size, encrypted: useEncryption, slot, label });
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
      backend: readDbBackend(),
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
        if (current.enabled && (!current.encrypt || current.passwordHash)) {
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

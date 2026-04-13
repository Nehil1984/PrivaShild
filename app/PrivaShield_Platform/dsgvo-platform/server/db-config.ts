/**
 * DB-Konfigurations-Manager
 * Speichert welches Backend (lowdb | sqlite) aktiv ist
 * Standard: lowdb
 */
import path from "path";
import fs from "fs";

const configDir = process.env.DATABASE_PATH
  ? path.dirname(process.env.DATABASE_PATH)
  : path.resolve("data");

const configFile = path.join(configDir, "db-config.json");

export type DbBackend = "lowdb" | "sqlite";

function ensureDir() {
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
}

export function readDbBackend(): DbBackend {
  try {
    ensureDir();
    if (!fs.existsSync(configFile)) return "lowdb";
    const raw = fs.readFileSync(configFile, "utf-8");
    const obj = JSON.parse(raw);
    return obj.backend === "sqlite" ? "sqlite" : "lowdb";
  } catch {
    return "lowdb";
  }
}

export function writeDbBackend(backend: DbBackend): void {
  ensureDir();
  fs.writeFileSync(configFile, JSON.stringify({ backend, updatedAt: new Date().toISOString() }), "utf-8");
}

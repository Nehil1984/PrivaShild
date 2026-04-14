/**
 * Storage-Factory
 *
 * WICHTIG: db.ts (SQLite/better-sqlite3) wird hier NICHT importiert.
 * Der Import erfolgt lazy in createStorage(), nur wenn backend === "sqlite".
 * So startet der Server ohne SQLite-Fehler, wenn lowdb aktiv ist.
 */
import bcrypt from "bcryptjs";
import {
  type Mandant, type InsertMandant,
  type MandantenGruppe, type InsertMandantenGruppe,
  type Vorlagenpaket, type InsertVorlagenpaket,
  type MandantenLog, type InsertMandantenLog,
  type VorlagenpaketHistorie, type InsertVorlagenpaketHistorie,
  type User, type InsertUser,
  type Vvt, type InsertVvt,
  type Avv, type InsertAvv,
  type Dsfa, type InsertDsfa,
  type Datenpanne, type InsertDatenpanne,
  type Dsr, type InsertDsr,
  type Tom, type InsertTom,
  type Audit, type InsertAudit,
  type Loeschkonzept, type InsertLoeschkonzept,
  type Aufgabe, type InsertAufgabe,
  type Dokument, type InsertDokument,
  type InterneNotiz, type InsertInterneNotiz,
} from "@shared/schema";

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(data: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Mandanten
  getMandanten(): Promise<Mandant[]>;
  getMandant(id: number): Promise<Mandant | undefined>;
  createMandant(data: InsertMandant): Promise<Mandant>;
  updateMandant(id: number, data: Partial<InsertMandant>): Promise<Mandant | undefined>;
  deleteMandant(id: number): Promise<void>;

  // Mandantengruppen
  getMandantenGruppen(): Promise<MandantenGruppe[]>;
  getMandantenGruppe(id: number): Promise<MandantenGruppe | undefined>;
  createMandantenGruppe(data: InsertMandantenGruppe): Promise<MandantenGruppe>;
  updateMandantenGruppe(id: number, data: Partial<InsertMandantenGruppe>): Promise<MandantenGruppe | undefined>;
  deleteMandantenGruppe(id: number): Promise<void>;

  // Vorlagenpakete
  getVorlagenpakete(): Promise<Vorlagenpaket[]>;
  getVorlagenpaket(id: number): Promise<Vorlagenpaket | undefined>;
  createVorlagenpaket(data: InsertVorlagenpaket): Promise<Vorlagenpaket>;
  updateVorlagenpaket(id: number, data: Partial<InsertVorlagenpaket>): Promise<Vorlagenpaket | undefined>;
  deleteVorlagenpaket(id: number): Promise<void>;
  applyVorlagenpaketToMandant(mandantId: number, paketId: number, user?: { id?: number; name?: string }): Promise<{ ok: true; created: Record<string, number> }>;

  // Mandanten-Logs
  getMandantenLogs(mandantId: number): Promise<MandantenLog[]>;
  createMandantenLog(data: InsertMandantenLog): Promise<MandantenLog>;

  // Vorlagenpaket-Historie
  getVorlagenpaketHistorie(mandantId: number): Promise<VorlagenpaketHistorie[]>;
  createVorlagenpaketHistorie(data: InsertVorlagenpaketHistorie): Promise<VorlagenpaketHistorie>;

  // VVT
  getVvtByMandant(mandantId: number): Promise<Vvt[]>;
  getVvt(id: number): Promise<Vvt | undefined>;
  createVvt(data: InsertVvt): Promise<Vvt>;
  updateVvt(id: number, data: Partial<InsertVvt>): Promise<Vvt | undefined>;
  deleteVvt(id: number): Promise<void>;

  // AVV
  getAvvByMandant(mandantId: number): Promise<Avv[]>;
  getAvv(id: number): Promise<Avv | undefined>;
  createAvv(data: InsertAvv): Promise<Avv>;
  updateAvv(id: number, data: Partial<InsertAvv>): Promise<Avv | undefined>;
  deleteAvv(id: number): Promise<void>;

  // DSFA
  getDsfaByMandant(mandantId: number): Promise<Dsfa[]>;
  getDsfa(id: number): Promise<Dsfa | undefined>;
  createDsfa(data: InsertDsfa): Promise<Dsfa>;
  updateDsfa(id: number, data: Partial<InsertDsfa>): Promise<Dsfa | undefined>;
  deleteDsfa(id: number): Promise<void>;

  // Datenpannen
  getDatenpannenByMandant(mandantId: number): Promise<Datenpanne[]>;
  getDatenpanne(id: number): Promise<Datenpanne | undefined>;
  createDatenpanne(data: InsertDatenpanne): Promise<Datenpanne>;
  updateDatenpanne(id: number, data: Partial<InsertDatenpanne>): Promise<Datenpanne | undefined>;
  deleteDatenpanne(id: number): Promise<void>;

  // DSR
  getDsrByMandant(mandantId: number): Promise<Dsr[]>;
  getDsr(id: number): Promise<Dsr | undefined>;
  createDsr(data: InsertDsr): Promise<Dsr>;
  updateDsr(id: number, data: Partial<InsertDsr>): Promise<Dsr | undefined>;
  deleteDsr(id: number): Promise<void>;

  // TOM
  getTomByMandant(mandantId: number): Promise<Tom[]>;
  getTom(id: number): Promise<Tom | undefined>;
  createTom(data: InsertTom): Promise<Tom>;
  updateTom(id: number, data: Partial<InsertTom>): Promise<Tom | undefined>;
  deleteTom(id: number): Promise<void>;

  // Audit
  getAuditsByMandant(mandantId: number): Promise<Audit[]>;
  getAudit(id: number): Promise<Audit | undefined>;
  createAudit(data: InsertAudit): Promise<Audit>;
  updateAudit(id: number, data: Partial<InsertAudit>): Promise<Audit | undefined>;
  deleteAudit(id: number): Promise<void>;

  // Löschkonzept
  getLoeschkonzeptByMandant(mandantId: number): Promise<Loeschkonzept[]>;
  getLoeschkonzept(id: number): Promise<Loeschkonzept | undefined>;
  createLoeschkonzept(data: InsertLoeschkonzept): Promise<Loeschkonzept>;
  updateLoeschkonzept(id: number, data: Partial<InsertLoeschkonzept>): Promise<Loeschkonzept | undefined>;
  deleteLoeschkonzept(id: number): Promise<void>;

  // Aufgaben
  getAufgabenByMandant(mandantId: number): Promise<Aufgabe[]>;
  getAufgabe(id: number): Promise<Aufgabe | undefined>;
  createAufgabe(data: InsertAufgabe): Promise<Aufgabe>;
  updateAufgabe(id: number, data: Partial<InsertAufgabe>): Promise<Aufgabe | undefined>;
  deleteAufgabe(id: number): Promise<void>;

  // Dokumente
  getDokumenteByMandant(mandantId: number): Promise<Dokument[]>;
  getDokument(id: number): Promise<Dokument | undefined>;
  createDokument(data: InsertDokument): Promise<Dokument>;
  updateDokument(id: number, data: Partial<InsertDokument>): Promise<Dokument | undefined>;
  deleteDokument(id: number): Promise<void>;

  // Interne Notizen
  getInterneNotizenByMandant(mandantId: number): Promise<InterneNotiz[]>;
  getInterneNotiz(id: number): Promise<InterneNotiz | undefined>;
  createInterneNotiz(data: InsertInterneNotiz): Promise<InterneNotiz>;
  updateInterneNotiz(id: number, data: Partial<InsertInterneNotiz>): Promise<InterneNotiz | undefined>;
  deleteInterneNotiz(id: number): Promise<void>;

  // Stats
  getStatsForMandant(mandantId: number): Promise<Record<string, number>>;
}

// ─── Storage-Factory (lazy imports!) ─────────────────────────────────────────

import { readDbBackend } from "./db-config.js";
import { LowdbStorage } from "./storage-lowdb.js";

function createStorage(): IStorage {
  const backend = readDbBackend();
  if (backend === "sqlite") {
    console.log("[DB] Backend: SQLite (better-sqlite3)");
    // Lazy import: db.ts wird NUR geladen, wenn SQLite gewählt ist
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseStorage } = require("./storage-sqlite.js");
    return new DatabaseStorage();
  }
  console.log("[DB] Backend: lowdb (JSON-Datei)");
  return new LowdbStorage();
}

export let storage: IStorage = createStorage();

/** Wird vom Admin-API-Endpunkt aufgerufen, um das Backend zur Laufzeit zu wechseln */
export function reloadStorage(): void {
  storage = createStorage();
}

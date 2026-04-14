/**
 * SQLite-basierter Storage (better-sqlite3 + Drizzle ORM)
 * Wird nur geladen, wenn das Backend explizit auf "sqlite" gestellt ist.
 * So wird db.ts (und damit better-sqlite3) NICHT beim Start initialisiert,
 * wenn lowdb aktiv ist.
 */
import { db } from "./db.js";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  mandanten, mandantenGruppen, vorlagenpakete, mandantenLogs, users, vvt, avv, dsfa, datenpannen, dsr, tom, loeschkonzept, audits, aufgaben, dokumente, interneNotizen,
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
import type { IStorage } from "./storage.js";

export class DatabaseStorage implements IStorage {
  async getUserByEmail(email: string) {
    return db.select().from(users).where(eq(users.email, email)).get();
  }
  async getUserById(id: number) {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  async createUser(data: InsertUser) {
    const { password, ...rest } = data as any;
    const passwordHash = await bcrypt.hash(password, 12);
    return db.insert(users).values({ ...rest, passwordHash }).returning().get();
  }
  async getAllUsers() {
    return db.select().from(users).all();
  }
  async updateUser(id: number, data: Partial<InsertUser>) {
    const { password, ...rest } = data as any;
    const updates: any = { ...rest };
    if (password) updates.passwordHash = await bcrypt.hash(password, 12);
    return db.update(users).set(updates).where(eq(users.id, id)).returning().get();
  }
  async deleteUser(id: number) {
    db.delete(users).where(eq(users.id, id)).run();
  }

  // Mandanten
  async getMandanten() { return db.select().from(mandanten).all(); }
  async getMandant(id: number) { return db.select().from(mandanten).where(eq(mandanten.id, id)).get(); }
  async createMandant(data: InsertMandant) { return db.insert(mandanten).values({ ...data, createdAt: new Date().toISOString() }).returning().get(); }
  async updateMandant(id: number, data: Partial<InsertMandant>) { return db.update(mandanten).set(data).where(eq(mandanten.id, id)).returning().get(); }
  async deleteMandant(id: number) { db.delete(mandanten).where(eq(mandanten.id, id)).run(); }

  // Mandantengruppen
  async getMandantenGruppen() { return db.select().from(mandantenGruppen).all(); }
  async getMandantenGruppe(id: number) { return db.select().from(mandantenGruppen).where(eq(mandantenGruppen.id, id)).get(); }
  async createMandantenGruppe(data: InsertMandantenGruppe) { return db.insert(mandantenGruppen).values({ ...data, createdAt: new Date().toISOString() }).returning().get(); }
  async updateMandantenGruppe(id: number, data: Partial<InsertMandantenGruppe>) { return db.update(mandantenGruppen).set(data).where(eq(mandantenGruppen.id, id)).returning().get(); }
  async deleteMandantenGruppe(id: number) { db.delete(mandantenGruppen).where(eq(mandantenGruppen.id, id)).run(); }

  // Vorlagenpakete
  async getVorlagenpakete() { return db.select().from(vorlagenpakete).all(); }
  async getVorlagenpaket(id: number) { return db.select().from(vorlagenpakete).where(eq(vorlagenpakete.id, id)).get(); }
  async createVorlagenpaket(data: InsertVorlagenpaket) { return db.insert(vorlagenpakete).values({ ...data, createdAt: new Date().toISOString() }).returning().get(); }
  async updateVorlagenpaket(id: number, data: Partial<InsertVorlagenpaket>) { return db.update(vorlagenpakete).set(data).where(eq(vorlagenpakete.id, id)).returning().get(); }
  async deleteVorlagenpaket(id: number) { db.delete(vorlagenpakete).where(eq(vorlagenpakete.id, id)).run(); }
  async applyVorlagenpaketToMandant(_mandantId: number, _paketId: number, _user?: { id?: number; name?: string }) {
    return { ok: true as const, created: { aufgaben: 0, dokumente: 0 } };
  }

  // Mandanten-Logs
  async getMandantenLogs(mandantId: number) { return db.select().from(mandantenLogs).where(eq(mandantenLogs.mandantId, mandantId)).orderBy(desc(mandantenLogs.zeitpunkt)).all(); }
  async createMandantenLog(data: InsertMandantenLog) { return db.insert(mandantenLogs).values({ ...data, zeitpunkt: new Date().toISOString() }).returning().get(); }
  async getVorlagenpaketHistorie(_mandantId: number) { return [] as VorlagenpaketHistorie[]; }
  async createVorlagenpaketHistorie(_data: InsertVorlagenpaketHistorie): Promise<VorlagenpaketHistorie> { throw new Error("Vorlagenpaket-Historie für SQLite noch nicht implementiert"); }

  // VVT
  async getVvtByMandant(mandantId: number) { return db.select().from(vvt).where(eq(vvt.mandantId, mandantId)).orderBy(desc(vvt.createdAt)).all(); }
  async getVvt(id: number) { return db.select().from(vvt).where(eq(vvt.id, id)).get(); }
  async createVvt(data: InsertVvt) { const now = new Date().toISOString(); return db.insert(vvt).values({ ...data, createdAt: now, updatedAt: now }).returning().get(); }
  async updateVvt(id: number, data: Partial<InsertVvt>) { return db.update(vvt).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(vvt.id, id)).returning().get(); }
  async deleteVvt(id: number) { db.delete(vvt).where(eq(vvt.id, id)).run(); }

  // AVV
  async getAvvByMandant(mandantId: number) { return db.select().from(avv).where(eq(avv.mandantId, mandantId)).orderBy(desc(avv.createdAt)).all(); }
  async getAvv(id: number) { return db.select().from(avv).where(eq(avv.id, id)).get(); }
  async createAvv(data: InsertAvv) { const now = new Date().toISOString(); return db.insert(avv).values({ ...data, createdAt: now, updatedAt: now }).returning().get(); }
  async updateAvv(id: number, data: Partial<InsertAvv>) { return db.update(avv).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(avv.id, id)).returning().get(); }
  async deleteAvv(id: number) { db.delete(avv).where(eq(avv.id, id)).run(); }

  // DSFA
  async getDsfaByMandant(mandantId: number) { return db.select().from(dsfa).where(eq(dsfa.mandantId, mandantId)).orderBy(desc(dsfa.createdAt)).all(); }
  async getDsfa(id: number) { return db.select().from(dsfa).where(eq(dsfa.id, id)).get(); }
  async createDsfa(data: InsertDsfa) { const now = new Date().toISOString(); return db.insert(dsfa).values({ ...data, createdAt: now, updatedAt: now }).returning().get(); }
  async updateDsfa(id: number, data: Partial<InsertDsfa>) { return db.update(dsfa).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(dsfa.id, id)).returning().get(); }
  async deleteDsfa(id: number) { db.delete(dsfa).where(eq(dsfa.id, id)).run(); }

  // Datenpannen
  async getDatenpannenByMandant(mandantId: number) { return db.select().from(datenpannen).where(eq(datenpannen.mandantId, mandantId)).orderBy(desc(datenpannen.createdAt)).all(); }
  async getDatenpanne(id: number) { return db.select().from(datenpannen).where(eq(datenpannen.id, id)).get(); }
  async createDatenpanne(data: InsertDatenpanne) { return db.insert(datenpannen).values({ ...data, createdAt: new Date().toISOString() }).returning().get(); }
  async updateDatenpanne(id: number, data: Partial<InsertDatenpanne>) { return db.update(datenpannen).set(data).where(eq(datenpannen.id, id)).returning().get(); }
  async deleteDatenpanne(id: number) { db.delete(datenpannen).where(eq(datenpannen.id, id)).run(); }

  // DSR
  async getDsrByMandant(mandantId: number) { return db.select().from(dsr).where(eq(dsr.mandantId, mandantId)).orderBy(desc(dsr.createdAt)).all(); }
  async getDsr(id: number) { return db.select().from(dsr).where(eq(dsr.id, id)).get(); }
  async createDsr(data: InsertDsr) { return db.insert(dsr).values({ ...data, createdAt: new Date().toISOString() }).returning().get(); }
  async updateDsr(id: number, data: Partial<InsertDsr>) { return db.update(dsr).set(data).where(eq(dsr.id, id)).returning().get(); }
  async deleteDsr(id: number) { db.delete(dsr).where(eq(dsr.id, id)).run(); }

  // TOM
  async getTomByMandant(mandantId: number) { return db.select().from(tom).where(eq(tom.mandantId, mandantId)).all(); }
  async getTom(id: number) { return db.select().from(tom).where(eq(tom.id, id)).get(); }
  async createTom(data: InsertTom) { return db.insert(tom).values({ ...data, createdAt: new Date().toISOString() }).returning().get(); }
  async updateTom(id: number, data: Partial<InsertTom>) { return db.update(tom).set(data).where(eq(tom.id, id)).returning().get(); }
  async deleteTom(id: number) { db.delete(tom).where(eq(tom.id, id)).run(); }

  // Audit
  async getAuditsByMandant(mandantId: number) { return db.select().from(audits).where(eq(audits.mandantId, mandantId)).orderBy(desc(audits.createdAt)).all(); }
  async getAudit(id: number) { return db.select().from(audits).where(eq(audits.id, id)).get(); }
  async createAudit(data: InsertAudit) { const now = new Date().toISOString(); return db.insert(audits).values({ ...data, createdAt: now, updatedAt: now }).returning().get(); }
  async updateAudit(id: number, data: Partial<InsertAudit>) { return db.update(audits).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(audits.id, id)).returning().get(); }
  async deleteAudit(id: number) { db.delete(audits).where(eq(audits.id, id)).run(); }

  // Löschkonzept
  async getLoeschkonzeptByMandant(mandantId: number) { return db.select().from(loeschkonzept).where(eq(loeschkonzept.mandantId, mandantId)).orderBy(desc(loeschkonzept.createdAt)).all(); }
  async getLoeschkonzept(id: number) { return db.select().from(loeschkonzept).where(eq(loeschkonzept.id, id)).get(); }
  async createLoeschkonzept(data: InsertLoeschkonzept) { const now = new Date().toISOString(); return db.insert(loeschkonzept).values({ ...data, createdAt: now, updatedAt: now }).returning().get(); }
  async updateLoeschkonzept(id: number, data: Partial<InsertLoeschkonzept>) { return db.update(loeschkonzept).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(loeschkonzept.id, id)).returning().get(); }
  async deleteLoeschkonzept(id: number) { db.delete(loeschkonzept).where(eq(loeschkonzept.id, id)).run(); }

  // Aufgaben
  async getAufgabenByMandant(mandantId: number) { return db.select().from(aufgaben).where(eq(aufgaben.mandantId, mandantId)).orderBy(desc(aufgaben.createdAt)).all(); }
  async getAufgabe(id: number) { return db.select().from(aufgaben).where(eq(aufgaben.id, id)).get(); }
  async createAufgabe(data: InsertAufgabe) { return db.insert(aufgaben).values({ ...data, createdAt: new Date().toISOString() }).returning().get(); }
  async updateAufgabe(id: number, data: Partial<InsertAufgabe>) { return db.update(aufgaben).set(data).where(eq(aufgaben.id, id)).returning().get(); }
  async deleteAufgabe(id: number) { db.delete(aufgaben).where(eq(aufgaben.id, id)).run(); }

  // Dokumente
  async getDokumenteByMandant(mandantId: number) { return db.select().from(dokumente).where(eq(dokumente.mandantId, mandantId)).orderBy(desc(dokumente.createdAt)).all(); }
  async getDokument(id: number) { return db.select().from(dokumente).where(eq(dokumente.id, id)).get(); }
  async createDokument(data: InsertDokument) { const now = new Date().toISOString(); return db.insert(dokumente).values({ ...data, createdAt: now, updatedAt: now }).returning().get(); }
  async updateDokument(id: number, data: Partial<InsertDokument>) { return db.update(dokumente).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(dokumente.id, id)).returning().get(); }
  async deleteDokument(id: number) { db.delete(dokumente).where(eq(dokumente.id, id)).run(); }

  async getInterneNotizenByMandant(mandantId: number) { return db.select().from(interneNotizen).where(eq(interneNotizen.mandantId, mandantId)).orderBy(desc(interneNotizen.updatedAt)).all(); }
  async getInterneNotiz(id: number) { return db.select().from(interneNotizen).where(eq(interneNotizen.id, id)).get(); }
  async createInterneNotiz(data: InsertInterneNotiz) { const now = new Date().toISOString(); return db.insert(interneNotizen).values({ ...data, createdAt: now, updatedAt: now }).returning().get(); }
  async updateInterneNotiz(id: number, data: Partial<InsertInterneNotiz>) { return db.update(interneNotizen).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(interneNotizen.id, id)).returning().get(); }
  async deleteInterneNotiz(id: number) { db.delete(interneNotizen).where(eq(interneNotizen.id, id)).run(); }

  // Stats
  async getStatsForMandant(mandantId: number) {
    return {
      vvt: db.select().from(vvt).where(eq(vvt.mandantId, mandantId)).all().length,
      avv: db.select().from(avv).where(eq(avv.mandantId, mandantId)).all().length,
      dsfa: db.select().from(dsfa).where(eq(dsfa.mandantId, mandantId)).all().length,
      datenpannen: db.select().from(datenpannen).where(eq(datenpannen.mandantId, mandantId)).all().length,
      dsr: db.select().from(dsr).where(eq(dsr.mandantId, mandantId)).all().length,
      tom: db.select().from(tom).where(eq(tom.mandantId, mandantId)).all().length,
      audits: db.select().from(audits).where(eq(audits.mandantId, mandantId)).all().length,
      loeschkonzept: db.select().from(loeschkonzept).where(eq(loeschkonzept.mandantId, mandantId)).all().length,
      aufgaben: db.select().from(aufgaben).where(eq(aufgaben.mandantId, mandantId)).all().length,
      offeneAufgaben: db.select().from(aufgaben).where(and(eq(aufgaben.mandantId, mandantId), eq(aufgaben.status, "offen"))).all().length,
      dokumente: db.select().from(dokumente).where(eq(dokumente.mandantId, mandantId)).all().length,
    };
  }
}

/**
 * LowDB-basierter Storage (JSON-Datei-Backend)
 * Implementiert dasselbe IStorage-Interface wie DatabaseStorage
 */
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import bcrypt from "bcryptjs";
import type { IStorage } from "./storage.js";
import type {
  Mandant, InsertMandant,
  MandantenGruppe, InsertMandantenGruppe,
  Vorlagenpaket, InsertVorlagenpaket,
  MandantenLog, InsertMandantenLog,
  VorlagenpaketHistorie, InsertVorlagenpaketHistorie,
  User, InsertUser,
  Vvt, InsertVvt,
  Avv, InsertAvv,
  Dsfa, InsertDsfa,
  Datenpanne, InsertDatenpanne,
  Dsr, InsertDsr,
  Tom, InsertTom,
  Audit, InsertAudit,
  Aufgabe, InsertAufgabe,
  Dokument, InsertDokument,
} from "@shared/schema";

interface DbSchema {
  meta: { nextId: Record<string, number> };
  mandanten: Mandant[];
  mandantenGruppen: MandantenGruppe[];
  vorlagenpakete: Vorlagenpaket[];
  mandantenLogs: MandantenLog[];
  vorlagenpaketHistorie: VorlagenpaketHistorie[];
  users: User[];
  vvt: Vvt[];
  avv: Avv[];
  dsfa: Dsfa[];
  datenpannen: Datenpanne[];
  dsr: Dsr[];
  tom: Tom[];
  audits: Audit[];
  aufgaben: Aufgabe[];
  dokumente: Dokument[];
}

const defaultData: DbSchema = {
  meta: { nextId: {} },
  mandanten: [],
  mandantenGruppen: [],
  vorlagenpakete: [
    {
      id: 1,
      name: "DSGVO Basispaket",
      beschreibung: "Grundpaket mit Leitlinien, Aufgaben und Basisdokumentation.",
      kategorie: "datenschutz",
      version: "1.0",
      aktiv: true,
      inhaltJson: JSON.stringify({
        aufgaben: [
          { titel: "Verzeichnis der Verarbeitungstätigkeiten prüfen", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "vvt" },
          { titel: "Datenschutzleitlinie abstimmen", typ: "milestone", prioritaet: "mittel", status: "offen", kategorie: "dokumente" }
        ],
        dokumente: [
          { titel: "Datenschutzleitlinie", kategorie: "leitlinie_datenschutz", status: "entwurf", version: "1.0" },
          { titel: "Verfahrensdokumentation Verarbeitungstätigkeiten", kategorie: "verfahrensdokumentation", status: "entwurf", version: "1.0" }
        ]
      }),
      createdAt: new Date().toISOString(),
    }
  ],
  mandantenLogs: [],
  vorlagenpaketHistorie: [],
  users: [],
  vvt: [],
  avv: [],
  dsfa: [],
  datenpannen: [],
  dsr: [],
  tom: [],
  audits: [],
  aufgaben: [],
  dokumente: [],
};

let _db: Low<DbSchema> | null = null;

async function getDb(): Promise<Low<DbSchema>> {
  if (_db) return _db;
  const dbDir = process.env.DATABASE_PATH
    ? path.dirname(process.env.DATABASE_PATH)
    : path.resolve("data");
  const jsonPath = path.join(dbDir, "privashield.json");
  const adapter = new JSONFile<DbSchema>(jsonPath);
  _db = new Low<DbSchema>(adapter, defaultData);
  await _db.read();
  // Merge defaults (in case new collections were added)
  _db.data = {
    ...defaultData,
    ..._db.data,
    meta: {
      ...defaultData.meta,
      ..._db.data?.meta,
      nextId: {
        ...defaultData.meta.nextId,
        ..._db.data?.meta?.nextId,
      },
    },
  };
  syncNextIds(_db);
  await _db.write();
  return _db;
}

function syncNextIds(db: Low<DbSchema>) {
  const collections: (keyof DbSchema)[] = [
    "mandanten",
    "mandantenGruppen",
    "vorlagenpakete",
    "mandantenLogs",
    "vorlagenpaketHistorie",
    "users",
    "vvt",
    "avv",
    "dsfa",
    "datenpannen",
    "dsr",
    "tom",
    "aufgaben",
    "dokumente",
  ];

  for (const col of collections) {
    const rows = db.data[col] as unknown as Array<{ id?: number }>;
    const maxId = rows.reduce((max, row) => Math.max(max, Number(row?.id || 0)), 0);
    db.data.meta.nextId[col as string] = Math.max(db.data.meta.nextId[col as string] ?? 0, maxId);
  }
}

function nextId(db: Low<DbSchema>, col: string): number {
  const cur = db.data.meta.nextId[col] ?? 0;
  const id = cur + 1;
  db.data.meta.nextId[col] = id;
  return id;
}

export class LowdbStorage implements IStorage {
  // ─── Users ───────────────────────────────────────────────────────────────
  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await getDb();
    return db.data.users.find((u) => u.email === email);
  }
  async getUserById(id: number): Promise<User | undefined> {
    const db = await getDb();
    return db.data.users.find((u) => u.id === id);
  }
  async createUser(data: InsertUser & { password?: string }): Promise<User> {
    const db = await getDb();
    const { password, ...rest } = data as any;
    const passwordHash = await bcrypt.hash(password || "", 12);
    const user: User = {
      id: nextId(db, "users"),
      email: rest.email,
      name: rest.name,
      role: rest.role ?? "user",
      passwordHash,
      mandantIds: rest.mandantIds ?? "[]",
      aktiv: true,
      createdAt: new Date().toISOString(),
    };
    db.data.users.push(user);
    await db.write();
    return user;
  }
  async getAllUsers(): Promise<User[]> {
    const db = await getDb();
    return db.data.users;
  }
  async updateUser(id: number, data: Partial<InsertUser> & { password?: string }): Promise<User | undefined> {
    const db = await getDb();
    const idx = db.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    const { password, ...rest } = data as any;
    const updates: any = { ...rest };
    if (password) updates.passwordHash = await bcrypt.hash(password, 12);
    db.data.users[idx] = { ...db.data.users[idx], ...updates };
    await db.write();
    return db.data.users[idx];
  }
  async deleteUser(id: number): Promise<void> {
    const db = await getDb();
    db.data.users = db.data.users.filter((u) => u.id !== id);
    await db.write();
  }

  // ─── Mandanten ───────────────────────────────────────────────────────────
  async getMandanten(): Promise<Mandant[]> {
    const db = await getDb();
    return db.data.mandanten;
  }
  async getMandant(id: number): Promise<Mandant | undefined> {
    const db = await getDb();
    return db.data.mandanten.find((m) => m.id === id);
  }
  async createMandant(data: InsertMandant): Promise<Mandant> {
    const db = await getDb();
    const item: Mandant = { id: nextId(db, "mandanten"), ...data as any, createdAt: new Date().toISOString() };
    db.data.mandanten.push(item);
    db.data.mandantenLogs.push({
      id: nextId(db, "mandantenLogs"),
      mandantId: item.id,
      zeitpunkt: new Date().toISOString(),
      userId: null as any,
      userName: "System",
      aktion: "mandant_erstellt",
      modul: "mandanten",
      entitaetTyp: "mandant",
      entitaetId: item.id,
      beschreibung: `Mandant '${item.name}' wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    await db.write();
    return item;
  }
  async updateMandant(id: number, data: Partial<InsertMandant>): Promise<Mandant | undefined> {
    const db = await getDb();
    const idx = db.data.mandanten.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    const vorher = db.data.mandanten[idx];
    db.data.mandanten[idx] = { ...db.data.mandanten[idx], ...data as any };
    db.data.mandantenLogs.push({
      id: nextId(db, "mandantenLogs"),
      mandantId: id,
      zeitpunkt: new Date().toISOString(),
      userId: null as any,
      userName: "System",
      aktion: "mandant_aktualisiert",
      modul: "mandanten",
      entitaetTyp: "mandant",
      entitaetId: id,
      beschreibung: `Mandant '${db.data.mandanten[idx].name}' wurde aktualisiert.`,
      detailsJson: JSON.stringify({ vorher, nachher: db.data.mandanten[idx] }),
    });
    await db.write();
    return db.data.mandanten[idx];
  }
  async deleteMandant(id: number): Promise<void> {
    const db = await getDb();
    db.data.mandanten = db.data.mandanten.filter((m) => m.id !== id);
    await db.write();
  }

  // ─── Mandantengruppen ─────────────────────────────────────────────────────
  async getMandantenGruppen(): Promise<MandantenGruppe[]> {
    const db = await getDb();
    return db.data.mandantenGruppen;
  }
  async getMandantenGruppe(id: number): Promise<MandantenGruppe | undefined> {
    const db = await getDb();
    return db.data.mandantenGruppen.find((g) => g.id === id);
  }
  async createMandantenGruppe(data: InsertMandantenGruppe): Promise<MandantenGruppe> {
    const db = await getDb();
    const item: MandantenGruppe = { id: nextId(db, "mandantenGruppen"), ...data as any, createdAt: new Date().toISOString() };
    db.data.mandantenGruppen.push(item);
    await db.write();
    return item;
  }
  async updateMandantenGruppe(id: number, data: Partial<InsertMandantenGruppe>): Promise<MandantenGruppe | undefined> {
    const db = await getDb();
    const idx = db.data.mandantenGruppen.findIndex((g) => g.id === id);
    if (idx === -1) return undefined;
    db.data.mandantenGruppen[idx] = { ...db.data.mandantenGruppen[idx], ...data as any };
    await db.write();
    return db.data.mandantenGruppen[idx];
  }
  async deleteMandantenGruppe(id: number): Promise<void> {
    const db = await getDb();
    db.data.mandantenGruppen = db.data.mandantenGruppen.filter((g) => g.id !== id);
    await db.write();
  }

  // ─── Vorlagenpakete ───────────────────────────────────────────────────────
  async getVorlagenpakete(): Promise<Vorlagenpaket[]> {
    const db = await getDb();
    return db.data.vorlagenpakete;
  }
  async getVorlagenpaket(id: number): Promise<Vorlagenpaket | undefined> {
    const db = await getDb();
    return db.data.vorlagenpakete.find((p) => p.id === id);
  }
  async createVorlagenpaket(data: InsertVorlagenpaket): Promise<Vorlagenpaket> {
    const db = await getDb();
    const item: Vorlagenpaket = { id: nextId(db, "vorlagenpakete"), ...data as any, createdAt: new Date().toISOString() };
    db.data.vorlagenpakete.push(item);
    await db.write();
    return item;
  }
  async updateVorlagenpaket(id: number, data: Partial<InsertVorlagenpaket>): Promise<Vorlagenpaket | undefined> {
    const db = await getDb();
    const idx = db.data.vorlagenpakete.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    db.data.vorlagenpakete[idx] = { ...db.data.vorlagenpakete[idx], ...data as any };
    await db.write();
    return db.data.vorlagenpakete[idx];
  }
  async deleteVorlagenpaket(id: number): Promise<void> {
    const db = await getDb();
    db.data.vorlagenpakete = db.data.vorlagenpakete.filter((p) => p.id !== id);
    await db.write();
  }
  async applyVorlagenpaketToMandant(mandantId: number, paketId: number, user?: { id?: number; name?: string }): Promise<{ ok: true; created: Record<string, number> }> {
    const db = await getDb();
    const paket = db.data.vorlagenpakete.find((p) => p.id === paketId);
    if (!paket) throw new Error("Vorlagenpaket nicht gefunden");
    const inhalt = JSON.parse(paket.inhaltJson || "{}");
    let aufgabenCount = 0;
    let dokumenteCount = 0;
    for (const a of inhalt.aufgaben || []) {
      (db.data.aufgaben as Aufgabe[]).push({
        id: nextId(db, "aufgaben"),
        mandantId,
        titel: a.titel,
        beschreibung: a.beschreibung || "",
        typ: a.typ || "task",
        prioritaet: a.prioritaet || "mittel",
        status: a.status || "offen",
        fortschritt: a.fortschritt || 0,
        verantwortlicher: a.verantwortlicher || "",
        startDatum: a.startDatum || null as any,
        faelligAm: a.faelligAm || null as any,
        abgeschlossenAm: null as any,
        kategorie: a.kategorie || "sonstige",
        referenzId: null as any,
        parentTaskId: null as any,
        sortierung: a.sortierung || 0,
        vorlagenBezug: paket.name,
        createdAt: new Date().toISOString(),
      });
      aufgabenCount++;
    }
    for (const d of inhalt.dokumente || []) {
      (db.data.dokumente as Dokument[]).push({
        id: nextId(db, "dokumente"),
        mandantId,
        titel: d.titel,
        kategorie: d.kategorie || "vorlage",
        beschreibung: d.beschreibung || "",
        dokumentTyp: d.dokumentTyp || "vorlage",
        dateiname: d.dateiname || "",
        version: d.version || "1.0",
        status: d.status || "entwurf",
        gueltigBis: null as any,
        verantwortlicher: d.verantwortlicher || "",
        freigegebenVon: null as any,
        freigegebenAm: null as any,
        naechstePruefungAm: null as any,
        inhalt: d.inhalt || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      dokumenteCount++;
    }
    db.data.mandantenLogs.push({
      id: nextId(db, "mandantenLogs"),
      mandantId,
      zeitpunkt: new Date().toISOString(),
      userId: user?.id ?? null as any,
      userName: user?.name ?? "System",
      aktion: "vorlagenpaket_zugewiesen",
      modul: "vorlagenpakete",
      entitaetTyp: "vorlagenpaket",
      entitaetId: paketId,
      beschreibung: `Vorlagenpaket '${paket.name}' wurde angewendet.`,
      detailsJson: JSON.stringify({ paketId, paketName: paket.name, created: { aufgaben: aufgabenCount, dokumente: dokumenteCount } }),
    });
    db.data.vorlagenpaketHistorie.push({
      id: nextId(db, "vorlagenpaketHistorie"),
      mandantId,
      paketId,
      paketName: paket.name,
      paketVersion: paket.version || "1.0",
      angewendetAm: new Date().toISOString(),
      angewendetVon: user?.name ?? "System",
      detailsJson: JSON.stringify({ created: { aufgaben: aufgabenCount, dokumente: dokumenteCount } }),
    });
    await db.write();
    return { ok: true, created: { aufgaben: aufgabenCount, dokumente: dokumenteCount } };
  }

  // ─── Mandanten-Logs ───────────────────────────────────────────────────────
  async getMandantenLogs(mandantId: number): Promise<MandantenLog[]> {
    const db = await getDb();
    return db.data.mandantenLogs.filter((l) => l.mandantId === mandantId).sort((a, b) => ((a.zeitpunkt || "") < (b.zeitpunkt || "") ? 1 : -1));
  }
  async createMandantenLog(data: InsertMandantenLog): Promise<MandantenLog> {
    const db = await getDb();
    const item: MandantenLog = { id: nextId(db, "mandantenLogs"), ...data as any, zeitpunkt: new Date().toISOString() };
    db.data.mandantenLogs.push(item);
    await db.write();
    return item;
  }

  async getVorlagenpaketHistorie(mandantId: number): Promise<VorlagenpaketHistorie[]> {
    const db = await getDb();
    return db.data.vorlagenpaketHistorie.filter((h) => h.mandantId === mandantId).sort((a, b) => ((a.angewendetAm || "") < (b.angewendetAm || "") ? 1 : -1));
  }
  async createVorlagenpaketHistorie(data: InsertVorlagenpaketHistorie): Promise<VorlagenpaketHistorie> {
    const db = await getDb();
    const item: VorlagenpaketHistorie = { id: nextId(db, "vorlagenpaketHistorie"), ...data as any, angewendetAm: new Date().toISOString() };
    db.data.vorlagenpaketHistorie.push(item);
    await db.write();
    return item;
  }

  // ─── Generic helper ──────────────────────────────────────────────────────
  private async _getAll<T extends { mandantId: number }>(col: keyof DbSchema, mandantId: number): Promise<T[]> {
    const db = await getDb();
    return (db.data[col] as unknown as T[]).filter((x) => x.mandantId === mandantId);
  }
  private async _getOne<T extends { id: number }>(col: keyof DbSchema, id: number): Promise<T | undefined> {
    const db = await getDb();
    return (db.data[col] as unknown as T[]).find((x) => x.id === id);
  }
  private async _create<T extends { id: number }>(col: keyof DbSchema, data: any, extra?: any): Promise<T> {
    const db = await getDb();
    const now = new Date().toISOString();
    const item: T = { id: nextId(db, col as string), ...data, createdAt: now, updatedAt: now, ...extra };
    (db.data[col] as unknown as T[]).push(item);
    await db.write();
    return item;
  }
  private async _update<T extends { id: number }>(col: keyof DbSchema, id: number, data: any): Promise<T | undefined> {
    const db = await getDb();
    const arr = db.data[col] as unknown as T[];
    const idx = arr.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    arr[idx] = { ...arr[idx], ...data, updatedAt: new Date().toISOString() };
    await db.write();
    return arr[idx];
  }
  private async _delete(col: keyof DbSchema, id: number): Promise<void> {
    const db = await getDb();
    (db.data[col] as unknown as any[]) = (db.data[col] as unknown as any[]).filter((x: any) => x.id !== id);
    await db.write();
  }

  // ─── VVT ─────────────────────────────────────────────────────────────────
  async getVvtByMandant(mandantId: number) { return this._getAll<Vvt>("vvt", mandantId); }
  async getVvt(id: number) { return this._getOne<Vvt>("vvt", id); }
  async createVvt(data: InsertVvt) { return this._create<Vvt>("vvt", data); }
  async updateVvt(id: number, data: Partial<InsertVvt>) { return this._update<Vvt>("vvt", id, data); }
  async deleteVvt(id: number) { return this._delete("vvt", id); }

  // ─── AVV ─────────────────────────────────────────────────────────────────
  async getAvvByMandant(mandantId: number) { return this._getAll<Avv>("avv", mandantId); }
  async getAvv(id: number) { return this._getOne<Avv>("avv", id); }
  async createAvv(data: InsertAvv) { return this._create<Avv>("avv", data); }
  async updateAvv(id: number, data: Partial<InsertAvv>) { return this._update<Avv>("avv", id, data); }
  async deleteAvv(id: number) { return this._delete("avv", id); }

  // ─── DSFA ────────────────────────────────────────────────────────────────
  async getDsfaByMandant(mandantId: number) { return this._getAll<Dsfa>("dsfa", mandantId); }
  async getDsfa(id: number) { return this._getOne<Dsfa>("dsfa", id); }
  async createDsfa(data: InsertDsfa) { return this._create<Dsfa>("dsfa", data); }
  async updateDsfa(id: number, data: Partial<InsertDsfa>) { return this._update<Dsfa>("dsfa", id, data); }
  async deleteDsfa(id: number) { return this._delete("dsfa", id); }

  // ─── Datenpannen ─────────────────────────────────────────────────────────
  async getDatenpannenByMandant(mandantId: number) { return this._getAll<Datenpanne>("datenpannen", mandantId); }
  async getDatenpanne(id: number) { return this._getOne<Datenpanne>("datenpannen", id); }
  async createDatenpanne(data: InsertDatenpanne) { return this._create<Datenpanne>("datenpannen", data); }
  async updateDatenpanne(id: number, data: Partial<InsertDatenpanne>) { return this._update<Datenpanne>("datenpannen", id, data); }
  async deleteDatenpanne(id: number) { return this._delete("datenpannen", id); }

  // ─── DSR ─────────────────────────────────────────────────────────────────
  async getDsrByMandant(mandantId: number) { return this._getAll<Dsr>("dsr", mandantId); }
  async getDsr(id: number) { return this._getOne<Dsr>("dsr", id); }
  async createDsr(data: InsertDsr) { return this._create<Dsr>("dsr", data); }
  async updateDsr(id: number, data: Partial<InsertDsr>) { return this._update<Dsr>("dsr", id, data); }
  async deleteDsr(id: number) { return this._delete("dsr", id); }

  // ─── TOM ─────────────────────────────────────────────────────────────────
  async getTomByMandant(mandantId: number) { return this._getAll<Tom>("tom", mandantId); }
  async getTom(id: number) { return this._getOne<Tom>("tom", id); }
  async createTom(data: InsertTom) { return this._create<Tom>("tom", data); }
  async updateTom(id: number, data: Partial<InsertTom>) { return this._update<Tom>("tom", id, data); }
  async deleteTom(id: number) { return this._delete("tom", id); }

  // ─── Audit ────────────────────────────────────────────────────────────────
  async getAuditsByMandant(mandantId: number) { return this._getAll<Audit>("audits", mandantId); }
  async getAudit(id: number) { return this._getOne<Audit>("audits", id); }
  async createAudit(data: InsertAudit) { return this._create<Audit>("audits", data); }
  async updateAudit(id: number, data: Partial<InsertAudit>) { return this._update<Audit>("audits", id, data); }
  async deleteAudit(id: number) { return this._delete("audits", id); }

  // ─── Aufgaben ─────────────────────────────────────────────────────────────
  async getAufgabenByMandant(mandantId: number) { return this._getAll<Aufgabe>("aufgaben", mandantId); }
  async getAufgabe(id: number) { return this._getOne<Aufgabe>("aufgaben", id); }
  async createAufgabe(data: InsertAufgabe) { return this._create<Aufgabe>("aufgaben", data); }
  async updateAufgabe(id: number, data: Partial<InsertAufgabe>) { return this._update<Aufgabe>("aufgaben", id, data); }
  async deleteAufgabe(id: number) { return this._delete("aufgaben", id); }

  // ─── Dokumente ────────────────────────────────────────────────────────────
  async getDokumenteByMandant(mandantId: number) { return this._getAll<Dokument>("dokumente", mandantId); }
  async getDokument(id: number) { return this._getOne<Dokument>("dokumente", id); }
  async createDokument(data: InsertDokument) { return this._create<Dokument>("dokumente", data); }
  async updateDokument(id: number, data: Partial<InsertDokument>) { return this._update<Dokument>("dokumente", id, data); }
  async deleteDokument(id: number) { return this._delete("dokumente", id); }

  // ─── Stats ────────────────────────────────────────────────────────────────
  async getStatsForMandant(mandantId: number): Promise<Record<string, number>> {
    const db = await getDb();
    const f = (col: keyof DbSchema) => (db.data[col] as any[]).filter((x: any) => x.mandantId === mandantId).length;
    return {
      vvt: f("vvt"),
      avv: f("avv"),
      dsfa: f("dsfa"),
      datenpannen: f("datenpannen"),
      dsr: f("dsr"),
      tom: f("tom"),
      audits: f("audits"),
      aufgaben: f("aufgaben"),
      offeneAufgaben: (db.data.aufgaben as Aufgabe[]).filter((x) => x.mandantId === mandantId && x.status === "offen").length,
      dokumente: f("dokumente"),
    };
  }
}

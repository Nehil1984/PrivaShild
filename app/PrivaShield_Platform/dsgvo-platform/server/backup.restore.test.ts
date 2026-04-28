import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

const originalStorageModulePath = path.resolve(import.meta.dirname, "storage.ts");
const originalStorageModuleSource = fs.readFileSync(originalStorageModulePath, "utf8");

const sampleLowdb = {
  meta: { nextId: { users: 1, mandanten: 1, vvt: 1 } },
  mandanten: [{ id: 1, name: "Test GmbH", rechtsform: "GmbH", anschrift: "Musterweg 1", branche: "IT", aktiv: true, createdAt: "2026-04-01T10:00:00.000Z" }],
  mandantenGruppen: [],
  vorlagenpakete: [],
  mandantenLogs: [],
  vorlagenpaketHistorie: [],
  users: [{ id: 1, email: "admin@test.de", passwordHash: "$2b$12$abcdefghijklmnopqrstuvABCDEFGHIJKLMN0123456789abcd", name: "Admin", role: "admin", mandantIds: "[1]", aktiv: true, failedLoginAttempts: 2, temporaryLockUntil: null, adminLocked: false, adminLockedAt: null, lastFailedLoginAt: "2026-04-01T11:00:00.000Z", createdAt: "2026-04-01T10:00:00.000Z" }],
  vvt: [{ id: 1, mandantId: 1, bezeichnung: "Mitarbeiterverwaltung", zweck: "HR", rechtsgrundlage: "Art. 6", datenkategorien: "[]", betroffenePersonen: "[]", empfaenger: "", drittlandtransfer: false, loeschfrist: "", loeschklasse: "", aufbewahrungsgrund: "", tomHinweis: "", verantwortlicher: "", verantwortlicherEmail: "", verantwortlicherTelefon: "", status: "aktiv", dsfa: false, createdAt: "2026-04-01T10:00:00.000Z", updatedAt: "2026-04-01T10:00:00.000Z" }],
  avv: [], dsfa: [], datenpannen: [], dsr: [], tom: [], aufgaben: [], dokumente: [], loeschkonzept: [], audits: [], pdca: [], interneNotizen: []
};

describe("backup restore migration", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "privashield-restore-"));
    process.env.DATABASE_PATH = path.join(tmpDir, "privashield.db");
    fs.writeFileSync(
      originalStorageModulePath,
      originalStorageModuleSource.replace(
        '    throw new Error("SQLite backend bootstrap requires built server artifacts in this runtime. Use lowdb at startup or switch backend via the admin API after boot.");',
        '    const { DatabaseStorage } = await import("./storage-sqlite.js");\n    return new DatabaseStorage();',
      ).replace('function createStorage(): IStorage {', 'async function createStorage(): Promise<IStorage> {')
       .replace('export let storage: IStorage = createStorage();', 'export let storage: IStorage;\n\nawait createStorage().then((instance) => { storage = instance; });')
       .replace('  storage = createStorage();', '  storage = await createStorage();'),
      "utf8",
    );
    const { writeDbBackend } = await import("./db-config");
    writeDbBackend("sqlite");
  });

  afterEach(() => {
    fs.writeFileSync(originalStorageModulePath, originalStorageModuleSource, "utf8");
  });

  it("migriert ein lowdb-backup in sqlite inklusive user-hash und ids", async () => {
    const { restoreUploadedBackup } = await import("./backup");
    const payload = Buffer.from(`PSMETA1\n${JSON.stringify({ backend: "lowdb", createdAt: new Date().toISOString(), sourceFile: "privashield.json" })}\n${JSON.stringify(sampleLowdb)}`, "utf8");

    const result = await restoreUploadedBackup("backup-daily-test.bak", payload);
    expect(result.migrated).toBe(true);
    expect(result.migratedFrom).toBe("lowdb");
    expect(result.migratedTo).toBe("sqlite");

    const { db } = await import("./db");
    const schema = await import("@shared/schema");
    const users = db.select().from(schema.users).all();
    const mandanten = db.select().from(schema.mandanten).all();
    const vvts = db.select().from(schema.vvt).all();

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(1);
    expect(users[0].email).toBe("admin@test.de");
    expect(users[0].passwordHash).toContain("$2b$");
    expect(users[0].failedLoginAttempts).toBe(2);
    expect(users[0].lastFailedLoginAt).toBe("2026-04-01T11:00:00.000Z");
    expect(mandanten).toHaveLength(1);
    expect(mandanten[0].id).toBe(1);
    expect(vvts).toHaveLength(1);
    expect(vvts[0].id).toBe(1);
    expect(vvts[0].mandantId).toBe(1);
  });
});

// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const passwordSchema = z.string()
  .min(12, "Passwort muss mindestens 12 Zeichen lang sein")
  .regex(/[a-z]/, "Passwort muss mindestens einen Kleinbuchstaben enthalten")
  .regex(/[A-Z]/, "Passwort muss mindestens einen Großbuchstaben enthalten")
  .regex(/[0-9]/, "Passwort muss mindestens eine Zahl enthalten")
  .regex(/[^A-Za-z0-9]/, "Passwort muss mindestens ein Sonderzeichen enthalten");

// ─── Mandanten ────────────────────────────────────────────────────────────────
export const mandanten = sqliteTable("mandanten", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  rechtsform: text("rechtsform"),
  anschrift: text("anschrift"),
  branche: text("branche"),
  branchen: text("branchen").default("[]"),
  webseite: text("webseite"),
  dsb: text("dsb"),
  dsbEmail: text("dsb_email"),
  dsbTelefon: text("dsb_telefon"),
  verantwortlicherName: text("verantwortlicher_name"),
  verantwortlicherEmail: text("verantwortlicher_email"),
  verantwortlicherTelefon: text("verantwortlicher_telefon"),
  datenschutzmanagerName: text("datenschutzmanager_name"),
  datenschutzmanagerEmail: text("datenschutzmanager_email"),
  datenschutzmanagerTelefon: text("datenschutzmanager_telefon"),
  itVerantwortlicherName: text("it_verantwortlicher_name"),
  itVerantwortlicherEmail: text("it_verantwortlicher_email"),
  itVerantwortlicherTelefon: text("it_verantwortlicher_telefon"),
  isbName: text("isb_name"),
  isbEmail: text("isb_email"),
  isbTelefon: text("isb_telefon"),
  webseitenbetreuerName: text("webseitenbetreuer_name"),
  webseitenbetreuerEmail: text("webseitenbetreuer_email"),
  webseitenbetreuerTelefon: text("webseitenbetreuer_telefon"),
  gruppenOrganisation: integer("gruppen_organisation", { mode: "boolean" }).default(false),
  gruppeId: integer("gruppe_id"),
  notizen: text("notizen"),
  aktiv: integer("aktiv", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(new Date().toISOString()),
});
export const insertMandantSchema = createInsertSchema(mandanten).omit({ id: true, createdAt: true }).extend({
  name: z.string().trim().min(1, "Name ist erforderlich"),
});
export type InsertMandant = z.infer<typeof insertMandantSchema>;
export type Mandant = typeof mandanten.$inferSelect;

// ─── Mandantengruppen ───────────────────────────────────────────────────────
export const mandantenGruppen = sqliteTable("mandanten_gruppen", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  beschreibung: text("beschreibung"),
  typ: text("typ").default("sonstige"), // konzern | holding | standort | fachbereich | sonstige
  parentGroupId: integer("parent_group_id"),
  createdAt: text("created_at").default(new Date().toISOString()),
});
export const insertMandantenGruppeSchema = createInsertSchema(mandantenGruppen).omit({ id: true, createdAt: true }).extend({
  name: z.string().trim().min(1, "Name ist erforderlich"),
});
export type InsertMandantenGruppe = z.infer<typeof insertMandantenGruppeSchema>;
export type MandantenGruppe = typeof mandantenGruppen.$inferSelect;

// ─── Vorlagenpakete ─────────────────────────────────────────────────────────
export const vorlagenpakete = sqliteTable("vorlagenpakete", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  beschreibung: text("beschreibung"),
  kategorie: text("kategorie").default("allgemein"),
  version: text("version").default("1.0"),
  aktiv: integer("aktiv", { mode: "boolean" }).default(true),
  inhaltJson: text("inhalt_json").default("{}"),
  createdAt: text("created_at").default(new Date().toISOString()),
});
export const insertVorlagenpaketSchema = createInsertSchema(vorlagenpakete).omit({ id: true, createdAt: true }).extend({
  name: z.string().trim().min(1, "Name ist erforderlich"),
});
export type InsertVorlagenpaket = z.infer<typeof insertVorlagenpaketSchema>;
export type Vorlagenpaket = typeof vorlagenpakete.$inferSelect;

// ─── Mandanten-Logs ─────────────────────────────────────────────────────────
export const mandantenLogs = sqliteTable("mandanten_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  zeitpunkt: text("zeitpunkt").default(new Date().toISOString()),
  userId: integer("user_id"),
  userName: text("user_name"),
  aktion: text("aktion").notNull(),
  modul: text("modul"),
  entitaetTyp: text("entitaet_typ"),
  entitaetId: integer("entitaet_id"),
  beschreibung: text("beschreibung"),
  detailsJson: text("details_json").default("{}"),
});
export const insertMandantenLogSchema = createInsertSchema(mandantenLogs).omit({ id: true, zeitpunkt: true });
export type InsertMandantenLog = z.infer<typeof insertMandantenLogSchema>;
export type MandantenLog = typeof mandantenLogs.$inferSelect;

// ─── Vorlagenpaket-Historie ────────────────────────────────────────────────
export const vorlagenpaketHistorie = sqliteTable("vorlagenpaket_historie", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  paketId: integer("paket_id").notNull(),
  paketName: text("paket_name").notNull(),
  paketVersion: text("paket_version"),
  angewendetAm: text("angewendet_am").default(new Date().toISOString()),
  angewendetVon: text("angewendet_von"),
  detailsJson: text("details_json").default("{}"),
});
export const insertVorlagenpaketHistorieSchema = createInsertSchema(vorlagenpaketHistorie).omit({ id: true, angewendetAm: true });
export type InsertVorlagenpaketHistorie = z.infer<typeof insertVorlagenpaketHistorieSchema>;
export type VorlagenpaketHistorie = typeof vorlagenpaketHistorie.$inferSelect;

// ─── Benutzer ─────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // admin | dsb | user
  mandantIds: text("mandant_ids").default("[]"), // JSON array of mandant IDs
  aktiv: integer("aktiv", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(new Date().toISOString()),
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true, passwordHash: true, createdAt: true }).extend({
  password: passwordSchema,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── VVT (Verzeichnis der Verarbeitungstätigkeiten) ──────────────────────────
export const vvt = sqliteTable("vvt", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  bezeichnung: text("bezeichnung").notNull(),
  zweck: text("zweck"),
  rechtsgrundlage: text("rechtsgrundlage"),
  datenkategorien: text("datenkategorien").default("[]"), // JSON
  betroffenePersonen: text("betroffene_personen").default("[]"), // JSON
  empfaenger: text("empfaenger"),
  drittlandtransfer: integer("drittlandtransfer", { mode: "boolean" }).default(false),
  loeschfrist: text("loeschfrist"),
  loeschklasse: text("loeschklasse"),
  aufbewahrungsgrund: text("aufbewahrungsgrund"),
  tomHinweis: text("tom_hinweis"),
  verantwortlicher: text("verantwortlicher"),
  verantwortlicherEmail: text("verantwortlicher_email"),
  verantwortlicherTelefon: text("verantwortlicher_telefon"),
  status: text("status").default("aktiv"), // aktiv | entwurf | archiviert
  dsfa: integer("dsfa", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});
export const insertVvtSchema = createInsertSchema(vvt).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  bezeichnung: z.string().trim().min(1, "Bezeichnung ist erforderlich"),
});
export const requestVvtSchema = insertVvtSchema.omit({ mandantId: true });
export type InsertVvt = z.infer<typeof insertVvtSchema>;
export type Vvt = typeof vvt.$inferSelect;

// ─── AVV ─────────────────────────────────────────────────────────────────────
export const avv = sqliteTable("avv", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  auftragsverarbeiter: text("auftragsverarbeiter").notNull(),
  gegenstand: text("gegenstand"),
  vertragsdatum: text("vertragsdatum"),
  laufzeit: text("laufzeit"),
  status: text("status").default("aktiv"), // entwurf | aktiv | gekündigt | abgelaufen
  sccs: integer("sccs", { mode: "boolean" }).default(false),
  subauftragnehmer: text("subauftragnehmer").default("[]"), // JSON
  avKontaktName: text("av_kontakt_name"),
  avKontaktEmail: text("av_kontakt_email"),
  avKontaktTelefon: text("av_kontakt_telefon"),
  genehmigteSubdienstleister: text("genehmigte_subdienstleister").default("[]"),
  pruefFaellig: text("pruef_faellig"),
  notizen: text("notizen"),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});
export const insertAvvSchema = createInsertSchema(avv).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  auftragsverarbeiter: z.string().trim().min(1, "Auftragsverarbeiter ist erforderlich"),
});
export const requestAvvSchema = insertAvvSchema.omit({ mandantId: true });
export type InsertAvv = z.infer<typeof insertAvvSchema>;
export type Avv = typeof avv.$inferSelect;

// ─── DSFA ─────────────────────────────────────────────────────────────────────
export const dsfa = sqliteTable("dsfa", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  titel: text("titel").notNull(),
  vvtId: integer("vvt_id"),
  beschreibung: text("beschreibung"),
  notwendigkeit: text("notwendigkeit"),
  risiken: text("risiken").default("[]"), // JSON [{beschreibung, eintritt, schwere, massnahme}]
  massnahmen: text("massnahmen"),
  ergebnis: text("ergebnis"), // akzeptabel | nicht_akzeptabel | bedingt
  konsultation: integer("konsultation", { mode: "boolean" }).default(false),
  status: text("status").default("entwurf"), // entwurf | abgeschlossen | überprüfung
  reviewer: text("reviewer"),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});
export const insertDsfaSchema = createInsertSchema(dsfa).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  titel: z.string().trim().min(1, "Titel ist erforderlich"),
});
export const requestDsfaSchema = insertDsfaSchema.omit({ mandantId: true });
export type InsertDsfa = z.infer<typeof insertDsfaSchema>;
export type Dsfa = typeof dsfa.$inferSelect;

// ─── Datenpannen ─────────────────────────────────────────────────────────────
export const datenpannen = sqliteTable("datenpannen", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  titel: text("titel").notNull(),
  beschreibung: text("beschreibung"),
  entdecktAm: text("entdeckt_am").notNull(),
  entdecktUm: text("entdeckt_um"),
  gemeldetAm: text("gemeldet_am"),
  gemeldetUm: text("gemeldet_um"),
  frist72h: text("frist_72h"),
  betroffenePersonen: integer("betroffene_personen").default(0),
  datenkategorien: text("datenkategorien").default("[]"), // JSON
  ursache: text("ursache"),
  massnahmen: text("massnahmen"),
  meldepflichtig: integer("meldepflichtig", { mode: "boolean" }).default(false),
  behoerdeMeldung: text("behoerde_meldung"), // Datum der Meldung
  betroffenInformiert: integer("betroffen_informiert", { mode: "boolean" }).default(false),
  status: text("status").default("offen"), // offen | gemeldet | abgeschlossen
  schwere: text("schwere").default("niedrig"), // niedrig | mittel | hoch | kritisch
  createdAt: text("created_at").default(new Date().toISOString()),
});
export const insertDatenpanneSchema = createInsertSchema(datenpannen).omit({ id: true, createdAt: true }).extend({
  titel: z.string().trim().min(1, "Titel ist erforderlich"),
  entdecktAm: z.string().trim().min(1, "Entdeckt-Am ist erforderlich"),
});
export const requestDatenpanneSchema = insertDatenpanneSchema.omit({ mandantId: true });
export type InsertDatenpanne = z.infer<typeof insertDatenpanneSchema>;
export type Datenpanne = typeof datenpannen.$inferSelect;

// ─── DSR (Betroffenenrechte) ──────────────────────────────────────────────────
export const dsr = sqliteTable("dsr", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  art: text("art").notNull(), // auskunft | berichtigung | loeschung | einschraenkung | portabilitaet | widerspruch
  antragsteller: text("antragsteller"),
  eingangsdatum: text("eingangsdatum").notNull(),
  fristDatum: text("frist_datum"),
  beschreibung: text("beschreibung"),
  status: text("status").default("offen"), // offen | in_bearbeitung | abgeschlossen | abgelehnt
  antwortDatum: text("antwort_datum"),
  notizen: text("notizen"),
  createdAt: text("created_at").default(new Date().toISOString()),
});
export const insertDsrSchema = createInsertSchema(dsr).omit({ id: true, createdAt: true }).extend({
  art: z.string().trim().min(1, "Art ist erforderlich"),
  eingangsdatum: z.string().trim().min(1, "Eingangsdatum ist erforderlich"),
});
export const requestDsrSchema = insertDsrSchema.omit({ mandantId: true });
export type InsertDsr = z.infer<typeof insertDsrSchema>;
export type Dsr = typeof dsr.$inferSelect;

// ─── TOM-Katalog ──────────────────────────────────────────────────────────────
export const tom = sqliteTable("tom", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  kategorie: text("kategorie").notNull(), // zutrittskontrolle | zugangskontrolle | zugriffskontrolle | weitergabe | eingabe | auftrag | verfuegbarkeit | trennung
  massnahme: text("massnahme").notNull(),
  beschreibung: text("beschreibung"),
  status: text("status").default("implementiert"), // geplant | implementiert | überprüft
  verantwortlicher: text("verantwortlicher"),
  pruefDatum: text("pruef_datum"),
  pruefintervall: text("pruefintervall"),
  schutzziel: text("schutzziel"),
  nachweis: text("nachweis"),
  wirksamkeit: text("wirksamkeit"),
  notizen: text("notizen"),
  createdAt: text("created_at").default(new Date().toISOString()),
});
export const insertTomSchema = createInsertSchema(tom).omit({ id: true, createdAt: true }).extend({
  kategorie: z.string().trim().min(1, "Kategorie ist erforderlich"),
  massnahme: z.string().trim().min(1, "Maßnahme ist erforderlich"),
});
export const requestTomSchema = insertTomSchema.omit({ mandantId: true });
export type InsertTom = z.infer<typeof insertTomSchema>;
export type Tom = typeof tom.$inferSelect;

// ─── Löschkonzept ──────────────────────────────────────────────────────────────
export const loeschkonzept = sqliteTable("loeschkonzept", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  bezeichnung: text("bezeichnung").notNull(),
  datenart: text("datenart"),
  loeschklasse: text("loeschklasse").notNull(),
  fristKategorie: text("frist_kategorie"),
  gesetzlicheFrist: text("gesetzliche_frist"),
  quelleVvtId: integer("quelle_vvt_id"),
  quelleVvtBezeichnung: text("quelle_vvt_bezeichnung"),
  aufbewahrungsfrist: text("aufbewahrungsfrist"),
  loeschereignis: text("loeschereignis"),
  rechtsgrundlage: text("rechtsgrundlage"),
  systeme: text("systeme"),
  verantwortlicher: text("verantwortlicher"),
  loeschverantwortlicher: text("loeschverantwortlicher"),
  kontrolle: text("kontrolle"),
  nachweis: text("nachweis"),
  status: text("status").default("aktiv"),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});
export const insertLoeschkonzeptSchema = createInsertSchema(loeschkonzept).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  bezeichnung: z.string().trim().min(1, "Bezeichnung ist erforderlich"),
  loeschklasse: z.string().trim().min(1, "Löschklasse ist erforderlich"),
});
export const requestLoeschkonzeptSchema = insertLoeschkonzeptSchema.omit({ mandantId: true });
export type InsertLoeschkonzept = z.infer<typeof insertLoeschkonzeptSchema>;
export type Loeschkonzept = typeof loeschkonzept.$inferSelect;

// ─── Audit / interne Audits ───────────────────────────────────────────────────
export const audits = sqliteTable("audits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  titel: text("titel").notNull(),
  auditart: text("auditart").default("intern"),
  pruefbereich: text("pruefbereich"),
  auditdatum: text("auditdatum").notNull(),
  auditor: text("auditor"),
  status: text("status").default("geplant"),
  ergebnis: text("ergebnis").default("offen"),
  scope: text("scope"),
  methode: text("methode"),
  feststellungen: text("feststellungen"),
  positiveAspekte: text("positive_aspekte"),
  abweichungen: text("abweichungen"),
  empfehlungen: text("empfehlungen"),
  followUpDatum: text("follow_up_datum"),
  naechstesAuditAm: text("naechstes_audit_am"),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});
export const insertAuditSchema = createInsertSchema(audits).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  titel: z.string().trim().min(1, "Titel ist erforderlich"),
  auditdatum: z.string().trim().min(1, "Auditdatum ist erforderlich"),
});
export const requestAuditSchema = insertAuditSchema.omit({ mandantId: true });
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof audits.$inferSelect;



// ─── Interne Notizen ───────────────────────────────────────────────────────
export const interneNotizen = sqliteTable("interne_notizen", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  titel: text("titel").notNull(),
  inhalt: text("inhalt").notNull(),
  kategorie: text("kategorie").default("allgemein"),
  prioritaet: text("prioritaet").default("mittel"),
  exportieren: integer("exportieren", { mode: "boolean" }).default(false),
  faelligAm: text("faellig_am"),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});
export const insertInterneNotizSchema = createInsertSchema(interneNotizen).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  titel: z.string().trim().min(1, "Titel ist erforderlich"),
  inhalt: z.string().trim().min(1, "Inhalt ist erforderlich"),
});
export const requestInterneNotizSchema = insertInterneNotizSchema.omit({ mandantId: true });
export type InsertInterneNotiz = z.infer<typeof insertInterneNotizSchema>;
export type InterneNotiz = typeof interneNotizen.$inferSelect;

// ─── Backup-Konfiguration ───────────────────────────────────────────────────
export const backupConfig = sqliteTable("backup_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  enabled: integer("enabled", { mode: "boolean" }).default(false),
  backupDir: text("backup_dir"),
  retentionHourly: integer("retention_hourly").default(24),
  retentionDaily: integer("retention_daily").default(7),
  retentionWeekly: integer("retention_weekly").default(4),
  retentionMonthly: integer("retention_monthly").default(12),
  retentionYearly: integer("retention_yearly").default(2),
  encrypt: integer("encrypt", { mode: "boolean" }).default(false),
  passwordHint: text("password_hint"),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});
export const requestBackupConfigSchema = z.object({
  enabled: z.boolean().optional(),
  backupDir: z.string().trim().optional(),
  retention: z.object({
    hourly: z.number().int().min(1).max(168).optional(),
    daily: z.number().int().min(1).max(31).optional(),
    weekly: z.number().int().min(1).max(52).optional(),
    monthly: z.number().int().min(1).max(120).optional(),
    yearly: z.number().int().min(1).max(20).optional(),
  }).optional(),
  encrypt: z.boolean().optional(),
  passwordHint: z.string().trim().max(200).optional(),
});
export type RequestBackupConfig = z.infer<typeof requestBackupConfigSchema>;

export const requestBackupRestoreSchema = z.object({
  fileName: z.string().trim().min(1),
  password: z.string().min(8).optional(),
});
export type RequestBackupRestore = z.infer<typeof requestBackupRestoreSchema>;

// ─── Aufgaben ─────────────────────────────────────────────────────────────────
export const aufgaben = sqliteTable("aufgaben", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  titel: text("titel").notNull(),
  beschreibung: text("beschreibung"),
  typ: text("typ").default("task"), // todo | task | milestone | kontrolle | review
  prioritaet: text("prioritaet").default("mittel"), // niedrig | mittel | hoch | kritisch
  status: text("status").default("offen"), // offen | in_bearbeitung | erledigt
  fortschritt: integer("fortschritt").default(0),
  verantwortlicher: text("verantwortlicher"),
  startDatum: text("start_datum"),
  faelligAm: text("faellig_am"),
  abgeschlossenAm: text("abgeschlossen_am"),
  kategorie: text("kategorie"), // vvt | avv | dsfa | datenpanne | dsr | tom | sonstige
  referenzId: integer("referenz_id"),
  parentTaskId: integer("parent_task_id"),
  sortierung: integer("sortierung").default(0),
  vorlagenBezug: text("vorlagen_bezug"),
  createdAt: text("created_at").default(new Date().toISOString()),
});
export const insertAufgabeSchema = createInsertSchema(aufgaben).omit({ id: true, createdAt: true });
export type InsertAufgabe = z.infer<typeof insertAufgabeSchema>;
export type Aufgabe = typeof aufgaben.$inferSelect;

// ─── Dokumente ────────────────────────────────────────────────────────────────
export const dokumente = sqliteTable("dokumente", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandantId: integer("mandant_id").notNull(),
  titel: text("titel").notNull(),
  kategorie: text("kategorie").notNull(), // leitlinie_datenschutz | leitlinie_informationssicherheit | richtlinie | prozessbeschreibung | risikobewertung | verfahrensdokumentation | vorlage | vertrag | protokoll | sonstige
  beschreibung: text("beschreibung"),
  dokumentTyp: text("dokument_typ"),
  dateiname: text("dateiname"),
  version: text("version").default("1.0"),
  status: text("status").default("aktiv"), // entwurf | aktiv | archiviert
  gueltigBis: text("gueltig_bis"),
  verantwortlicher: text("verantwortlicher"),
  freigegebenVon: text("freigegeben_von"),
  freigegebenAm: text("freigegeben_am"),
  naechstePruefungAm: text("naechste_pruefung_am"),
  inhalt: text("inhalt"), // Freitextinhalt / Notizen
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});
export const insertDokumentSchema = createInsertSchema(dokumente).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  titel: z.string().trim().min(1, "Titel ist erforderlich"),
  kategorie: z.string().trim().min(1, "Kategorie ist erforderlich"),
});
export const requestDokumentSchema = insertDokumentSchema.omit({ mandantId: true });
export type InsertDokument = z.infer<typeof insertDokumentSchema>;
export type Dokument = typeof dokumente.$inferSelect;

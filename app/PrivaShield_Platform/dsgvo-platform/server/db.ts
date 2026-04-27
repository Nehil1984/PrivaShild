// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.resolve("data.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Auto-migrate: create all tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS mandanten (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rechtsform TEXT,
    anschrift TEXT,
    branche TEXT,
    branchen TEXT DEFAULT '[]',
    webseite TEXT,
    dsb TEXT,
    dsb_email TEXT,
    dsb_telefon TEXT,
    verantwortlicher_name TEXT,
    verantwortlicher_email TEXT,
    verantwortlicher_telefon TEXT,
    datenschutzmanager_name TEXT,
    datenschutzmanager_email TEXT,
    datenschutzmanager_telefon TEXT,
    it_verantwortlicher_name TEXT,
    it_verantwortlicher_email TEXT,
    it_verantwortlicher_telefon TEXT,
    hat_isb INTEGER DEFAULT 0,
    isb_name TEXT,
    isb_email TEXT,
    isb_telefon TEXT,
    webseitenbetreuer_name TEXT,
    webseitenbetreuer_email TEXT,
    webseitenbetreuer_telefon TEXT,
    gruppen_organisation INTEGER DEFAULT 0,
    gruppe_id INTEGER,
    notizen TEXT,
    aktiv INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mandanten_gruppen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    beschreibung TEXT,
    typ TEXT DEFAULT 'sonstige',
    parent_group_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vorlagenpakete (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    beschreibung TEXT,
    kategorie TEXT DEFAULT 'allgemein',
    version TEXT DEFAULT '1.0',
    aktiv INTEGER DEFAULT 1,
    inhalt_json TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mandanten_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    zeitpunkt TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    user_name TEXT,
    aktion TEXT NOT NULL,
    modul TEXT,
    entitaet_typ TEXT,
    entitaet_id INTEGER,
    beschreibung TEXT,
    details_json TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS vorlagenpaket_historie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    paket_id INTEGER NOT NULL,
    paket_name TEXT NOT NULL,
    paket_version TEXT,
    angewendet_am TEXT DEFAULT CURRENT_TIMESTAMP,
    angewendet_von TEXT,
    details_json TEXT DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    mandant_ids TEXT DEFAULT '[]',
    aktiv INTEGER DEFAULT 1,
    failed_login_attempts INTEGER DEFAULT 0,
    temporary_lock_until TEXT,
    admin_locked INTEGER DEFAULT 0,
    admin_locked_at TEXT,
    last_failed_login_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vvt (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    bezeichnung TEXT NOT NULL,
    zweck TEXT,
    rechtsgrundlage TEXT,
    datenkategorien TEXT DEFAULT '[]',
    betroffene_personen TEXT DEFAULT '[]',
    empfaenger TEXT,
    drittlandtransfer INTEGER DEFAULT 0,
    loeschfrist TEXT,
    loeschklasse TEXT,
    aufbewahrungsgrund TEXT,
    tom_hinweis TEXT,
    verantwortlicher TEXT,
    verantwortlicher_email TEXT,
    verantwortlicher_telefon TEXT,
    status TEXT DEFAULT 'aktiv',
    dsfa INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS avv (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    auftragsverarbeiter TEXT NOT NULL,
    gegenstand TEXT,
    vertragsdatum TEXT,
    laufzeit TEXT,
    status TEXT DEFAULT 'aktiv',
    sccs INTEGER DEFAULT 0,
    subauftragnehmer TEXT DEFAULT '[]',
    av_kontakt_name TEXT,
    av_kontakt_email TEXT,
    av_kontakt_telefon TEXT,
    genehmigte_subdienstleister TEXT DEFAULT '[]',
    pruef_faellig TEXT,
    notizen TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dsfa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    vvt_id INTEGER,
    beschreibung TEXT,
    zweck TEXT,
    prozessablauf TEXT,
    verarbeitungskontext TEXT,
    datenquellen TEXT,
    empfaenger TEXT,
    drittlandtransfer INTEGER DEFAULT 0,
    auftragsverarbeiter TEXT,
    technologien_systeme TEXT,
    profiling INTEGER DEFAULT 0,
    automatisierte_entscheidung INTEGER DEFAULT 0,
    notwendigkeit TEXT,
    rechtsgrundlage TEXT,
    zweckbindung_bewertung TEXT,
    datenminimierung_bewertung TEXT,
    speicherbegrenzung_bewertung TEXT,
    transparenz_bewertung TEXT,
    betroffenenrechte_bewertung TEXT,
    zugriffskonzept_bewertung TEXT,
    privacy_by_design_bewertung TEXT,
    risiken TEXT DEFAULT '[]',
    massnahmen TEXT,
    restrisiko_begruendung TEXT,
    art36_erforderlich INTEGER DEFAULT 0,
    art36_begruendung TEXT,
    ergebnis TEXT,
    konsultation INTEGER DEFAULT 0,
    status TEXT DEFAULT 'entwurf',
    reviewer TEXT,
    verantwortlicher_bereich TEXT,
    dsb_beteiligt INTEGER DEFAULT 0,
    dsb_stellungnahme TEXT,
    freigabeentscheidung TEXT,
    freigabe_begruendung TEXT,
    freigabe_datum TEXT,
    naechste_pruefung_am TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS datenpannen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    beschreibung TEXT,
    entdeckt_am TEXT NOT NULL,
    entdeckt_um TEXT,
    gemeldet_am TEXT,
    gemeldet_um TEXT,
    frist_72h TEXT,
    betroffene_personen INTEGER DEFAULT 0,
    datenkategorien TEXT DEFAULT '[]',
    ursache TEXT,
    massnahmen TEXT,
    meldepflichtig INTEGER DEFAULT 0,
    behoerde_meldung TEXT,
    betroffen_informiert INTEGER DEFAULT 0,
    status TEXT DEFAULT 'offen',
    schwere TEXT DEFAULT 'niedrig',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dsr (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    art TEXT NOT NULL,
    antragsteller TEXT,
    eingangsdatum TEXT NOT NULL,
    frist_datum TEXT,
    beschreibung TEXT,
    status TEXT DEFAULT 'offen',
    antwort_datum TEXT,
    notizen TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tom (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    kategorie TEXT NOT NULL,
    massnahme TEXT NOT NULL,
    beschreibung TEXT,
    status TEXT DEFAULT 'implementiert',
    verantwortlicher TEXT,
    pruef_datum TEXT,
    pruefintervall TEXT,
    schutzziel TEXT,
    nachweis TEXT,
    wirksamkeit TEXT,
    notizen TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loeschkonzept (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    bezeichnung TEXT NOT NULL,
    datenart TEXT,
    loeschklasse TEXT NOT NULL,
    frist_kategorie TEXT,
    gesetzliche_frist TEXT,
    quelle_vvt_id INTEGER,
    quelle_vvt_bezeichnung TEXT,
    aufbewahrungsfrist TEXT,
    loeschereignis TEXT,
    rechtsgrundlage TEXT,
    systeme TEXT,
    verantwortlicher TEXT,
    loeschverantwortlicher TEXT,
    kontrolle TEXT,
    nachweis TEXT,
    status TEXT DEFAULT 'aktiv',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    auditart TEXT DEFAULT 'intern',
    pruefbereich TEXT,
    auditdatum TEXT NOT NULL,
    auditor TEXT,
    status TEXT DEFAULT 'geplant',
    ergebnis TEXT DEFAULT 'offen',
    scope TEXT,
    methode TEXT,
    feststellungen TEXT,
    positive_aspekte TEXT,
    abweichungen TEXT,
    empfehlungen TEXT,
    verknuepfte_pdca_ids TEXT DEFAULT '[]',
    follow_up_datum TEXT,
    naechstes_audit_am TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pdca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    beschreibung TEXT,
    zyklus_typ TEXT DEFAULT 'verbesserungsmassnahme',
    zeitraum_von TEXT,
    zeitraum_bis TEXT,
    status TEXT DEFAULT 'geplant',
    prioritaet TEXT DEFAULT 'mittel',
    verantwortlicher TEXT,
    naechste_pruefung_am TEXT,
    plan_ziele TEXT,
    plan_anforderungen TEXT,
    plan_risiken TEXT,
    plan_massnahmen TEXT,
    plan_kennzahlen TEXT,
    do_umsetzung TEXT,
    do_fortschritt INTEGER DEFAULT 0,
    do_nachweise TEXT,
    do_beteiligte TEXT,
    do_abweichungen TEXT,
    check_pruefungen TEXT,
    check_ergebnisse TEXT,
    check_kennzahlen TEXT,
    check_soll_ist TEXT,
    check_feststellungen TEXT,
    act_korrekturen TEXT,
    act_verbesserungen TEXT,
    act_entscheidungen TEXT,
    act_folgemassnahmen TEXT,
    verknuepftes_audit_id INTEGER,
    act_naechster_zyklus TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS aufgaben (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    beschreibung TEXT,
    typ TEXT DEFAULT 'task',
    prioritaet TEXT DEFAULT 'mittel',
    status TEXT DEFAULT 'offen',
    fortschritt INTEGER DEFAULT 0,
    verantwortlicher TEXT,
    start_datum TEXT,
    faellig_am TEXT,
    abgeschlossen_am TEXT,
    kategorie TEXT,
    referenz_id INTEGER,
    parent_task_id INTEGER,
    sortierung INTEGER DEFAULT 0,
    vorlagen_bezug TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dokumente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    kategorie TEXT NOT NULL,
    beschreibung TEXT,
    dokument_typ TEXT,
    dateiname TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'aktiv',
    gueltig_bis TEXT,
    verantwortlicher TEXT,
    freigegeben_von TEXT,
    freigegeben_am TEXT,
    naechste_pruefung_am TEXT,
    inhalt TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interne_notizen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    inhalt TEXT NOT NULL,
    kategorie TEXT DEFAULT 'allgemein',
    prioritaet TEXT DEFAULT 'mittel',
    exportieren INTEGER DEFAULT 0,
    faellig_am TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS backup_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enabled INTEGER DEFAULT 0,
    backup_dir TEXT,
    retention_hourly INTEGER DEFAULT 24,
    retention_daily INTEGER DEFAULT 7,
    retention_weekly INTEGER DEFAULT 4,
    retention_monthly INTEGER DEFAULT 12,
    retention_yearly INTEGER DEFAULT 2,
    encrypt INTEGER DEFAULT 0,
    password_hint TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

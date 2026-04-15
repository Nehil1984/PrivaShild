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
    dsb TEXT,
    dsb_email TEXT,
    aktiv INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    mandant_ids TEXT DEFAULT '[]',
    aktiv INTEGER DEFAULT 1,
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
    tom_hinweis TEXT,
    verantwortlicher TEXT,
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
    notwendigkeit TEXT,
    risiken TEXT DEFAULT '[]',
    massnahmen TEXT,
    ergebnis TEXT,
    konsultation INTEGER DEFAULT 0,
    status TEXT DEFAULT 'entwurf',
    reviewer TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS datenpannen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    beschreibung TEXT,
    entdeckt_am TEXT NOT NULL,
    gemeldet_am TEXT,
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
    notizen TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS aufgaben (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    beschreibung TEXT,
    prioritaet TEXT DEFAULT 'mittel',
    status TEXT DEFAULT 'offen',
    verantwortlicher TEXT,
    faellig_am TEXT,
    kategorie TEXT,
    referenz_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS dokumente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mandant_id INTEGER NOT NULL,
    titel TEXT NOT NULL,
    kategorie TEXT NOT NULL,
    beschreibung TEXT,
    dateiname TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'aktiv',
    gueltig_bis TEXT,
    verantwortlicher TEXT,
    inhalt TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

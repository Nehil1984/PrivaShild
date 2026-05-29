# MEMORY.md – Konsolidierter Langzeitspeicher (TOM für Daniel)

Dieses Dokument dient als das zentrale, aufgeräumte Langzeitgedächtnis für alle gemeinsamen Entwicklungen, Entscheidungen und Projektstände. Die Informationen sind nach Wichtigkeit strukturiert (Core, Important, Casual, Minor) und redundant-frei konsolidiert.

---

## 🟥 CORE (Kritische Grundlagen & Richtlinien)

### 1. Repository-Hygiene & Git-Pushes (PrivaShield & DSDMS)
*   **Ausschlussliste (Lokal-only):** Folgende Ordner und Dateien gehören **niemals** in die GitHub-Repositories (PrivaShield oder DSDMS) und verbleiben ausschließlich lokal im Workspace:
    `memory/`, `MEMORY.md`, `ver.md` (lokal/brain), `SOUL.md`, `IDENTITY.md`, `AGENTS.md`, `USER.md`, `TOOLS.md`, `DREAMS.md`, `knowledge/`, `.openclaw/`, `.openclaw-repair/`, `.clawhub/`.
*   **Git-Routine (vor jedem Push):**
    1.  **Funktionstest** ausführen (Linter, Tests, Build).
    2.  **Repo-Hygiene prüfen** (keine lokalen Workspace-/Memory-Dateien stagen).
    3.  **Push auf `master`** (Standard-Hauptbranch) bzw. `main` (für DSDMS).
    4.  **Versions-Branch erstellen:** Zusätzlich einen Branch mit der aktuellen Versionsnummer anlegen und pushen (z. B. `1.18.0`).
    5.  **Dokumentation:** Den aktuellen App-Stand im lokalen Workspace unter `memory/YYYY-MM-DD.md` festhalten.
*   **SSH-Deploy-Keys:**
    *   PrivaShield: `/Users/schuh/.ssh/id_ed25519_privashield` (im Repo als Deploy-Key hinterlegt).

### 2. Versionierungsregeln (SemVer)
*   **PrivaShield-Regel (`MAJOR.MINOR.PATCH`):**
    *   **MAJOR:** Bahnbrechende, inkompatible Systemänderungen (z. B. Umstellung der Kernarchitektur).
    *   **MINOR:** Signifikante funktionale oder inhaltliche Erweiterungen (z. B. neue Module, Vorlagenpakete). Die Patch-Stelle wird zwingend auf `0` zurückgesetzt.
    *   **PATCH:** Bugfixes, Layout-Feinschliff und kleine Textänderungen.
*   **DSDMS-Regel (`MAJOR.MINOR.PATCH`):**
    *   Startet eigenständig bei Version **`1.0.0`** (dokumentiert in `DSDMS/ver.md`).
    *   **MAJOR:** Breaking Changes an der Quelltext-Ordnerstruktur oder dem Kompilierungsprozess (Makefile/Pandoc).
    *   **MINOR:** Neue Dokumente, neue VVTs oder Skripte hinzugefügt (Patch zurück auf `0`).
    *   **PATCH:** Tippfehlerkorrekturen, Platzhalter-Korrekturen, Makefile-Feinschliff.

---

## 🟧 IMPORTANT (Aktueller Projektstatus & Aktive Konfigurationen)

### 1. PrivaShield (Stand: v1.18.0)
*   **Projektpfade:**
    *   Hauptprojekt: `app/PrivaShield_Platform/dsgvo-platform`
    *   Frontend: `app/PrivaShield_Platform/dsgvo-platform/client`
    *   Backend: `app/PrivaShield_Platform/dsgvo-platform/server`
    *   Gemeinsame Schemas: `app/PrivaShield_Platform/dsgvo-platform/shared/schema.ts`
    *   Haupt-UI: `app/PrivaShield_Platform/dsgvo-platform/client/src/App.tsx`
*   **Letzte Features (v1.18.0):**
    *   **DSDMS-Preset Integration:** Das vollständige Preset (`ID 3`) mit 63 Dokumenten, Prozessen und Seeds in `server/storage-lowdb.ts` integriert. Automatisches Seeding beim API-Start.
    *   **Dropdown-Auswahl (Frontend):**
        *   `vvtTemplates`: Alle **139 DSDMS-Verarbeitungstätigkeiten** alphabetisch sortiert integriert.
        *   `tomTemplates`: Alle **24 Premium-BSI-IT-Grundschutz-TOMs** alphabetisch sortiert aus `3.7.1_tom_bsi_massnahmenkatalog.md` extrahiert und integriert.
*   **Docker-Build & Deploy (Härtung):**
    *   Der Dockerfile-Builder-Stage wurde um native Build-Tools erweitert (`RUN apk add --no-cache python3 make g++`), um C++ Binaries wie `better-sqlite3` unter Alpine Linux sauber aus den Quellen zu kompilieren.
    *   Im Runner-Stage werden die produktionsreifen `node_modules` kopiert (`COPY --from=builder`), um ein Re-Kompilieren im schlanken Runner-Image zu verhindern.
*   **Laufzeitvoraussetzung:** Der lokale Dev-Server benötigt zwingend `JWT_SECRET` als Umgebungsvariable.

### 2. DSDMS (Stand: v1.0.0)
*   **Projektpfad:** `/Volumes/Ext. SSD 2/Antigravity-Workspacees/ISMS-DMS/DSDMS`
*   **Upstream-Referenz:** Verlinkung des Codeberg-Originalprojekts `https://codeberg.org/tomas-jakobs/isms-document-workflow` und explizite Nennung der **GPLv3-Lizenz** im README und `ver.md`.
*   **Anonymisierte Vorlagen-Bibliothek:** 467 Word-Vorlagen vollständig nach Markdown konvertiert, anonymisiert und via dynamischer Snippets (wie `{{snippet: global_organisation}}`) aufbereitet.

---

## 🟨 CASUAL (Historische Meilensteine & Ältere Feature-Releases)

### 1. PrivaShield Versionshistorie (v1.1.0 bis v1.17.0)
*   **v1.17.0:** Initialer DSDMS-Import (7 voll ausformulierte Kerndokumente als Preset `ID 3`) und Integration des Buttons "DSDMS-Vorlagen laden" im Frontend.
*   **v1.16.13:** Auth-Cookie Hotfix. Behebung des HTTP-plain Cookies-Problems bei Port `5000` via IP. `Secure`-Flag wird nun nur bei echten HTTPS-Proxys oder HTTPS-Protokollen gesetzt.
*   **v1.5.0 bis v1.5.16:** Strukturierter Ausbau des DSFA-Moduls (EDSA-konform, VVT-Verknüpfung, Risikoanalysen, Filter- und Routing-Stabilisierung).
*   **v1.3.0 / v1.4.0:** Integration der user-bezogenen Login-Sperrlogik (temporäre Sperre nach 5 Versuchen, administrative Sperre nach 15 Fehlversuchen) und der Sicherheits-Adminübersicht im Dashboard.
*   **v1.1.0 / v1.2.0:** Einführung des Backup-Schedulers mit Rotation und optionaler AES-256 Verschlüsselung (`PRIVASHIELD_BACKUP_PASSWORD`).

### 2. Obsidian-Infrastruktur (Obsidian-as-Code)
*   Strukturierte Bereitstellung von Obsidian-Vorlagen und Ordnerpfaden für Daniels persönliche Wissensdatenbank (`~/Obsidian/knowledge/` mit den Vorlagen für `DSGVO-Gutachten` und `Penetrationstest-Bericht`).

---

## 🟩 MINOR (Archivierte Details & Technische Randnotizen)

*   **TypeScript-i18n-Besonderheit:** `npm test` kann grün sein, obwohl `npm run check` fehlerhaft ist, da TypeScript-Typenprüfungen bei Übersetzungs-Hooks strengere Prüfungen durchführen.
*   **Unraid-Icons:** Icons liegen im PNG-Format bereit und sind im XML-Template verknüpft.
*   **JSON Schema Overrides:** Explizite Deaktivierung von `@esbuild-kit/esm-loader` Überschreibungen für ältere `drizzle-kit` Builds.

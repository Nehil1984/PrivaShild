# Implementation Plan – DSDMS & PrivaShield Integration

Dieses Dokument beschreibt den detaillierten Plan zur Analyse des ISMS-Dokumenten-Workflows, zur Ableitung eines Datenschutz-Management-System (DSDMS) Dokuments-as-Code-Workflows sowie zur Integration dieser Vorlagen in die PrivaShield-Plattform als interaktive Dokumentenvorlagen.

---

## Goal Description

Unser Ziel ist es, ein auf **Docs-as-Code** basierendes Datenschutz-Management-System (DSDMS) nach dem Vorbild von `isms-document-workflow` (Epyy) zu entwerfen. Dieses System wird im neuen Ordner `DSDMS` abgelegt.
Gleichzeitig soll dieses DSDMS nahtlos mit Daniels App **PrivaShield** kooperieren. Dazu werden wir:
1. Die Struktur und Funktionsweise von `isms-document-workflow` analysieren und auf ein Datenschutz-Management übertragen.
2. Einen kompletten Satz von DSGVO/BDSG/TDDDG-Leitlinien und Richtlinien als Markdown-Dateien mit YAML-Frontmatter und Snippet-Support erstellen.
3. Die PrivaShield-App analysieren und um ein Import-/Vorlagen-Management erweitern, damit diese neuen Dokumente direkt in der Web-App als bearbeitbare Vorlagen für jeden Mandanten zur Verfügung stehen (Verdrahtung über `vorlagenpakete`).
4. Nach Daniels expliziter Freigabe die Änderungen im PrivaShield-Repository committen, verifizieren und nach GitHub pushen.

---

## User Review Required

> [!IMPORTANT]
> **Systemabhängigkeiten für PDF-Kompilierung im DSDMS-Ordner:**
> Der originale Workflow von `isms-document-workflow` basiert auf `make`, `pandoc` und `LaTeX` (inkl. `pdflatex` und Zusatzpaketen wie `pdfcpu` und `pdftoppm`).
> Damit die PDF-Generierung im neuen Ordner `DSDMS` direkt im Terminal funktioniert, müssen diese Tools auf deinem macOS-System installiert sein (z. B. via `brew install pandoc basictex`). Sollen wir die Skripte und das `makefile` so anlegen, dass sie für dein lokales macOS vorbereitet sind?
>
> *Empfehlung:* Ja, wir richten das `makefile` und die Shell-Skripte so ein, dass sie dem Standard von `epyy` entsprechen, dokumentieren aber alle Systemabhängigkeiten in einer verständlichen `DSDMS/README.md`.

> [!WARNING]
> **Auth-Token und Cookies im lokalen Testbetrieb:**
> PrivaShield nutzt eine gehärtete Cookie- und CSRF-Authentifizierung. Um die App lokal im Dev-Modus zu starten, muss zwingend `JWT_SECRET` gesetzt sein. Wir werden die App während der Entwicklung mit einem temporären Entwickler-Secret starten.

---

## Open Questions

> [!IMPORTANT]
> **Frage 1: Integration der Vorlagen in die Datenbank**
> Möchtest du, dass das neue DSDMS-Vorlagenpaket ("DSMS Governance & Richtlinien") beim Start der Anwendung automatisch in der SQLite- bzw. LowDB-Datenbank als neues Standard-Vorlagenpaket registriert wird, sodass es direkt bei der Erstellung eines neuen Mandanten oder per Knopfdruck ("Vorlagenpaket anwenden") geladen werden kann?
>
> *Empfehlung:* Ja. Wir schreiben ein Skript, das die Markdown-Dateien aus `DSDMS/src/` einliest, in das JSON-Format von PrivaShields `vorlagenpakete` konvertiert und diese als Standard-Seeding in `server/storage-lowdb.ts` und für SQLite hinterlegt. So sind DSDMS und PrivaShield perfekt verzahnt!

---

## Proposed Changes

### Component 1: DSDMS (Docs-as-Code Datenschutz-Management-System)
Wir erstellen einen neuen Ordner `DSDMS` im Hauptverzeichnis des Workspaces.

#### [NEW] [DSDMS/makefile](file:///Volumes/Ext. SSD 2/Antigravity-Workspacees/ISMS-DMS/DSDMS/makefile)
- Definiert die Build-Targets (`all`, `pdf`, `clean`, `check-deps`) zur Kompilierung der Markdown-Dokumente in professionelle PDFs unter Verwendung von pandoc und LaTeX.

#### [NEW] [DSDMS/pandoc.defaults.yaml](file:///Volumes/Ext. SSD 2/Antigravity-Workspacees/ISMS-DMS/DSDMS/pandoc.defaults.yaml)
- Konfigurationsdatei für Pandoc mit standardisierten Layout-Einstellungen, Schriftarten (z. B. Outfit/Inter) und Metadaten-Mappings.

#### [NEW] [DSDMS/scripts/](file:///Volumes/Ext. SSD 2/Antigravity-Workspacees/ISMS-DMS/DSDMS/scripts/)
- Enthält die Hilfsskripte zum Verarbeiten von Snippets und Frontmatter (Kopien und Anpassungen der bewährten Skripte aus `isms-document-workflow`).

#### [NEW] [DSDMS/snippets/](file:///Volumes/Ext. SSD 2/Antigravity-Workspacees/ISMS-DMS/DSDMS/snippets/)
- Ausführbare Bash-Snippets für variable Daten:
  - `global_organisation`: Gibt den Firmennamen aus.
  - `global_role_dsb`: Gibt den Namen/Kontakt des Datenschutzbeauftragten aus.
  - `global_role_verantwortlicher`: Gibt den Verantwortlichen gemäß Art. 4 Nr. 7 DSGVO aus.
  - `git_document_history`: Generiert eine automatische Historientabelle aus den Git-Commits der Markdown-Datei.

#### [NEW] [DSDMS/src/](file:///Volumes/Ext. SSD 2/Antigravity-Workspacees/ISMS-DMS/DSDMS/src/)
Wir entwerfen eine vollständige, modular gegliederte Datenschutzdokumentation nach DSGVO, BDSG und TDDDG:
- **`1-leitlinien/1.1_datenschutzleitlinie.md`**: Grundsatzerklärung des Managements zu Datenschutz und informationeller Selbstbestimmung (Art. 24 DSGVO).
- **`2-prozesse/2.1_prozess_betroffenenrechte.md`**: Standardprozess zur Bearbeitung von Auskunfts-, Löschungs- und Übertragbarkeitsbegehren (Art. 12-22 DSGVO).
- **`2-prozesse/2.2_prozess_datenpannen.md`**: Prozess zur Erkennung, Bewertung und Meldung von Datenpannen innerhalb der 72-Stunden-Frist (Art. 33, 34 DSGVO).
- **`3-richtlinien/3.1_richtlinie_beschaeftigtendatenschutz.md`**: Richtlinie für die gesetzeskonforme Verarbeitung von Beschäftigtendaten (§ 26 BDSG / Art. 88 DSGVO).
- **`3-richtlinien/3.2_richtlinie_web_telemedien.md`**: Richtlinie zu Cookies, Tracking, Consent-Management und Web-Compliance (§ 25 TDDDG / DDG).
- **`3-richtlinien/3.3_richtlinie_tom.md`**: Technische und organisatorische Maßnahmen gemäß Art. 32 DSGVO (Verschlüsselung, Berechtigung, Ausfallsicherheit).
- **`4-audits/4.1_audit_konzept.md`**: Ablaufbeschreibung für regelmäßige Datenschutz-Audits und Kontrollen.

---

### Component 2: PrivaShield App-Erweiterung (Integration)

Wir analysieren und erweitern PrivaShield im Ordner `WS/app/PrivaShield_Platform/dsgvo-platform/`.

#### [MODIFY] [server/storage-lowdb.ts](file:///Volumes/Ext. SSD 2/Antigravity-Workspacees/ISMS-DMS/WS/app/PrivaShield_Platform/dsgvo-platform/server/storage-lowdb.ts)
- Registrierung des neuen Vorlagenpakets **"DSDMS – DSMS Governance & Richtlinien"** in den Standard-Vorlagenpaketen (`defaultData.vorlagenpakete`).
- Das Paket wird mit den inhaltlich passenden Aufgaben und den vollständigen Entwürfen der Markdown-Dokumente befüllt.

#### [MODIFY] [server/storage-sqlite.ts](file:///Volumes/Ext. SSD 2/Antigravity-Workspacees/ISMS-DMS/WS/app/PrivaShield_Platform/dsgvo-platform/server/storage-sqlite.ts)
- Sicherstellung der Kompatibilität beim Einspielen des neuen DSDMS-Pakets bei SQLite-Nutzung.

#### [MODIFY] [client/src/App.tsx](file:///Volumes/Ext. SSD 2/Antigravity-Workspacees/ISMS-DMS/WS/app/PrivaShield_Platform/dsgvo-platform/client/src/App.tsx)
- Wir ergänzen die **`DokumentePage`**:
  - Hinzufügen einer Schaltfläche **"DSDMS-Vorlagen laden"**, um das DSDMS-Dokumentenpaket für den aktuell aktiven Mandanten mit einem Klick zu importieren, falls es noch nicht angewendet wurde.
  - Das Interface zeigt an, ob das DSMS-Richtlinienpaket bereits aktiv ist, und bietet Direktlinks zur Bearbeitung der importierten Dokumente.

---

## Verification Plan

### Automated Tests
1. **TypeScript & Build Verification:**
   - Wir führen im PrivaShield-Projektordner `npm run check` (Typecheck) und `JWT_SECRET=testsecretfortestingonly1234567890 npm run build` aus, um sicherzustellen, dass die App fehlerfrei kompiliert.
2. **Testsuite:**
   - Wir führen `npm test` aus, um sicherzustellen, dass alle API-Vertragstests und Security-Tests weiterhin erfolgreich durchlaufen.

### Manual Verification
1. **DSDMS PDF-Generierung (Dry-Run & Compile):**
   - Falls die Systemabhängigkeiten vorhanden sind, testen wir das Kompilieren eines Markdown-Dokuments im DSDMS-Ordner:
     `make src/1-leitlinien/1.1_datenschutzleitlinie.pdf`
2. **Vorlagen-Import-Test:**
   - Wir starten den PrivaShield Dev-Server: `JWT_SECRET=devsecret1234567890 npm run dev`
   - Wir prüfen in der Oberfläche, ob das neue DSDMS-Vorlagenpaket gelistet wird und sich fehlerfrei auf einen Testmandanten anwenden lässt.
3. **PrivaShield Push-Routine (PrivaShield-Hygiene):**
   - Vor dem Push prüfen wir genauestens, ob `.gitignore` greift und keine `.gemini`, `memory/` oder `DSDMS/` Ordner fälschlicherweise in den Git-Index geraten.
   - Nach erfolgreichem Push dokumentieren wir den Stand in `memory/2026-05-28.md`.

---

> [!CAUTION]
> **Freigabe für GitHub-Push:**
> Gemäß Milestone 6 und den PrivaShield-Sicherheitsregeln werde ich den Push nach GitHub erst durchführen, nachdem du mir die explizite Freigabe im Chat erteilt hast.

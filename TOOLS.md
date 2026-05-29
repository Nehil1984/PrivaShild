# TOOLS.md – Werkzeuge & Technologie-Stack im Workspace

Dieses Dokument listet alle Werkzeuge, Compiler und Laufzeitumgebungen auf, die in dieser Workspace-Infrastruktur (PrivaShield & DSDMS) aktiv genutzt werden.

---

## 🛠️ Build- & Kompilierungs-Werkzeuge (DSDMS / Docs-as-Code)

*   **Pandoc:** Universal-Dokumentenkonverter. Wird verwendet, um Markdown-Dateien unter Berücksichtigung von Frontmatter, Templates und Includes in LaTeX oder HTML zu konvertieren.
*   **Tectonic:** Eine moderne, selbstkonfigurierende LaTeX-Engine auf XeTeX-Basis. Wird verwendet, um aus den generierten LaTeX-Dateien hochprofessionell gesetzte PDF-Dokumente zu kompilieren.
*   **GNU Make (Makefile):** Steuert den gesamten Build-Workflow der Datenschutzdokumente in DSDMS (Kompilierung, Clean-Up, Feeds, RSS, OPDS, CalDAV, PDF-Zusammenführungen).
*   **pdfcpu & poppler (pdftoppm):** Werden im Make-Build genutzt, um PDF-Dokumente zu prüfen, Metadaten anzupassen und JPEG-Thumbnails der ersten PDF-Seiten zur Vorschau zu erzeugen.

---

## 💻 App-Laufzeitumgebung & Frontend (PrivaShield_Platform)

*   **Node.js & npm:** Die Ausführungsumgebung für die Express-API und den Vite-Dev-Server.
*   **Vite:** Superschneller Frontend-Bundler und HMR-Dev-Server für die React-Applikation.
*   **React (v18):** UI-Bibliothek für das responsive Datenschutz-Dashboard und die Formulare.
*   **Tailwind CSS:** Utility-First CSS-Framework für das Styling und die Visualisierung.
*   **TypeScript:** Typsichere Entwicklung über Frontend, Backend und Schemas hinweg.
*   **Vitest:** Test-Framework zur automatisierten Absicherung der Backend-Routen und API-Verträge.

---

## 🗄️ Datenhaltung, ORM & API-Validierung (PrivaShield Backend)

*   **Drizzle ORM:** TypeScript-ORM für typsichere Abfragen und automatische Schema-Pushs.
*   **lowdb (JSON-Storage):** Genutzt in `storage-lowdb.ts` für die einfache, mandantenbezogene Ablage des Vorlagen-Presets.
*   **better-sqlite3:** Relationale SQLite3-Datenbank Engine für die permanente Speicherung.
*   **Zod:** Typsichere Schema-Validierung für eingehende API-Requests und Formulareingaben.

---

## 🐳 Containerisierung & Deployment (Docker / Unraid)

*   **Docker:** Container-Virtualisierung für den plattformunabhängigen Betrieb.
*   **docker-compose:** Orchestrierung der Web-App und eventueller Container-Sicherungen.
*   **Unraid Templates:** XML-Templates für das einfache Einbinden von PrivaShield im Unraid App-Store.
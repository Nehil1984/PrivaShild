# PrivaShield

PrivaShield ist eine Datenschutzmanagement-Plattform für die strukturierte Dokumentation, Verwaltung und operative Steuerung von Datenschutz- und Compliance-Themen.

Die Anwendung richtet sich an Unternehmen, Datenschutzbeauftragte, interne Verantwortliche und Berater, die zentrale DSGVO-relevante Prozesse in einer Webanwendung bündeln möchten.

## Funktionsumfang

PrivaShield bündelt wesentliche Datenschutz- und Governance-Bausteine in einer Oberfläche:

- Verzeichnis der Verarbeitungstätigkeiten (VVT)
- Auftragsverarbeitungsverträge (AVV)
- Datenschutz-Folgenabschätzungen (DSFA)
- Datenpannenmanagement nach Art. 33/34 DSGVO
- Betroffenenrechte / DSR
- TOM-Katalog
- Löschkonzept mit Fristen, Löschklassen und VVT-Bezug
- Aufgaben- und Maßnahmenmanagement
- Dokumente, Leitlinien und Richtlinien
- Beschäftigtendatenschutz
- KI-Tools & Compliance
- Web-Datenschutz-Prüfungen
- Interne Audits
- Interne Notizen mit expliziter Exportfreigabe
- Export- und Druckansichten für Management- und Dokumentationszwecke
- Backup-Verwaltung mit Rotation und optionaler Verschlüsselung

## Besondere Merkmale

### 1. Mandantenfähigkeit
PrivaShield ist mandantenfähig aufgebaut. Mehrere Mandanten können getrennt verwaltet und strukturiert organisiert werden.

### 2. Governance- und Reifegradbetrachtung
Die App zeigt nicht nur Einzeldaten, sondern verdichtet diese zu Management-Kennzahlen und einem pragmatischen Reifegradbild.

### 3. Interne Notizen mit Exportsteuerung
Mandantenbezogene interne Notizen können separat erfasst werden. Für jede Notiz kann ausdrücklich festgelegt werden, ob sie im Export erscheinen darf.

### 4. Export / Druck
Für Auswertungen und Berichte steht eine Druck- und Exportansicht zur Verfügung. Sensible Inhalte wie interne Notizen werden nur bei expliziter Freigabe berücksichtigt.

### 5. Backup und Betrieb
Die Plattform unterstützt interne Backups, Rotationslogik und optional verschlüsselte Sicherungen. Automatische verschlüsselte Scheduler-Backups benötigen zusätzlich die Umgebungsvariable `PRIVASHIELD_BACKUP_PASSWORD`.

## Technischer Stack

- **Frontend:** React, TypeScript, Vite, Tailwind
- **Backend:** Express, TypeScript
- **Persistenz:** SQLite oder lowdb
- **ORM / Schema:** Drizzle ORM + Zod
- **Authentifizierung:** JWT

## Projektstruktur

```text
client/        Frontend
server/        Backend und API
shared/        Gemeinsame Schemas und Typen
script/        Build- und Hilfsskripte
data/          Laufzeitdaten / Datenbank / Backups
```

## Start im Entwicklungsmodus

Voraussetzungen:
- Node.js
- npm

Installation:

```bash
npm install
```

Entwicklung starten:

```bash
npm run dev
```

## Produktionsbetrieb

Für den produktiven Betrieb werden insbesondere folgende Umgebungsvariablen benötigt:

```env
NODE_ENV=production
PORT=5000
DATABASE_PATH=/data/privashield.db
JWT_SECRET=bitte-einen-langen-zufaelligen-wert-setzen
INITIAL_ADMIN_EMAIL=admin@example.local
INITIAL_ADMIN_PASSWORD=SehrSicheresPasswort123!
INITIAL_ADMIN_NAME=Administrator
# erforderlich für automatische verschlüsselte Backup-Läufe
PRIVASHIELD_BACKUP_PASSWORD=bitte-ein-separates-starkes-backup-kennwort-setzen
```

Hinweis:
- Für manuelle verschlüsselte Backups kann das Kennwort über die Oberfläche übergeben werden.
- Für automatische verschlüsselte Scheduler-Läufe muss `PRIVASHIELD_BACKUP_PASSWORD` in der Laufzeitumgebung gesetzt sein.
- Ist die Verschlüsselung aktiviert, aber keine Umgebungsvariable gesetzt, schlägt der automatische Lauf bewusst fehl, statt unverschlüsselte Backups zu erzeugen.

### Wichtige Hinweise für Login, Cookie-Auth und Reverse Proxy

Die aktuelle Auth-Härtung nutzt einen kombinierten Ansatz aus:
- HttpOnly-Auth-Cookie
- Bearer-Fallback für robuste Session-Wiederherstellung
- CSRF-Token für zustandsändernde Requests
- zusätzlicher Origin-/Referer-Prüfung für schreibende Requests

Für produktionsnahe Deployments bedeutet das:
- PrivaShield sollte bevorzugt hinter **HTTPS** betrieben werden.
- Ein Reverse Proxy muss `Host` sowie idealerweise `X-Forwarded-Host` und `X-Forwarded-Proto` sauber durchreichen.
- Unterschiedliche externe und interne Origins ohne korrekte Proxy-Weitergabe können zu `403` bei schreibenden Requests führen.
- Nach Login-Problemen sollten insbesondere `/api/auth/login`, `/api/auth/me` und anschließende `POST`-/`PUT`-/`DELETE`-Requests im Browser-Netzwerk-Tab geprüft werden.

Typische Symptome im Live-Betrieb:
- `401 Nicht authentifiziert` → meist Problem bei Cookie-/Bearer-Weitergabe oder Proxy-Setup
- `403 CSRF-Prüfung fehlgeschlagen` → CSRF-Cookie/Header fehlen oder stimmen nicht überein
- `403 Origin-Prüfung fehlgeschlagen` → Browser-Origin passt nicht zur vom Server ermittelten Ziel-Origin, oft Proxy-/HTTPS-/Host-Header-Thema

## Unraid / Docker

Das Repository enthält zusätzliche Dateien für den Containerbetrieb, unter anderem:

- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.unraid.yml`
- `unraid.md`
- `unraid-template.xml`

Damit kann PrivaShield lokal, per Docker oder in Unraid betrieben werden.

## Export und sensible Inhalte

Interne Notizen sind bewusst separat steuerbar.

Wichtig:
- Notizen können erstellt und verwaltet werden
- für jede Notiz kann eine Exportfreigabe gesetzt werden
- nur freigegebene Notizen dürfen im Export erscheinen

## Lizenz

Dieses Projekt steht unter der **Apache License 2.0**.

- SPDX: `Apache-2.0`
- Lizenztext: `LICENSE.md`
- Offizielle Quelle: <https://www.apache.org/licenses/LICENSE-2.0>

## Copyright

Copyright 2026 Daniel Schuh

## Repository

GitHub:
<https://github.com/Nehil1984/PrivaShild>

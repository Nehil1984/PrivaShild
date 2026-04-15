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
Die Plattform unterstützt interne Backups, Rotationslogik und optional verschlüsselte Sicherungen.

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
```

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

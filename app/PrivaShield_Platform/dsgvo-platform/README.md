# dsgvo-platform

## Lizenz

Dieses Projekt steht unter der **Apache License 2.0**.

- SPDX: `Apache-2.0`
- Volltext der Lizenz: `LICENSE.md`
- Offizielle Quelle: <https://www.apache.org/licenses/LICENSE-2.0>

Die Software wird unter den Bedingungen der Apache License 2.0 bereitgestellt, einschließlich der dort geregelten Hinweise zu Nutzung, Weitergabe, Änderung, Patentlizenz und Haftungsausschluss.

## Unraid Schnellstart

Für Unraid liegen drei passende Artefakte im Repository:

- `unraid.md`, ausführliche Schritt-für-Schritt-Anleitung
- `unraid-template.xml`, Unraid Container Template
- `docker-compose.unraid.yml`, Unraid-spezifische Compose-Datei

## Minimaler Ablauf

1. Image bauen oder nach Unraid importieren
2. persistentes Verzeichnis anlegen:
   - `/mnt/user/appdata/privashield/data`
3. Pflichtwerte setzen:
   - `JWT_SECRET`
   - `INITIAL_ADMIN_EMAIL`
   - `INITIAL_ADMIN_PASSWORD`
4. Container auf Port `5000` starten
5. App im Browser öffnen

## Wichtige Unraid-Werte

| Bereich | Wert |
|---|---|
| Host-Pfad | `/mnt/user/appdata/privashield/data` |
| Container-Pfad | `/data` |
| Datenbank | `/data/privashield.db` |
| Standard-Port | `5000` |

## Pflicht-Umgebungsvariablen

```env
NODE_ENV=production
PORT=5000
DATABASE_PATH=/data/privashield.db
JWT_SECRET=bitte-einen-langen-zufaelligen-wert-setzen
INITIAL_ADMIN_EMAIL=admin@example.local
INITIAL_ADMIN_PASSWORD=SehrSicheresPasswort123!
INITIAL_ADMIN_NAME=Administrator
```

## Hinweise

- Ohne `JWT_SECRET` ist kein sicherer produktiver Betrieb möglich.
- Ohne `INITIAL_ADMIN_EMAIL` und `INITIAL_ADMIN_PASSWORD` wird kein initialer Admin angelegt.
- Backups erfolgen über die persistente Datenbankdatei unter `/mnt/user/appdata/privashield/data/privashield.db`.

## Weiterführend

- Vollständige Anleitung: `unraid.md`
- Unraid Template: `unraid-template.xml`
- Compose für Unraid: `docker-compose.unraid.yml`
- Beispielvariablen: `.env.unraid.example`
- Unraid-Icon: `assets/unraid-icon.svg`

## Container Publishing

Ein GitHub-Actions-Workflow liegt bereit unter:

- `.github/workflows/docker-ghcr.yml`

Damit kann das Docker-Image nach **GHCR** veröffentlicht werden, z. B. als:

- `ghcr.io/<owner>/privashield:latest`

## Reverse Proxy Empfehlung

Für öffentlich erreichbaren Betrieb unter Unraid empfehle ich:
- Veröffentlichung nicht direkt auf Port `5000`
- stattdessen Reverse Proxy, z. B. **Nginx Proxy Manager**
- HTTPS erzwingen
- optional Zugriff per VPN oder IP-Restriktion absichern

## Wichtiger Hinweis für Unraid-Startprobleme

Wenn beim Containerstart nur JS-/Bundle-Inhalt im Log erscheint statt normaler Startmeldungen:

1. Image unbedingt **neu bauen oder neu pullen**
2. Container vollständig **neu erstellen**, nicht nur neu starten
3. sicherstellen, dass kein eigenes Command/Override in Unraid gesetzt ist
4. folgende Variablen setzen:
   - `JWT_SECRET`
   - `INITIAL_ADMIN_EMAIL`
   - `INITIAL_ADMIN_PASSWORD`
5. danach Container-Log erneut prüfen

Die erwarteten Startmeldungen sehen eher so aus:
- `[entrypoint] /data bereit ...`
- `[entrypoint] starte app mit node /app/dist/index.cjs`
- `[DB] Backend: ...`


## API- und Exportstand

Aktuell nutzt die Plattform zusätzliche Meta- und Sammel-APIs, damit fachliche Listen und Exportdaten zentral aus dem Backend kommen:

- `GET /api/meta/loeschfristen`
- `GET /api/meta/branchen`
- `GET /api/meta/vvt-loeschmapping`
- `POST /api/mandanten/:mid/loeschkonzept/import-vvt/:vvtId`
- `GET /api/mandanten/:mid/export-context`

Die Exportseite und Druckansicht greifen damit nicht mehr nur auf viele Einzelabfragen zu, sondern können den Exportkontext gesammelt laden.


## Beschäftigtendatenschutz

Die Plattform enthält jetzt zusätzlich einen eigenen Bereich **Beschäftigtendatenschutz**. Dort können dokumentiert werden:

- Datenschutzerklärung für Beschäftigte
- Verpflichtung auf Verschwiegenheit / Vertraulichkeit
- Verpflichtung Telekommunikation / Fernmeldegeheimnis
- Datenschutzschulungen mit letzter Schulung, Wiederholungsintervall und nächster Wiederschulung
- Nachweise und offene Maßnahmen

Technisch wird dieser Bereich aktuell über das Dokumentmodul mit einem strukturierten `dokumentTyp` abgebildet und durch eine Meta-API für Zielgruppen und Schulungsformate ergänzt.


## Backup-Routine und Verschlüsselung

Die Plattform unterstützt nun eine serverseitige Backup-Verwaltung mit folgender Aufbewahrungslogik:

- 24 stündliche Backups
- 7 tägliche Backups
- 4 wöchentliche Backups
- 12 monatliche Backups
- 2 jährliche Backups

### API
- `GET /api/admin/backups/config` – aktuelle Backup-Konfiguration
- `POST /api/admin/backups/config` – Backup-Konfiguration speichern
- `GET /api/admin/backups` – vorhandene Backups auflisten
- `POST /api/admin/backups/run` – Backup sofort ausführen

### Verschlüsselung
Backups können optional mit einem Kennwort verschlüsselt werden. Die Backup-Dateien werden serverseitig mit AES-256-GCM erzeugt. Das Kennwort selbst wird nicht im Klartext gespeichert; in der Konfiguration liegt nur eine abgeleitete Prüfsumme sowie optional ein Kennworthinweis.

### Technische Umsetzung
- SQLite-Backend: Backup der Datenbankdatei unter `DATABASE_PATH`
- LowDB-Backend: Backup der JSON-Datei `privashield.json`
- Standard-Backup-Verzeichnis: `<data>/backups`
- Die Rotation wird beim Erstellen eines Backups direkt serverseitig durchgesetzt.

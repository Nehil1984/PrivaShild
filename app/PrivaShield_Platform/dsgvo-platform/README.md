# dsgvo-platform

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

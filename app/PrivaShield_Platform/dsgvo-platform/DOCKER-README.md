# PrivaShield – Docker & Unraid Deployment

## Sicherheitsrelevante Änderung

Der gehärtete Stand erzeugt **keinen automatischen Default-Admin mehr**.

Für einen Erststart ohne vorhandene Benutzer musst du setzen:
- `JWT_SECRET`
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`
- optional `INITIAL_ADMIN_NAME`

Ohne diese Variablen startet die App zwar, legt aber **keinen initialen Admin-Benutzer** an.

## Schnellstart (Docker Compose)

```bash
# 1. Repository / Projektordner öffnen
cd privashield

# 2. Container bauen und starten
docker compose up -d --build

# 3. Aufrufen
# http://DEINE-IP:5000
```

---

## Unraid – Manuell über "Add Container"

Gehe in Unraid → **Docker** → **Add Container** und trage folgendes ein:

| Feld | Wert |
|---|---|
| **Name** | `privashield` |
| **Repository** | `privashield:latest` (nach lokalem Build) |
| **Network Type** | Bridge |
| **Port (Host)** | `5000` |
| **Port (Container)** | `5000` |
| **Volume (Host)** | `/mnt/user/appdata/privashield/data` |
| **Volume (Container)** | `/data` |
| **Variable: DATABASE_PATH** | `/data/privashield.db` |
| **Variable: JWT_SECRET** | `ein-langer-zufaelliger-geheimer-schluessel` |
| **Variable: INITIAL_ADMIN_EMAIL** | `admin@example.local` |
| **Variable: INITIAL_ADMIN_PASSWORD** | `starkes-einmalpasswort` |
| **Variable: INITIAL_ADMIN_NAME** | `Administrator` |
| **Variable: NODE_ENV** | `production` |
| **Variable: PORT** | `5000` |
| **Restart Policy** | `unless-stopped` |
| **WebUI** | `http://[IP]:[PORT:5000]/` |

### Lokal bauen und als Unraid-Image verfügbar machen

```bash
# Auf deinem Build-Rechner (oder direkt auf Unraid per SSH):
docker build -t privashield:latest .

# Optional: Image als Tarball exportieren und auf Unraid importieren
docker save privashield:latest | gzip > privashield.tar.gz
# Auf Unraid:
docker load < privashield.tar.gz
```

---

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `PORT` | `5000` | Listening-Port |
| `DATABASE_PATH` | `/data/privashield.db` | Pfad zur SQLite-DB |
| `JWT_SECRET` | keiner | **Pflichtwert, sicher und lang setzen** |
| `INITIAL_ADMIN_EMAIL` | keiner | Erstinitialisierung des ersten Admin-Benutzers |
| `INITIAL_ADMIN_PASSWORD` | keiner | Einmalpasswort für den ersten Admin |
| `INITIAL_ADMIN_NAME` | `Administrator` | Anzeigename des initialen Admins |
| `NODE_ENV` | `production` | Node-Umgebung |

---

## Volumes

| Container-Pfad | Beschreibung |
|---|---|
| `/data` | SQLite-Datenbank (persistent, unbedingt mappen!) |

**Unraid-Empfehlung:** `/mnt/user/appdata/privashield/data` → `/data`

---

## Backup

Die gesamte Datenbank liegt in **einer einzigen Datei**:
```
/mnt/user/appdata/privashield/data/privashield.db
```
Einfach diese Datei sichern — das ist das komplette Backup.

---

## Erstzugang

Beim ersten Start wird nur dann ein Admin-Account angelegt, wenn `INITIAL_ADMIN_EMAIL` und `INITIAL_ADMIN_PASSWORD` gesetzt sind.

**Empfehlung:**
- starkes Einmalpasswort verwenden
- nach dem ersten Login sofort ändern
- Zugangsdaten nicht im Compose-File im Klartext lassen, wenn ein Secret-Management verfügbar ist

---

## Updates

```bash
# Neues Image bauen
docker build -t privashield:latest .

# Container neu starten (Daten bleiben erhalten)
docker compose down && docker compose up -d
```

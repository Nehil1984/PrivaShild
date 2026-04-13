# PrivaShield – Docker & Unraid Deployment

## Schnellstart (Docker Compose)

```bash
# 1. Repository / Projektordner öffnen
cd privashield

# 2. Container bauen und starten
docker compose up -d --build

# 3. Aufrufen
# http://DEINE-IP:5000
# Login: admin@dsgvo.local / Admin1234!
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
| **Variable: JWT_SECRET** | `dein-geheimer-schluessel` |
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
| `JWT_SECRET` | (interner Default) | **In Produktion unbedingt ändern!** |
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

Nach dem ersten Start wird automatisch ein Admin-Account angelegt:

- **E-Mail:** `admin@dsgvo.local`
- **Passwort:** `Admin1234!`

**Sofort nach dem Login unter Benutzer → Passwort ändern!**

---

## Updates

```bash
# Neues Image bauen
docker build -t privashield:latest .

# Container neu starten (Daten bleiben erhalten)
docker compose down && docker compose up -d
```

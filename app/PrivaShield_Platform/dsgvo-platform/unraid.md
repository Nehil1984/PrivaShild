# PrivaShield unter Unraid als Docker-Container einbinden

Diese Anleitung zeigt dir, wie du **PrivaShield** unter **Unraid** als Docker-Container betreibst.

## Ziel

Du erhältst am Ende:
- einen laufenden PrivaShield-Container unter Unraid
- persistente Datenhaltung für die Datenbank
- einen initialen Admin-Zugang
- eine saubere Basis für Updates und Backups

---

## Voraussetzungen

Bevor du startest, solltest du Folgendes haben:

- ein laufendes **Unraid-System** mit aktiviertem Docker-Dienst
- das PrivaShield-Repository bzw. den Projektstand
- Zugriff auf die Unraid-Weboberfläche
- optional SSH-Zugriff auf den Unraid-Host

---

## Wichtiger Sicherheitshinweis

Der aktuelle gehärtete Stand erstellt **keinen unsicheren Default-Admin** mehr.

Für den Erststart musst du daher zwingend folgende Umgebungsvariablen setzen:

- `JWT_SECRET`
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`

Optional:
- `INITIAL_ADMIN_NAME`

Ohne diese Angaben startet die App zwar, aber es wird **kein initialer Administrator** angelegt.

---

## Empfohlene Ordner unter Unraid

Lege unter `appdata` einen persistenten Ordner für PrivaShield an, zum Beispiel:

```bash
/mnt/user/appdata/privashield
```

Empfohlen:

```bash
/mnt/user/appdata/privashield/data
```

Darin liegt später die persistente Datenbankdatei.

---

## Variante A, Container direkt über Unraid WebUI anlegen

Öffne in Unraid:

**Docker -> Add Container**

Trage dann die folgenden Werte ein.

### Basisdaten

| Feld | Wert |
|---|---|
| Name | `privashield` |
| Repository | `privashield:latest` |
| Network Type | `bridge` |
| Console shell command | `Shell` |
| Privileged | `Off` |
| WebUI | `http://[IP]:[PORT:5000]/` |

### Port-Mapping

| Host-Port | Container-Port |
|---|---|
| `5000` | `5000` |

Wenn Port `5000` auf dem Host bereits belegt ist, kannst du z. B. auch `5050 -> 5000` verwenden.

### Volume-Mapping

| Host-Pfad | Container-Pfad |
|---|---|
| `/mnt/user/appdata/privashield/data` | `/data` |

### Umgebungsvariablen

| Variable | Beispielwert |
|---|---|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `DATABASE_PATH` | `/data/privashield.db` |
| `JWT_SECRET` | `hier-ein-langer-zufaelliger-geheimer-wert` |
| `INITIAL_ADMIN_EMAIL` | `admin@example.local` |
| `INITIAL_ADMIN_PASSWORD` | `SehrSicheresPasswort123!` |
| `INITIAL_ADMIN_NAME` | `Administrator` |

### Restart-Verhalten

Empfehlung:
- `unless-stopped`

---

## Variante B, Image manuell bauen und in Unraid nutzen

Wenn noch kein fertiges Registry-Image vorhanden ist, kannst du das Image selbst bauen.

### 1. Projektordner öffnen

```bash
cd /pfad/zum/dsgvo-platform
```

### 2. Docker-Image bauen

```bash
docker build -t privashield:latest .
```

### 3. Optional als Datei exportieren

Wenn du auf einem anderen System baust, kannst du das Image exportieren:

```bash
docker save privashield:latest | gzip > privashield.tar.gz
```

### 4. Auf Unraid importieren

```bash
gzip -dc privashield.tar.gz | docker load
```

Danach kannst du in Unraid als Repository `privashield:latest` verwenden.

---

## Erster Start

Nach dem Anlegen des Containers:

1. Container starten
2. Unraid-Container-Logs prüfen
3. im Browser aufrufen

Beispiel:

```text
http://DEINE-UNRAID-IP:5000
```

oder bei abweichendem Host-Port:

```text
http://DEINE-UNRAID-IP:5050
```

---

## Erwartetes Verhalten beim Erststart

Beim ersten erfolgreichen Start mit gesetzten Initial-Admin-Variablen sollte in den Logs sinngemäß erscheinen, dass ein initialer Admin-Benutzer erstellt wurde.

Danach kannst du dich mit diesen Zugangsdaten anmelden:

- E-Mail: aus `INITIAL_ADMIN_EMAIL`
- Passwort: aus `INITIAL_ADMIN_PASSWORD`

**Empfehlung:**
- direkt nach dem ersten Login das Passwort ändern
- das Initialpasswort nicht dauerhaft weiterverwenden

---

## Datenhaltung / Persistenz

Die App speichert ihre Datenbank persistent unter:

```text
/data/privashield.db
```

Durch das Mapping auf Unraid liegt die Datei effektiv unter:

```text
/mnt/user/appdata/privashield/data/privashield.db
```

Diese Datei ist der zentrale Datenbestand deiner Instanz.

---

## Backup unter Unraid

Für ein Backup reicht es in der Regel, diese Datei zu sichern:

```text
/mnt/user/appdata/privashield/data/privashield.db
```

Empfehlung:
- regelmäßige Sicherung des gesamten Ordners `appdata/privashield`
- Sicherung nur bei gestoppter App oder mit konsistenter Backup-Strategie

---

## Update des Containers

Wenn du ein neues Image gebaut oder importiert hast:

1. Container stoppen
2. neues Image bereitstellen
3. Container neu erstellen oder neu starten

Die Daten bleiben erhalten, solange dein `/data`-Volume unverändert gemappt bleibt.

---

## Typische Fehlerquellen

### 1. Login nicht möglich
Prüfen:
- sind `INITIAL_ADMIN_EMAIL` und `INITIAL_ADMIN_PASSWORD` beim ersten Start gesetzt gewesen?
- ist wirklich dieselbe persistente Datenbank eingebunden?
- wurde bereits früher mit anderer Datenbasis gestartet?

### 2. Daten nach Neustart weg
Prüfen:
- ist `/data` wirklich auf `/mnt/user/appdata/privashield/data` gemappt?
- wurde der Container ohne persistentes Volume gestartet?

### 3. App startet, aber kein Admin wird angelegt
Prüfen:
- `JWT_SECRET` gesetzt?
- `INITIAL_ADMIN_EMAIL` gesetzt?
- `INITIAL_ADMIN_PASSWORD` gesetzt?

### 4. Port nicht erreichbar
Prüfen:
- stimmt das Port-Mapping?
- läuft der Container wirklich?
- blockiert ein Reverse Proxy oder anderer Dienst den Port?

---

## Empfohlene Betriebsparameter

Für einen sauberen Betrieb unter Unraid empfehle ich:

- `NODE_ENV=production`
- starkes `JWT_SECRET`
- starkes Initialpasswort
- persistentes Mapping von `/data`
- regelmäßige Backups der Datenbankdatei
- Host-Port nur intern freigeben oder über Reverse Proxy absichern

---

## Beispielkonfiguration kompakt

### Port
- Host: `5000`
- Container: `5000`

### Volume
- Host: `/mnt/user/appdata/privashield/data`
- Container: `/data`

### Variablen
```env
PORT=5000
NODE_ENV=production
DATABASE_PATH=/data/privashield.db
JWT_SECRET=bitte-einen-langen-zufaelligen-wert-setzen
INITIAL_ADMIN_EMAIL=admin@example.local
INITIAL_ADMIN_PASSWORD=SehrSicheresPasswort123!
INITIAL_ADMIN_NAME=Administrator
```

---

## Empfehlung für produktionsnahen Betrieb

Wenn du PrivaShield dauerhaft unter Unraid betreiben willst, würde ich zusätzlich empfehlen:

1. Reverse Proxy vor den Container setzen
2. HTTPS erzwingen
3. Zugriff nur intern oder per VPN freigeben
4. Backups automatisieren
5. JWT-Secret sicher dokumentieren und geschützt aufbewahren

---

## Reverse Proxy mit Nginx Proxy Manager unter Unraid

Für produktionsnahen Betrieb solltest du PrivaShield nicht einfach ungeschützt direkt auf Port 5000 ins Internet stellen.

Empfehlung unter Unraid:
- PrivaShield intern auf Port `5000`
- Veröffentlichung nur über **Nginx Proxy Manager**
- HTTPS mit Let's Encrypt
- optional Zugriff zusätzlich per VPN oder IP-Restriktion absichern

### Beispielaufbau

- PrivaShield intern: `http://UNRAID-IP:5000`
- Extern über Proxy: `https://privacy.deinedomain.tld`

### Proxy-Host im Nginx Proxy Manager

Lege einen neuen **Proxy Host** mit folgenden Werten an:

| Feld | Wert |
|---|---|
| Domain Names | `privacy.deinedomain.tld` |
| Scheme | `http` |
| Forward Hostname / IP | `UNRAID-IP` |
| Forward Port | `5000` |
| Block Common Exploits | aktivieren |
| Websockets Support | aktivieren |
| Cache Assets | deaktiviert |

### SSL-Einstellungen

Im Reiter **SSL**:
- `Request a new SSL Certificate`
- `Force SSL`
- `HTTP/2 Support`
- `HSTS Enabled` optional nach Test

### Zusätzliche Empfehlung

Wenn die Plattform nur intern genutzt werden soll:
- Domain nur intern auflösbar machen oder
- Zugriff auf den Proxy per VPN beschränken

---

## Zusätzliche Dateien im Repository

```text
unraid.md
unraid-template.xml
docker-compose.unraid.yml
.env.unraid.example
README.md
```

---


## Technischer Stand der aktuellen App-Version

Die aktuelle Version enthält zusätzlich:

- Audit-Modul mit Export-/Druckunterstützung
- Löschkonzept-Modul mit Löschklassen, Fristgruppen und VVT-Übernahme
- Meta-APIs für Fristen, Branchen und VVT-Löschmapping
- Sammel-Endpunkt `GET /api/mandanten/:mid/export-context` für Druck- und Exportkontexte

Für Unraid-Betrieb bedeutet das insbesondere:

- Datenpfad und Persistenz bleiben unverändert
- bei Reverse Proxy oder externer Veröffentlichung sollte JWT sauber gesetzt und der Zugriff zusätzlich abgesichert werden
- nach Updates empfiehlt sich ein kurzer Funktionstest von Login, Mandantenauswahl, Löschkonzept und Export/Druck


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


## Automatische Backups

PrivaShield unterstützt jetzt eine eingebaute Backup-Routine mit stündlicher Scheduler-Ausführung in der App.

Wichtig:
- für automatische verschlüsselte Backups muss `PRIVASHIELD_BACKUP_PASSWORD` in der Container-Umgebung gesetzt werden
- ohne diese Umgebungsvariable schlägt ein automatischer verschlüsselter Lauf bewusst fehl
- manuelle verschlüsselte Läufe können das Kennwort weiterhin über die Oberfläche erhalten

Retention:
- 24 stündlich
- 7 täglich
- 4 wöchentlich
- 12 monatlich
- 2 jährlich

Wenn verschlüsselte automatische Backups genutzt werden sollen, setze zusätzlich:

```env
PRIVASHIELD_BACKUP_PASSWORD=dein-sicheres-backup-kennwort
```

## Exportierbare interne Notizen

Zusätzlich gibt es einen eigenen Bereich für mandantenbezogene interne Notizen. Diese werden nur dann in den Export übernommen, wenn sie ausdrücklich für den Export freigegeben wurden.

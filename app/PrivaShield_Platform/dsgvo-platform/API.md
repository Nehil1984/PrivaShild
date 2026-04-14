# API.md

## Zweck
Diese Datei dokumentiert die aktuell verfügbaren Backend-APIs der DSGVO-Plattform (`dsgvo-platform`), damit Frontend, externe Integrationen und spätere Erweiterungen konsistent auf dieselben Endpunkte zugreifen.

## Basisregeln
- Basispräfix: `/api`
- Authentifizierung: `Authorization: Bearer <token>`
- Antwortformat: JSON
- Schreibende Endpunkte validieren gegen `shared/schema.ts`
- Mandantenbezogene Zugriffe werden zusätzlich über Rollen und Mandantenzuordnung geprüft

## Rollenlogik
- **admin**: voller Zugriff
- **user / dsb**: nur auf zugeordnete Mandanten
- einige Verwaltungsendpunkte sind **nur für admin** freigegeben

---

## 1. Auth

### POST `/api/auth/login`
Login und Token-Ausgabe.

**Body**
```json
{
  "email": "admin@example.org",
  "password": "<PASSWORT>"
}
```

**Response**
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "admin@example.org",
    "name": "Admin",
    "role": "admin",
    "mandantIds": "[]",
    "aktiv": true
  }
}
```

### GET `/api/auth/me`
Liefert den aktuell eingeloggten Benutzer.

---

## 2. Benutzerverwaltung (admin)

### GET `/api/users`
Liste aller Benutzer.

### POST `/api/users`
Benutzer anlegen.

### PUT `/api/users/:id`
Benutzer aktualisieren.

### DELETE `/api/users/:id`
Benutzer löschen.

---

## 3. Mandanten

### GET `/api/mandanten`
Liste aller sichtbaren Mandanten.

### GET `/api/mandanten/:id`
Einzelnen Mandanten laden.

### POST `/api/mandanten`
Mandant anlegen.

### PUT `/api/mandanten/:id`
Mandant aktualisieren.

### DELETE `/api/mandanten/:id`
Mandant löschen.

### GET `/api/mandanten/:id/logs`
Mandantenbezogenes Änderungs-/Auditlog.

### GET `/api/mandanten/:id/vorlagen-historie`
Historie angewendeter Vorlagenpakete.

### GET `/api/mandanten/:id/stats`
Kennzahlen pro Mandant.

**Aktuelle Stats-Felder**
- `vvt`
- `avv`
- `dsfa`
- `datenpannen`
- `dsr`
- `tom`
- `audits`
- `loeschkonzept`
- `aufgaben`
- `offeneAufgaben`
- `dokumente`

---

## 4. Mandantengruppen

### GET `/api/mandanten-gruppen`
Gruppenliste.

### POST `/api/mandanten-gruppen`
Gruppe anlegen (admin).

### PUT `/api/mandanten-gruppen/:id`
Gruppe aktualisieren (admin).

### DELETE `/api/mandanten-gruppen/:id`
Gruppe löschen (admin).

---

## 5. Vorlagenpakete

### GET `/api/vorlagenpakete`
Alle Vorlagenpakete laden.

### POST `/api/vorlagenpakete`
Vorlagenpaket anlegen (admin).

### PUT `/api/vorlagenpakete/:id`
Vorlagenpaket aktualisieren (admin).

### DELETE `/api/vorlagenpakete/:id`
Vorlagenpaket löschen (admin).

### POST `/api/mandanten/:id/vorlagenpakete/:paketId/apply`
Vorlagenpaket auf einen Mandanten anwenden.

### POST `/api/gruppen/:gruppenId/vorlagenpakete/:paketId/apply`
Vorlagenpaket gruppenweit anwenden (admin).

---

## 6. Fachmodule pro Mandant
Für die meisten Fachmodule gilt ein einheitliches CRUD-Schema.

### Listen-Endpunkt
`GET /api/mandanten/:mid/<modul>`

### Einzel-Endpunkt
`GET /api/<modul>/:id`

### Anlegen
`POST /api/mandanten/:mid/<modul>`

### Aktualisieren
`PUT /api/<modul>/:id`

### Löschen
`DELETE /api/<modul>/:id`

### Aktuell verfügbare Module
- `vvt`
- `avv`
- `dsfa`
- `datenpannen`
- `dsr`
- `tom`
- `audits`
- `loeschkonzept`
- `aufgaben`
- `dokumente`

---

## 7. Wichtige Modulinhalte

### VVT
Zentrale Felder u. a.:
- `bezeichnung`
- `zweck`
- `rechtsgrundlage`
- `verantwortlicher`
- `verantwortlicherEmail`
- `verantwortlicherTelefon`
- `loeschfrist`
- `loeschklasse`
- `aufbewahrungsgrund`
- `datenkategorien`
- `betroffenePersonen`
- `empfaenger`
- `tomHinweis`
- `dsfa`
- `drittlandtransfer`

### AVV
Zentrale Felder u. a.:
- `auftragsverarbeiter`
- `gegenstand`
- `vertragsdatum`
- `laufzeit`
- `status`
- `sccs`
- `avKontaktName`
- `avKontaktEmail`
- `avKontaktTelefon`
- `genehmigteSubdienstleister`
- `datenarten`
- `betroffenePersonen`
- `technischeMassnahmen`
- `pruefintervall`
- `pruefFaellig`
- `subauftragnehmerHinweis`

### Datenpannen
Zentrale Felder u. a.:
- `titel`
- `beschreibung`
- `entdecktAm`
- `entdecktUm`
- `gemeldetAm`
- `gemeldetUm`
- `frist72h`
- `meldepflichtig`
- `behoerdeMeldung`
- `betroffenInformiert`
- `schwere`
- `status`

### Audits
Zentrale Felder u. a.:
- `titel`
- `auditart`
- `pruefbereich`
- `auditdatum`
- `auditor`
- `status`
- `ergebnis`
- `scope`
- `methode`
- `feststellungen`
- `positiveAspekte`
- `abweichungen`
- `empfehlungen`
- `followUpDatum`
- `naechstesAuditAm`

### Löschkonzept
Zentrale Felder u. a.:
- `bezeichnung`
- `datenart`
- `loeschklasse`
- `fristKategorie`
- `gesetzlicheFrist`
- `aufbewahrungsfrist`
- `loeschereignis`
- `rechtsgrundlage`
- `systeme`
- `verantwortlicher`
- `loeschverantwortlicher`
- `kontrolle`
- `nachweis`
- `quelleVvtId`
- `quelleVvtBezeichnung`
- `status`

---

## 8. Admin / System

### GET `/api/admin/db-config`
Aktives Datenbank-Backend lesen.

### POST `/api/admin/db-config`
Backend umstellen.

**Body**
```json
{
  "backend": "lowdb"
}
```

Erlaubte Werte:
- `lowdb`
- `sqlite`

---

## 9. API-Konsistenzprüfung, aktueller Stand

### Positiv
Die wichtigsten neuen Fachmodule sind API-seitig vorhanden:
- Audits
- Löschkonzept
- erweiterte VVT-/AVV-/Datenpannenfelder laufen über die bestehenden CRUD-Endpunkte mit
- Stats liefern das neue Feld `loeschkonzept`

### Aktueller technischer Befund
Die API-Struktur ist grundsätzlich konsistent aufgebaut, weil sie weitgehend über die generische `crudRoutes(...)`-Factory läuft.

### Meta- und Hilfs-APIs

1. **GET `/api/meta/loeschfristen`**
   - liefert Fristgruppen, Standardfristen und gesetzliche Referenzen zentral aus dem Backend

2. **GET `/api/meta/branchen`**
   - liefert Standard-Branchen für Mandantenanlage und Pflege

3. **GET `/api/meta/vvt-loeschmapping`**
   - liefert die fachliche Zuordnung von VVT-Mustern zu Löschklasse, Fristgruppe und Referenz

4. **POST `/api/mandanten/:mid/loeschkonzept/import-vvt/:vvtId`**
   - erzeugt einen serverseitigen Löschkonzept-Draft aus einem vorhandenen VVT-Eintrag

5. **GET `/api/mandanten/:mid/export-context`**
   - zentrale Sammel-API für Export-/Druckkontexte mit Mandant, Logs, Stats und Modul-Daten

---

## 10. Entwicklungsregel
Wenn neue Module ergänzt werden, müssen in der Regel immer diese Stellen geprüft werden:
- `shared/schema.ts`
- `server/storage.ts`
- `server/storage-lowdb.ts`
- `server/storage-sqlite.ts`
- `server/routes.ts`
- `client/src/App.tsx`

Sonst brechen Typisierung, Storage-Interface oder Laufzeitpfade auseinander.

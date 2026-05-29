# 2026-05-12 – VulnLedger

- VulnLedger Hotfix-Release 0.3.2 umgesetzt und veröffentlicht.
- Ausgangslage: Daniel meldete "nach dem Login wird nichts geladen". Zunächst wurde das falsche Projekt (PrivaShield) betrachtet; danach Korrektur auf das tatsächliche Projekt `app/VulnLedger/vuln-ledger`.
- Analyse: In `src/App.tsx` verwendete VulnLedger eine zentrale `api<T>()`-Funktion, die erfolgreiche Antworten immer mit `response.json()` geparsed hat. Bei gecachten Browser-Antworten mit `304 Not Modified` und leerem Body konnte das den Post-Login-Ladepfad blockieren, obwohl Auth und Folge-Requests technisch durchliefen.
- Fix: `src/App.tsx` um `parseApiJson<T>()` erweitert. Antworten mit `304`, `204`, `205` sowie leere Bodies werden jetzt robust behandelt, statt blind JSON zu parsen.
- Version auf `0.3.2` erhöht.
- Verifikation:
  - `npm run build:full`
  - `npm run lint`
- Git:
  - Commit: `7d8ebfd`
  - Message: `fix: handle empty cached api responses`
  - Push auf `master` erfolgreich
  - Branch `0.3.2` erstellt und gepusht

- Anschluss-Hotfix 0.3.3 umgesetzt und veröffentlicht.
- Browser-Screenshot zeigte weiterhin leere Seite bei gleichzeitigem `304 Not Modified` nicht nur auf API-Requests, sondern bereits auf dem HTML-Dokument und den App-Ressourcen. Das sprach für ein Cache-/App-Shell-Problem im Auslieferungspfad.
- Fix in `server/index.ts`: statische HTML-Auslieferung für die App-Shell auf `Cache-Control: no-store, no-cache, must-revalidate` umgestellt sowie `etag`/`lastModified` dort effektiv entschärft; fingerprinted Assets bleiben stark cachebar (`public, max-age=31536000, immutable`).
- Version auf `0.3.3` erhöht.
- Verifikation:
  - `npm run build:full`
  - `npm run lint`
- Git:
  - Commit: `98e9010`
  - Message: `fix: disable html caching for app shell`
  - Push auf `master` erfolgreich
  - Branch `0.3.3` erstellt und gepusht

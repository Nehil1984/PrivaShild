# Hardening-Nächste-Schritte

## Bereits umgesetzt
- JWT_SECRET als Pflichtwert
- Login-Rate-Limit
- Security-Headers
- gehärtete Mandanten-Zugriffskontrolle
- Initial-Admin nur per Umgebungsvariablen
- Test-Grundgerüst mit Vitest

## Noch sinnvoll

### 1. Passwortregeln
Empfehlung:
- mindestens 12 Zeichen
- Groß-/Kleinbuchstaben
- Zahl
- Sonderzeichen
- serverseitige Prüfung bei Benutzeranlage und Passwortänderung

### 2. Audit-/Änderungsprotokoll ausbauen
Empfehlung:
- Login-Erfolg / Login-Fehlschlag loggen
- Admin-Aktionen gesondert markieren
- alte und neue Werte bei Updates stärker strukturieren
- eigene Audit-Kategorie für sicherheitsrelevante Events

### 3. Input-Validierung zentralisieren
Empfehlung:
- bestehende Zod-Schemas aus `shared/schema.ts` stärker im API-Layer nutzen
- Request-Bodies vor create/update validieren
- einheitliche 400-Fehler mit Feldhinweisen zurückgeben

### 4. UI-/Browser-Tests
Blocker aktuell:
- kein unterstützter Browser auf dem Host installiert

Empfehlung:
- Chromium oder Chrome auf dem Host bereitstellen
- danach Playwright einführen
- erste UI-Smoke-Tests für Login, Mandantenauswahl, CRUD, Logout

### 5. Architekturprüfung bei Session-/CSRF-Themen
Aktuell arbeitet die App tokenbasiert per Bearer-Header.
Falls später cookie-basierte Sessions oder Mischmodelle kommen:
- CSRF-Strategie neu bewerten
- SameSite/Secure/HttpOnly sauber konfigurieren

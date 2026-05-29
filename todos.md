# todos.md – Strategisches Aufgaben-Backlog für PrivaShield & DSDMS

Dieses Dokument dient als langfristiges operative Backlog für funktionale Erweiterungen, Sicherheits-Härtungen und Automatisierungen in **PrivaShield** und **DSDMS**.

---

## 🛡️ PRIVASHIELD – Backlog

### 🟥 CORE (Kritische Härtung & Sicherheit)
- [ ] **Mandanten-Upgrade-Wizard für DSDMS-Preset-Updates**
  *   *Konzept:* Ein interaktiver Upgrade-Assistent in den Admin-Einstellungen. Bei Erhöhung des Vorlagenpakets auf v1.18.0+ wird ein visueller Diff der Standardtexte angezeigt, um ein kontrolliertes Zusammenführen (Merge) unter Behalt lokaler Mandanten-Änderungen zu ermöglichen.
- [ ] **Härtung der Backup-Restore-Sicherheit & Prüfprotokoll**
  *   *Konzept:* Automatische Integritätsprüfung (Dry-Run) von Backup-Dateien bei Erstellung. Generierung eines kryptografisch signierten SHA-256-Hash-Prüfprotokolls im UI für Audit-Zwecke.

### 🟧 IMPORTANT (Funktionaler Mehrwert & Usability)
- [ ] **Interaktive TOM-zu-VVT-Verknüpfung mit Schutzniveau-Ampel**
  *   *Konzept:* Einbindung eines interaktiven TOM-Auswählers direkt im VVT-Bearbeitungsformular. Automatische Berechnung und visuelle Darstellung des technischen Schutzniveaus (Niedrig, Normal, Hoch) basierend auf der TOM-Abdeckung.
- [ ] **Automatisierter DSFA-Risiko-Rechner bei VVT-Auswahl**
  *   *Konzept:* Automatische Vorbefüllung der DSFA-Schwellenwertprüfung bei Auswahl einer DSDMS-VVT. Dynamische Berechnung von Brutto- und Netto-Risiko vor und nach Anwendung der verknüpften TOMs.

### 🟨 CASUAL / 🟩 MINOR (Komfort & Design)
- [ ] **Erweitertes PDF-Design-System & Logo-Upload**
  *   *Konzept:* Möglichkeit zum Upload eines Firmenlogos im Mandanten-Profil. Auswahl zwischen verschiedenen Premium-Export-Designstilen (Executive-Blau, Minimalist-Dark, Druckfreundlich) mit automatischen Deckblättern und Inhaltsverzeichnissen.

---

## 📚 DSDMS – Backlog

### 🟥 CORE (Integrität & Konformität)
- [ ] **Zentralisiertes Snippet-Config-CLI (`npm run configure`)**
  *   *Konzept:* Interaktives CLI-Skript, das den Nutzer beim ersten Setup durch alle globalen Snippet-Variablen (Firmenname, Anschrift, DSB, Domains) führt, diese speichert und die gesamte Bibliothek personalisiert.
- [ ] **Dokumenten-Konformitäts-Linter vor Git-Commits**
  *   *Konzept:* Pre-Commit-Hook (`scripts/lint-anonymity.js`), der Dateien scannt und Commits abbricht, falls nicht-anonymisierte Daten (Klarnamen, Telefonnummern, E-Mails) ohne Snippet-Variable gefunden werden.

### 🟧 IMPORTANT (Automatisierung & Build-Skalierung)
- [ ] **Selektives PDF-Kompilierungssystem**
  *   *Konzept:* Erweiterung des `makefile` um Parameter-gestützte Builds (z. B. `make build-vvt` oder `make compile DOC=path/to/file.md`), um einzelne Dokumente blitzschnell zu kompilieren, ohne den ressourcenintensiven Komplett-Build aller 467 Dateien anstoßen zu müssen.
- [ ] **Automatischer CalDAV/ICS-Wiedervorlage-Generator**
  *   *Konzept:* Ein CLI-Skript, das die YAML-Metadaten (`review-date`) aller Markdown-Dateien scannt und eine standardisierte `.ics`-Kalenderdatei generiert, die in Outlook/Apple Calendar abonniert werden kann.

### 🟨 CASUAL / 🟩 MINOR (Komfort & QA)
- [ ] **HTML-Interactive-Previewer für Dokumente**
  *   *Konzept:* Leichtgewichtiger lokaler Preview-Server (`npm run preview`), der Markdown-Dateien mit Live-Reload in Echtzeit in einer modernen, responsive HTML-Ansicht rendert, um Layouts vor dem PDF-Build zu prüfen.

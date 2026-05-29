// Automatically generated from DSDMS TOM templates
export const allTomTemplates: Record<string, {
  massnahme: string;
  kategorie: string;
  beschreibung: string;
  status: string;
  verantwortlicher: string;
  pruefintervall: string;
  schutzziel: string;
  nachweis: string;
  wirksamkeit: string;
  notizen: string;
}> = {
  "dsdms_tom_alarmanlage": {
    "massnahme": "BSI INF.1.A12: Einbruchmeldeanlage (EMA)",
    "kategorie": "zutrittskontrolle",
    "beschreibung": "Physischer Schutz der Geschäftsräume durch eine VdS-zertifizierte Einbruchmeldeanlage mit Aufschaltung zu einem Sicherheitsdienst (Notruf- und Serviceleitstelle).",
    "status": "implementiert",
    "verantwortlicher": "Facility Management",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit und Verfügbarkeit",
    "nachweis": "Wartungsvertrag, Abnahmeprotokoll der Errichterfirma, Protokollbuch Alarme",
    "wirksamkeit": "hoch",
    "notizen": "In Kombination mit mechanischer Fenstersicherung und Knaufbeschlägen."
  },
  "dsdms_tom_schluesselregelung": {
    "massnahme": "BSI ORP.4.A5: Schlüssel- und Transponderregelung",
    "kategorie": "zutrittskontrolle",
    "beschreibung": "Regelung zur personalisierten Vergabe von Schlüsseln und elektronischen Zutrittstranspondern. Protokollierte Ausgabe, Entzug und Verlustmeldungen.",
    "status": "implementiert",
    "verantwortlicher": "Personalabteilung / HR",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "Schlüsselübergabe-Protokolle, ausgelesenes Zutrittsprotokoll des Transpondersystems",
    "wirksamkeit": "hoch",
    "notizen": "Bei Transponderverlust erfolgt eine sofortige systemseitige Sperrung."
  },
  "dsdms_tom_besucherkonzept": {
    "massnahme": "BSI ORP.1.A3: Besuchermanagement und Begleitpflicht",
    "kategorie": "zutrittskontrolle",
    "beschreibung": "Alle betriebsfremden Personen müssen sich am Empfang registrieren (Besucherbuch) und werden während des gesamten Aufenthalts im Gebäude durch Beschäftigte begleitet.",
    "status": "implementiert",
    "verantwortlicher": "Empfang / Office Management",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "Besucherbuch (revisionssicher geführt), interne Dienstanweisung Besucherkonzept",
    "wirksamkeit": "hoch",
    "notizen": "Besucherausweise müssen während des gesamten Aufenthalts sichtbar getragen werden."
  },
  "dsdms_tom_benutzerlogin": {
    "massnahme": "BSI ORP.4.A9: Benutzeranmeldung mit starkem Passwort",
    "kategorie": "zugangskontrolle",
    "beschreibung": "Erzwingung einer Anmeldung an allen Firmencomputern und Systemen über personalisierte Konten mit starkem Passwort (GPO-erzwungen: min. 12 Zeichen, Sonderzeichen, Zahlen, Sperrung nach 5 Fehlversuchen).",
    "status": "implementiert",
    "verantwortlicher": "IT-Administration",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit und Integrität",
    "nachweis": "Active Directory GPO-Report, Passwortrichtlinie",
    "wirksamkeit": "hoch",
    "notizen": "Standard-Benutzerkonten haben keine lokalen Administratorrechte."
  },
  "dsdms_tom_mfa": {
    "massnahme": "BSI ORP.4.A21: Mehr-Faktor-Authentisierung (MFA)",
    "kategorie": "zugangskontrolle",
    "beschreibung": "Absicherung aller administrativen Zugänge, Cloud-Konten (M365 / AWS) und Remote-Einwahlen (VPN) durch die Erzwingung von Multi-Faktor-Authentisierung (MFA).",
    "status": "implementiert",
    "verantwortlicher": "IT-Administration / ISB",
    "pruefintervall": "halbjährlich",
    "schutzziel": "Vertraulichkeit und Integrität",
    "nachweis": "MFA-Aktivierungsstatistik, Azure AD / Microsoft 365 Security GPO Compliance-Report",
    "wirksamkeit": "hoch",
    "notizen": "Nutzung der Authenticator-App auf firmeneigenen Smartphones bevorzugt."
  },
  "dsdms_tom_antivirus": {
    "massnahme": "BSI OPS.1.1.4.A3: Zentral verwaltete Endpoint-Protection",
    "kategorie": "zugangskontrolle",
    "beschreibung": "Einsatz einer modernen Antiviren- und Endpoint-Detection-and-Response (EDR) Software auf allen Clients, Servern und mobilen Endgeräten. Zentrales Cloud-Monitoring der Signaturen.",
    "status": "implementiert",
    "verantwortlicher": "IT-Betrieb",
    "pruefintervall": "jährlich",
    "schutzziel": "Integrität und Verfügbarkeit",
    "nachweis": "Systemstatus-Report der Antiviren-Managementkonsole, automatisiertes Rollout-Log",
    "wirksamkeit": "hoch",
    "notizen": "Tägliche automatische Signatur- und Engine-Updates über das zentrale IT-Management."
  },
  "dsdms_tom_firewall": {
    "massnahme": "BSI NET.3.2: Next-Generation Firewall (NGFW)",
    "kategorie": "zugangskontrolle",
    "beschreibung": "Absicherung der Netzwerkgrenzen durch eine Next-Generation Firewall mit integriertem Deep Packet Inspection, IPS (Intrusion Prevention) und Content-Filtering.",
    "status": "implementiert",
    "verantwortlicher": "IT-Infrastruktur / Netzwerke",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit, Integrität und Verfügbarkeit",
    "nachweis": "Firewall-Regelwerk-Auditbericht, Logfile-Analysen der Intrusion-Prevention-Events",
    "wirksamkeit": "hoch",
    "notizen": "Inbound-Traffic ist standardmäßig blockiert (Default Deny Regel)."
  },
  "dsdms_tom_vpn": {
    "massnahme": "BSI NET.3.3: VPN-Verschlüsselung für Remote-Arbeit",
    "kategorie": "zugangskontrolle",
    "beschreibung": "Sämtliche Verbindungen von externen Standorten (Homeoffice, Unterwegs) in das Firmennetzwerk dürfen ausschließlich über einen verschlüsselten IPsec- oder WireGuard-VPN-Tunnel erfolgen.",
    "status": "implementiert",
    "verantwortlicher": "IT-Infrastruktur",
    "pruefintervall": "halbjährlich",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "VPN-Serverkonfiguration, Einwahlprotokolle, MDM-Compliance-Zertifikat",
    "wirksamkeit": "hoch",
    "notizen": "Gekoppelt mit der Erzwingung von MFA bei der VPN-Einwahl."
  },
  "dsdms_tom_bitlocker": {
    "massnahme": "BSI CON.1.A1: Festplattenvollverschlüsselung (BitLocker)",
    "kategorie": "zugangskontrolle",
    "beschreibung": "Vollständige Verschlüsselung der Festplatten (BitLocker für Windows, FileVault für macOS, AES-256) auf allen portablen Firmengeräten (Laptops, Tablets) gegen Datenabfluss bei Verlust oder Diebstahl.",
    "status": "implementiert",
    "verantwortlicher": "IT-Support",
    "pruefintervall": "quartalsweise",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "Zentraler Report aus dem MDM-System (Microsoft Intune), Wiederherstellungsschlüssel im AD hinterlegt",
    "wirksamkeit": "hoch",
    "notizen": "BitLocker-Aktivierung ist eine zwingende Voraussetzung für das Rollout eines Laptops."
  },
  "dsdms_tom_berechtigungskonzept": {
    "massnahme": "BSI ORP.4.A4: Need-to-Know Berechtigungs- und Rollenkonzept",
    "kategorie": "zugriffskontrolle",
    "beschreibung": "Zugriffsberechtigungen für Netzlaufwerke, ERP- und CRM-Systeme werden restriktiv auf Basis von Funktionsrollen und ausschließlich nach dem Minimalprinzip (Need-to-Know) vergeben.",
    "status": "implementiert",
    "verantwortlicher": "IT / Abteilungsleiter",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "Rollenberechtigungsmatrix, schriftliche Freigaben für Sonderrechte, halbjährlicher Rezertifizierungsbericht",
    "wirksamkeit": "hoch",
    "notizen": "Sonderrechte erlöschen automatisch bei Abteilungswechsel oder Ausscheiden."
  },
  "dsdms_tom_loeschkonzept": {
    "massnahme": "BSI CON.6.A1: Regelbasiertes Lösch- und Vernichtungskonzept",
    "kategorie": "zugriffskontrolle",
    "beschreibung": "Umsetzung einer Richtlinie mit definierten Aufbewahrungs- und Löschfristen für sämtliche Systemklassen. Automatisierte oder strukturierte Löschläufe von Altdaten.",
    "status": "geplant",
    "verantwortlicher": "Datenschutzbeauftragter / IT",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit und Datenminimierung",
    "nachweis": "Schriftliches Löschkonzept (nach DIN 66398), Protokoll des letzten automatisierten Löschvorgangs",
    "wirksamkeit": "mittel",
    "notizen": "Besonderer Fokus auf Alt-Bewerbungen (Löschung nach 6 Monaten) und Alt-Finanzdaten (10 Jahre)."
  },
  "dsdms_tom_schredder": {
    "massnahme": "BSI CON.6.A12: Sichere Aktenvernichtung (DIN 66399)",
    "kategorie": "zugriffskontrolle",
    "beschreibung": "Entsorgung aller papierhaften Dokumente mit personenbezogenem Inhalt ausschließlich über zertifizierte Aktenvernichter der Sicherheitsstufe P-3 (Cross-Cut) oder in verschlossenen Datenschutz-Sammelbehältern zur externen Schredderung.",
    "status": "implementiert",
    "verantwortlicher": "Office Management",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "Kaufbeleg/Gerätedatenblatt Büroschredder (Stufe P-3), Entsorgungszertifikat des externen Aktenvernichtungsdienstes",
    "wirksamkeit": "hoch",
    "notizen": "Dienstanweisung: Kein ungeschredderter Einwurf sensibler Papiere in den Hausmüll."
  },
  "dsdms_tom_testsysteme": {
    "massnahme": "BSI OPS.1.1.6.A13: Trennung von Entwicklungs- und Produktivumgebungen",
    "kategorie": "trennung",
    "beschreibung": "Vollständige physikalische und logische Trennung aller Test-, Entwicklungs- und Live-Produktivsysteme. Keine Verwendung echter personenbezogener Kundendaten in Entwicklungs- oder Testumgebungen.",
    "status": "implementiert",
    "verantwortlicher": "Software Engineering / DevOps",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit und Integrität",
    "nachweis": "Netzwerkstrukturplan (physikalisch getrenntes Entwickler-Subnetz), Anonymisierungsskripte für Test-Datenbanken",
    "wirksamkeit": "hoch",
    "notizen": "Entwickler haben keinen Zugriff auf Live-Produktionsdatenbanken."
  },
  "dsdms_tom_mandantentrennung": {
    "massnahme": "DSDMS: Logische Datentrennung und Mandantenfähigkeit",
    "kategorie": "trennung",
    "beschreibung": "Sicherstellung der logischen Datentrennung in CRM, ERP und Datenbanken durch saubere Applikations- und Mandantenarchitekturen, so dass Datenflüsse strikt getrennt verarbeitet werden.",
    "status": "implementiert",
    "verantwortlicher": "IT-Systeme / Entwicklung",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "Architektur-Review, Quellcode-Audit, SQL-Row-Level-Security Richtlinie",
    "wirksamkeit": "hoch",
    "notizen": "Regelmäßige Penetrationtests prüfen auf SQL-Injection und Mandantenübergriffe."
  },
  "dsdms_tom_mailencrypt": {
    "massnahme": "BSI APP.5.3.A2: E-Mail Transportverschlüsselung (TLS)",
    "kategorie": "weitergabe",
    "beschreibung": "Erzwingung einer sicheren Transportverschlüsselung (Opportunistic TLS 1.2 / TLS 1.3, Perfect Forward Secrecy) auf allen Mailservern. Optional: Inhaltsverschlüsselung (S/MIME oder PGP) für vertrauliche Korrespondenz.",
    "status": "implementiert",
    "verantwortlicher": "IT-Administration / Mail-Ops",
    "pruefintervall": "halbjährlich",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "Mailserver-Konfigurationsprotokoll, Verschlüsselungsstatistiken ausgehender E-Mails, SSL-Labs Mailserver Report",
    "wirksamkeit": "hoch",
    "notizen": "E-Mails an Empfänger ohne TLS-Unterstützung werden nur nach ausdrücklicher Risikoabwägung gesendet."
  },
  "dsdms_tom_sftp": {
    "massnahme": "BSI APP.3.3.A6: Verschlüsselte Dateiübertragung (SFTP/HTTPS)",
    "kategorie": "weitergabe",
    "beschreibung": "Die Weitergabe von großen Dateien mit personenbezogenem Inhalt an Kunden oder Partner erfolgt ausschließlich über verschlüsselte HTTPS-Downloadlinks oder gesicherte SFTP-Server.",
    "status": "implementiert",
    "verantwortlicher": "IT-Support",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "SFTP-Benutzerkonfiguration, TLS-Konfigurations-Audit des Webportals",
    "wirksamkeit": "hoch",
    "notizen": "Links werden nach 7 Tagen automatisch gelöscht."
  },
  "dsdms_tom_auditlogs": {
    "massnahme": "BSI OPS.1.1.2.A5: Revisionssicheres System-Logging (Audit Trails)",
    "kategorie": "eingabe",
    "beschreibung": "Aktivierung manipulationssicherer Protokollierung (Audit Trails) aller sicherheits- und datenschutzrelevanten Aktionen (Eingabe, Änderung, Löschung) in Datenbanken, ERP- und CRM-Systemen.",
    "status": "implementiert",
    "verantwortlicher": "IT-Betrieb",
    "pruefintervall": "jährlich",
    "schutzziel": "Integrität und Nachvollziehbarkeit",
    "nachweis": "Log-Richtlinie, Auszug aus dem revisionssicheren Log-Archiv (WORM-Speicher), Systemkonfiguration",
    "wirksamkeit": "hoch",
    "notizen": "Zugriff auf Systemlogs ist streng limitiert und wird ebenfalls protokolliert."
  },
  "dsdms_tom_userident": {
    "massnahme": "DSDMS: Personenbezogene Benutzerkonten",
    "kategorie": "eingabe",
    "beschreibung": "Verbot von unpersönlichen Gruppenkonten (z.B. 'admin', 'hr', 'support') für Systemzugänge. Jede Eingabe und Änderung muss eindeutig einer natürlichen Person zugeordnet werden können.",
    "status": "implementiert",
    "verantwortlicher": "IT-Administration",
    "pruefintervall": "jährlich",
    "schutzziel": "Nachvollziehbarkeit",
    "nachweis": "Active Directory Benutzerliste, Dienstanweisung zur IT-Nutzung",
    "wirksamkeit": "hoch",
    "notizen": "Ein Verstoß gegen das Verbot der Account-Teilung führt zu arbeitsrechtlichen Konsequenzen."
  },
  "dsdms_tom_backup": {
    "massnahme": "BSI CON.3.A4: Backup- und Notfallwiederherstellung",
    "kategorie": "verfuegbarkeit",
    "beschreibung": "Tägliches inkrementelles und wöchentliches vollständiges Backup aller geschäftsrelevanten Systeme. Verschlüsselte Lagerung der Backups in einer separaten Brandzone sowie einer gesicherten Offline-Cloud (Immutable Backups).",
    "status": "implementiert",
    "verantwortlicher": "IT-Betrieb / Backup-Admin",
    "pruefintervall": "jährlich",
    "schutzziel": "Verfügbarkeit",
    "nachweis": "Backup-Konzept, tägliche E-Mail-Berichte über erfolgreiche Backups, Wartungsbericht",
    "wirksamkeit": "hoch",
    "notizen": "Schutz vor Ransomware durch physische Trennung (Air-Gap) der Backup-Systeme."
  },
  "dsdms_tom_restoretest": {
    "massnahme": "BSI CON.3.A15: Regelmäßige Datenwiederherstellungstests",
    "kategorie": "verfuegbarkeit",
    "beschreibung": "Halbjährliche praktische Durchführung von Wiederherstellungstests (Restores) ganzer Server, Datenbanken und einzelner Dateien zur Gewährleistung der Funktionstüchtigkeit im Ernstfall.",
    "status": "implementiert",
    "verantwortlicher": "IT-Support",
    "pruefintervall": "halbjährlich",
    "schutzziel": "Verfügbarkeit",
    "nachweis": "Restore-Prüfprotokoll mit dokumentierten RTO (Recovery Time Objective) und RPO (Recovery Point Objective)",
    "wirksamkeit": "hoch",
    "notizen": "Ergebnisse werden im Management-Review des ISMS ausgewertet."
  },
  "dsdms_tom_usv": {
    "massnahme": "BSI INF.2.A3: Unterbrechungsfreie Stromversorgung (USV)",
    "kategorie": "verfuegbarkeit",
    "beschreibung": "Absicherung aller zentralen Netzwerkkomponenten, Switches und Server im Hauptverteiler durch eine unterbrechungsfreie Stromversorgung (USV) zur Überbrückung von Spannungsspitzen und kurzzeitigen Stromausfällen.",
    "status": "implementiert",
    "verantwortlicher": "Facility Management / IT",
    "pruefintervall": "halbjährlich",
    "schutzziel": "Verfügbarkeit",
    "nachweis": "USV-Selbsttestprotokolle, Wartungsvertrag Akkumulatoren",
    "wirksamkeit": "hoch",
    "notizen": "Bei längerem Ausfall wird ein automatisierter, kontrollierter Shutdown der Server initiiert."
  },
  "dsdms_tom_brandschutz": {
    "massnahme": "BSI INF.1.A4: Brandschutz und Brandmeldeanlagen",
    "kategorie": "verfuegbarkeit",
    "beschreibung": "Ausstattung aller Server- und Büroräume mit Rauchwarnmeldern gekoppelt mit Handfeuerlöschern (CO2-Löscher für IT-Bereiche).",
    "status": "implementiert",
    "verantwortlicher": "Brandschutzbeauftragter / Facility Management",
    "pruefintervall": "jährlich",
    "schutzziel": "Verfügbarkeit und Schutz von Sachwerten",
    "nachweis": "Prüfplaketten auf Feuerlöschern, Wartungsprotokoll der Rauchmelder",
    "wirksamkeit": "hoch",
    "notizen": "Jährliche Unterweisung der Beschäftigten in der Bedienung von Feuerlöschern."
  },
  "dsdms_tom_avvpruefung": {
    "massnahme": "DSDMS: Vorherige Prüfung und Abschluss von AVVs",
    "kategorie": "auftrag",
    "beschreibung": "Vor Einbindung eines neuen Dienstleisters, der personenbezogene Daten verarbeitet, erfolgt eine formelle datenschutzrechtliche Prüfung der TOMs des Dienstleisters und der Abschluss eines schriftlichen AVVs nach Art. 28 DSGVO.",
    "status": "implementiert",
    "verantwortlicher": "Einkauf / Datenschutzbeauftragter",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit und Nachvollziehbarkeit",
    "nachweis": "AVV-Verzeichnis, Prüfberichte der Dienstleister-TOMs",
    "wirksamkeit": "hoch",
    "notizen": "Standardisiertes Prüfformular für Dienstleister-TOMs im Einsatz."
  },
  "dsdms_tom_wartung": {
    "massnahme": "DSDMS: Sicherheitsvorgaben für Fernwartung (Wartungsvertrag)",
    "kategorie": "auftrag",
    "beschreibung": "Jegliche Fernwartung oder technischer Support durch externe Dienstleister darf ausschließlich über verschlüsselte und personalisierte Verbindungen erfolgen. Fernwartungssitzungen bedürfen einer vorherigen expliziten Freigabe und müssen lückenlos protokolliert werden.",
    "status": "implementiert",
    "verantwortlicher": "IT-Administration",
    "pruefintervall": "jährlich",
    "schutzziel": "Vertraulichkeit",
    "nachweis": "Freigabedokumentation im Ticketsystem, Fernwartungsprotokoll (Session Recording/Logs)",
    "wirksamkeit": "hoch",
    "notizen": "Integrierte Zuweisung temporärer Einmal-Adminschnittstellen."
  }
};

// Automatically generated from DSDMS TOM templates with dynamic language support
export const getAllTomTemplates = (lang: string): Record<string, {
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
}> => {
  const de: Record<string, any> = {
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
      "notizen": "Inbound-Traffic is standardmäßig blockiert (Default Deny Regel)."
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
      "beschreibung": "Jegliche Fernwartung oder technischer Support durch externe Dienstleister darf ausschließlich über verschlüsselte und personalisierte Verbindungen. Fernwartungssitzungen bedürfen einer vorherigen expliziten Freigabe und müssen lückenlos protokolliert werden.",
      "status": "implementiert",
      "verantwortlicher": "IT-Administration",
      "pruefintervall": "jährlich",
      "schutzziel": "Vertraulichkeit",
      "nachweis": "Freigabedokumentation im Ticketsystem, Fernwartungsprotokoll (Session Recording/Logs)",
      "wirksamkeit": "hoch",
      "notizen": "Integrierte Zuweisung temporärer Einmal-Adminschnittstellen."
    }
  };

  const en: Record<string, any> = {
    "dsdms_tom_alarmanlage": {
      "massnahme": "BSI INF.1.A12: Intruder Detection System (EMA)",
      "kategorie": "zutrittskontrolle",
      "beschreibung": "Physical protection of business premises through a VdS-certified intruder detection system with connection to a security service.",
      "status": "implementiert",
      "verantwortlicher": "Facility Management",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality and Availability",
      "nachweis": "Maintenance contract, acceptance report of the installer, alarm logbook",
      "wirksamkeit": "high",
      "notizen": "In combination with mechanical window locks and security handles."
    },
    "dsdms_tom_schluesselregelung": {
      "massnahme": "BSI ORP.4.A5: Key and Transponder Policy",
      "kategorie": "zutrittskontrolle",
      "beschreibung": "Policy for personalized issuance of keys and electronic access transponders. Documented issuance, revocation, and loss reports.",
      "status": "implementiert",
      "verantwortlicher": "Human Resources / HR",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality",
      "nachweis": "Key hand-over logs, read-out access log of the transponder system",
      "wirksamkeit": "high",
      "notizen": "In case of transponder loss, immediate system-side blocking is executed."
    },
    "dsdms_tom_besucherkonzept": {
      "massnahme": "BSI ORP.1.A3: Visitor Management and Escort Requirement",
      "kategorie": "zutrittskontrolle",
      "beschreibung": "All external visitors must register at the reception (visitor log) and be accompanied by employees during their entire stay in the building.",
      "status": "implementiert",
      "verantwortlicher": "Reception / Office Management",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality",
      "nachweis": "Visitor logbook (audit-proof), internal service instruction visitor concept",
      "wirksamkeit": "high",
      "notizen": "Visitor badges must be worn visibly during the entire stay."
    },
    "dsdms_tom_benutzerlogin": {
      "massnahme": "BSI ORP.4.A9: User Login with Strong Password",
      "kategorie": "zugangskontrolle",
      "beschreibung": "Enforcement of logins on all company computers and systems using personalized accounts with a strong password (GPO-enforced: min. 12 characters, special characters, numbers, locking after 5 failed attempts).",
      "status": "implementiert",
      "verantwortlicher": "IT Administration",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality and Integrity",
      "nachweis": "Active Directory GPO report, password policy",
      "wirksamkeit": "high",
      "notizen": "Standard user accounts do not have local administrator rights."
    },
    "dsdms_tom_mfa": {
      "massnahme": "BSI ORP.4.A21: Multi-Factor Authentication (MFA)",
      "kategorie": "zugangskontrolle",
      "beschreibung": "Securing all administrative access, cloud accounts (M365 / AWS) and remote dials (VPN) by enforcing multi-factor authentication (MFA).",
      "status": "implementiert",
      "verantwortlicher": "IT Administration / ISB",
      "pruefintervall": "semi-annually",
      "schutzziel": "Confidentiality and Integrity",
      "nachweis": "MFA activation statistics, Azure AD / Microsoft 365 Security GPO Compliance report",
      "wirksamkeit": "high",
      "notizen": "Preferred use of Authenticator app on company-owned smartphones."
    },
    "dsdms_tom_antivirus": {
      "massnahme": "BSI OPS.1.1.4.A3: Centrally Managed Endpoint Protection",
      "kategorie": "zugangskontrolle",
      "beschreibung": "Deployment of modern antivirus and endpoint detection and response (EDR) software on all clients, servers and mobile devices. Central cloud monitoring of signatures.",
      "status": "implementiert",
      "verantwortlicher": "IT Operations",
      "pruefintervall": "annually",
      "schutzziel": "Integrity and Availability",
      "nachweis": "System status report of the antivirus management console, automated rollout log",
      "wirksamkeit": "high",
      "notizen": "Daily automatic signature and engine updates via central IT management."
    },
    "dsdms_tom_firewall": {
      "massnahme": "BSI NET.3.2: Next-Generation Firewall (NGFW)",
      "kategorie": "zugangskontrolle",
      "beschreibung": "Securing network borders using a Next-Generation Firewall with integrated Deep Packet Inspection, IPS (Intrusion Prevention) and Content Filtering.",
      "status": "implementiert",
      "verantwortlicher": "IT Infrastructure / Networks",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality, Integrity and Availability",
      "nachweis": "Firewall rulebook audit report, log file analysis of intrusion prevention events",
      "wirksamkeit": "high",
      "notizen": "Inbound traffic is blocked by default (Default Deny rule)."
    },
    "dsdms_tom_vpn": {
      "massnahme": "BSI NET.3.3: VPN Encryption for Remote Work",
      "kategorie": "zugangskontrolle",
      "beschreibung": "All connections from external locations (home office, on the go) into the company network must be made exclusively through an encrypted IPsec or WireGuard VPN tunnel.",
      "status": "implementiert",
      "verantwortlicher": "IT Infrastructure",
      "pruefintervall": "semi-annually",
      "schutzziel": "Confidentiality",
      "nachweis": "VPN server configuration, login logs, MDM compliance certificate",
      "wirksamkeit": "high",
      "notizen": "Coupled with enforcing MFA upon VPN login."
    },
    "dsdms_tom_bitlocker": {
      "massnahme": "BSI CON.1.A1: Full Disk Encryption (BitLocker)",
      "kategorie": "zugangskontrolle",
      "beschreibung": "Complete encryption of hard drives (BitLocker for Windows, FileVault for macOS, AES-256) on all portable company devices (laptops, tablets) against data leakage in case of loss or theft.",
      "status": "implementiert",
      "verantwortlicher": "IT Support",
      "pruefintervall": "quarterly",
      "schutzziel": "Confidentiality",
      "nachweis": "Central report from MDM system (Microsoft Intune), recovery keys stored in AD",
      "wirksamkeit": "high",
      "notizen": "BitLocker activation is a mandatory requirement for laptop rollout."
    },
    "dsdms_tom_berechtigungskonzept": {
      "massnahme": "BSI ORP.4.A4: Need-to-Know Role and Authorization Concept",
      "kategorie": "zugriffskontrolle",
      "beschreibung": "Access authorizations for network drives, ERP and CRM systems are granted restrictively on the basis of functional roles and exclusively according to the minimal principle (Need-to-Know).",
      "status": "implementiert",
      "verantwortlicher": "IT / Department Heads",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality",
      "nachweis": "Role authorization matrix, written approvals for special rights, semi-annual recertification report",
      "wirksamkeit": "high",
      "notizen": "Special rights expire automatically upon department change or leaving the company."
    },
    "dsdms_tom_loeschkonzept": {
      "massnahme": "BSI CON.6.A1: Rule-Based Deletion and Destruction Concept",
      "kategorie": "zugriffskontrolle",
      "beschreibung": "Implementation of a guideline with defined retention and deletion periods for all system classes. Automated or structured deletion runs of legacy data.",
      "status": "geplant",
      "verantwortlicher": "Data Protection Officer / IT",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality and Data Minimization",
      "nachweis": "Written deletion concept (according to DIN 66398), log of the last automated deletion process",
      "wirksamkeit": "medium",
      "notizen": "Special focus on old applications (deletion after 6 months) and old financial data (10 years)."
    },
    "dsdms_tom_schredder": {
      "massnahme": "BSI CON.6.A12: Secure Document Destruction (DIN 66399)",
      "kategorie": "zugriffskontrolle",
      "beschreibung": "Disposal of all paper documents containing personal data exclusively via certified document shredders of security level P-3 (cross-cut) or in locked data protection collection containers for external shredding.",
      "status": "implementiert",
      "verantwortlicher": "Office Management",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality",
      "nachweis": "Purchase receipt/spec sheet office shredder (Level P-3), disposal certificate of external destruction service",
      "wirksamkeit": "high",
      "notizen": "Service instruction: No unshredded disposal of sensitive paper into household waste."
    },
    "dsdms_tom_testsysteme": {
      "massnahme": "BSI OPS.1.1.6.A13: Separation of Development and Production Environments",
      "kategorie": "trennung",
      "beschreibung": "Complete physical and logical separation of all test, development and live production systems. No use of real personal customer data in development or test environments.",
      "status": "implementiert",
      "verantwortlicher": "Software Engineering / DevOps",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality and Integrity",
      "nachweis": "Network structure plan (physically separated developer subnet), anonymization scripts for test databases",
      "wirksamkeit": "high",
      "notizen": "Developers have no access to live production databases."
    },
    "dsdms_tom_mandantentrennung": {
      "massnahme": "DSDMS: Logical Data Separation and Multi-Tenancy",
      "kategorie": "trennung",
      "beschreibung": "Ensuring logical data separation in CRM, ERP and databases through clean application and multi-tenant architectures so that data flows are processed strictly separated.",
      "status": "implementiert",
      "verantwortlicher": "IT Systems / Development",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality",
      "nachweis": "Architecture review, source code audit, SQL Row-Level-Security guideline",
      "wirksamkeit": "high",
      "notizen": "Regular penetration tests check for SQL injection and tenant bypasses."
    },
    "dsdms_tom_mailencrypt": {
      "massnahme": "BSI APP.5.3.A2: E-Mail Transport Encryption (TLS)",
      "kategorie": "weitergabe",
      "beschreibung": "Enforcement of secure transport encryption (Opportunistic TLS 1.2 / TLS 1.3, Perfect Forward Secrecy) on all mail servers. Optional: Content encryption (S/MIME or PGP) for confidential correspondence.",
      "status": "implementiert",
      "verantwortlicher": "IT Administration / Mail-Ops",
      "pruefintervall": "semi-annually",
      "schutzziel": "Confidentiality",
      "nachweis": "Mail server configuration log, encryption statistics for outgoing e-mails, SSL-Labs Mailserver report",
      "wirksamkeit": "high",
      "notizen": "E-mails to recipients without TLS support are only sent after explicit risk assessment."
    },
    "dsdms_tom_sftp": {
      "massnahme": "BSI APP.3.3.A6: Encrypted File Transfer (SFTP/HTTPS)",
      "kategorie": "weitergabe",
      "beschreibung": "Transmission of large files with personal content to customers or partners is done exclusively via encrypted HTTPS download links or secured SFTP servers.",
      "status": "implementiert",
      "verantwortlicher": "IT Support",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality",
      "nachweis": "SFTP user configuration, TLS configuration audit of the web portal",
      "wirksamkeit": "high",
      "notizen": "Links are automatically deleted after 7 days."
    },
    "dsdms_tom_auditlogs": {
      "massnahme": "BSI OPS.1.1.2.A5: Audit Trails (Revisionssicheres System-Logging)",
      "kategorie": "eingabe",
      "beschreibung": "Activation of tamper-proof logging (audit trails) of all security and data protection-relevant actions (input, change, deletion) in databases, ERP and CRM systems.",
      "status": "implementiert",
      "verantwortlicher": "IT Operations",
      "pruefintervall": "annually",
      "schutzziel": "Integrity and Auditability",
      "nachweis": "Log policy, extract from audit-proof log archive (WORM storage), system configuration",
      "wirksamkeit": "high",
      "notizen": "Access to system logs is strictly limited and also logged."
    },
    "dsdms_tom_userident": {
      "massnahme": "DSDMS: Personalized User Accounts",
      "kategorie": "eingabe",
      "beschreibung": "Prohibition of impersonal group accounts (e.g. 'admin', 'hr', 'support') for system access. Any input and change must be uniquely assignable to a natural person.",
      "status": "implementiert",
      "verantwortlicher": "IT Administration",
      "pruefintervall": "annually",
      "schutzziel": "Auditability",
      "nachweis": "Active Directory user list, service instruction for IT usage",
      "wirksamkeit": "high",
      "notizen": "Violation of account sharing ban leads to labor law consequences."
    },
    "dsdms_tom_backup": {
      "massnahme": "BSI CON.3.A4: Backup and Disaster Recovery",
      "kategorie": "verfuegbarkeit",
      "beschreibung": "Daily incremental and weekly full backup of all business-critical systems. Encrypted storage of backups in a separate fire zone and a secure offline cloud (Immutable Backups).",
      "status": "implementiert",
      "verantwortlicher": "IT Operations / Backup Admin",
      "pruefintervall": "annually",
      "schutzziel": "Availability",
      "nachweis": "Backup concept, daily email reports on successful backups, maintenance report",
      "wirksamkeit": "high",
      "notizen": "Protection against ransomware through physical separation (air-gap) of backup systems."
    },
    "dsdms_tom_restoretest": {
      "massnahme": "BSI CON.3.A15: Regular Data Restore Tests",
      "kategorie": "verfuegbarkeit",
      "beschreibung": "Semi-annual practical execution of recovery tests (restores) of entire servers, databases and individual files to ensure operational capability in an emergency.",
      "status": "implementiert",
      "verantwortlicher": "IT Support",
      "pruefintervall": "semi-annually",
      "schutzziel": "Availability",
      "nachweis": "Restore test protocol with documented RTO (Recovery Time Objective) and RPO (Recovery Point Objective)",
      "wirksamkeit": "high",
      "notizen": "Results are evaluated in the ISMS management review."
    },
    "dsdms_tom_usv": {
      "massnahme": "BSI INF.2.A3: Uninterruptible Power Supply (UPS)",
      "kategorie": "verfuegbarkeit",
      "beschreibung": "Securing all central network components, switches and servers in the main distributor by an uninterruptible power supply (UPS) to bridge voltage spikes and short-term power failures.",
      "status": "implementiert",
      "verantwortlicher": "Facility Management / IT",
      "pruefintervall": "semi-annually",
      "schutzziel": "Availability",
      "nachweis": "UPS self-test logs, battery maintenance contract",
      "wirksamkeit": "high",
      "notizen": "In case of prolonged power failure, an automated, controlled server shutdown is initiated."
    },
    "dsdms_tom_brandschutz": {
      "massnahme": "BSI INF.1.A4: Fire Protection and Fire Alarm Systems",
      "kategorie": "verfuegbarkeit",
      "beschreibung": "Equipping all server and office rooms with smoke alarms coupled with fire extinguishers (CO2 extinguishers for IT areas).",
      "status": "implementiert",
      "verantwortlicher": "Fire Protection Officer / Facility Management",
      "pruefintervall": "annually",
      "schutzziel": "Availability and asset protection",
      "nachweis": "Test stickers on fire extinguishers, maintenance log of smoke detectors",
      "wirksamkeit": "high",
      "notizen": "Annual instruction of employees on fire extinguisher operation."
    },
    "dsdms_tom_avvpruefung": {
      "massnahme": "DSDMS: Prior Verification and Conclusion of DPAs",
      "kategorie": "auftrag",
      "beschreibung": "Before integrating a new service provider who processes personal data, a formal data protection review of the provider's TOMs and the conclusion of a written DPA according to Art. 28 GDPR is conducted.",
      "status": "implementiert",
      "verantwortlicher": "Purchasing / Data Protection Officer",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality and Auditability",
      "nachweis": "DPA directory, audit reports of provider TOMs",
      "wirksamkeit": "high",
      "notizen": "Standardized review form for provider TOMs in use."
    },
    "dsdms_tom_wartung": {
      "massnahme": "DSDMS: Security Specifications for Remote Maintenance (Maintenance Contract)",
      "kategorie": "auftrag",
      "beschreibung": "Any remote maintenance or technical support by external service providers must be carried out exclusively via encrypted and personalized connections. Remote maintenance sessions require explicit prior approval and must be logged completely.",
      "status": "implementiert",
      "verantwortlicher": "IT Administration",
      "pruefintervall": "annually",
      "schutzziel": "Confidentiality",
      "nachweis": "Release documentation in the ticket system, remote maintenance log (session recording/logs)",
      "wirksamkeit": "high",
      "notizen": "Integrated allocation of temporary single-use admin interfaces."
    }
  };

  return lang === "en" ? en : de;
};

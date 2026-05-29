// Dynamic translation helpers for PrivaShield DSGVO-Platform

// 1. Dropdown and Label Helpers
export function getRechtsgrundlageLabel(value: string, lang: string): string {
  if (lang === "de") return value;
  const mappings: Record<string, string> = {
    "Art. 6 Abs. 1 lit. a (Einwilligung)": "Art. 6 (1) (a) GDPR (Consent)",
    "Art. 6 Abs. 1 lit. b (Vertrag)": "Art. 6 (1) (b) GDPR (Contract)",
    "Art. 6 Abs. 1 lit. c (rechtl. Verpflichtung)": "Art. 6 (1) (c) GDPR (Legal obligation)",
    "Art. 6 Abs. 1 lit. d (lebenswichtige Interessen)": "Art. 6 (1) (d) GDPR (Vital interests)",
    "Art. 6 Abs. 1 lit. e (öffentliche Aufgabe)": "Art. 6 (1) (e) GDPR (Public task)",
    "Art. 6 Abs. 1 lit. f (berechtigtes Interesse)": "Art. 6 (1) (f) GDPR (Legitimate interest)"
  };
  return mappings[value] || value;
}

export function getDsrArtLabel(value: string, lang: string): string {
  const dsrArtenDe: Record<string, string> = {
    auskunft: "Auskunft (Art. 15)", berichtigung: "Berichtigung (Art. 16)", loeschung: "Löschung (Art. 17)",
    einschraenkung: "Einschränkung (Art. 18)", portabilitaet: "Datenübertragbarkeit (Art. 20)", widerspruch: "Widerspruch (Art. 21)"
  };
  const dsrArtenEn: Record<string, string> = {
    auskunft: "Access (Art. 15)", berichtigung: "Rectification (Art. 16)", loeschung: "Erasure (Art. 17)",
    einschraenkung: "Restriction (Art. 18)", portabilitaet: "Data Portability (Art. 20)", widerspruch: "Objection (Art. 21)"
  };
  return lang === "en" ? (dsrArtenEn[value] || value) : (dsrArtenDe[value] || value);
}

export function getTomKategorieLabel(value: string, lang: string): string {
  const tomKategorienDe: Record<string, string> = {
    zutrittskontrolle: "Zutrittskontrolle", zugangskontrolle: "Zugangskontrolle", zugriffskontrolle: "Zugriffskontrolle",
    weitergabe: "Weitergabekontrolle", eingabe: "Eingabekontrolle", auftrag: "Auftragskontrolle",
    verfuegbarkeit: "Verfügbarkeitskontrolle", trennung: "Trennungsgebot"
  };
  const tomKategorienEn: Record<string, string> = {
    zutrittskontrolle: "Physical Access Control", zugangskontrolle: "System Access Control", zugriffskontrolle: "Data Access Control",
    weitergabe: "Transmission Control", eingabe: "Input Control", auftrag: "Job Control",
    verfuegbarkeit: "Availability Control", trennung: "Separation Rule"
  };
  return lang === "en" ? (tomKategorienEn[value] || value) : (tomKategorienDe[value] || value);
}

// Dictionary of exact translation replacements for known terms
const terminologyDict: Record<string, string> = {
  // Common categories
  "Stammdaten": "Master data",
  "Kontaktdaten": "Contact data",
  "Vertragsdaten": "Contractual data",
  "Abrechnungsdaten": "Billing data",
  "Arbeitsleistungsdaten": "Performance data",
  "Arbeitszeiten": "Working hours",
  "Verbindungsdaten": "Connection logs",
  "Administratorendaten": "Administrator logs",
  "Zugangsdaten": "Credentials",
  "Kommunikationsdaten": "Communication data",
  "Inhaltsdaten": "Content data",
  "Metadaten": "Metadata",
  "Bilddaten": "Image data",
  "Zeitstempel": "Timestamps",
  "Bankverbindung": "Bank details",
  "Bankverbindungs- und Zahlungsinformationen": "Bank and payment information",
  
  // Data subjects
  "Beschäftigte": "Employees",
  "Kunden": "Customers",
  "Partner": "Partners",
  "Bewerber": "Applicants",
  "Besucher": "Visitors",
  "Dienstleister": "Service providers",
  "Lieferanten": "Suppliers",
  "Interessenten": "Prospects",
  "ehemalige Beschäftigte": "Former employees",
  "Mitglieder": "Members",
  
  // Recipients
  "Interne Fachabteilungen": "Internal departments",
  "Lohnbuchhaltung": "Payroll department",
  "Personalabteilung": "HR department",
  "IT-Administration": "IT administration",
  "Geschäftsführung": "Management",
  "Fachabteilung / Team": "Department / Team",
  "Auftragsverarbeiter": "Processors",
  "Behörden": "Authorities",
  "Finanzamt": "Tax office",
  "Steuerberater": "Tax advisor",
  "Sozialversicherungsträger": "Social security agencies",
  
  // Retention & Trigger
  "gesetzliche Vorgaben": "legal requirements",
  "10 Jahre nach Jahresabschluss": "10 years after annual accounts",
  "3 Jahre nach Ablauf des Kalenderjahres": "3 years after end of calendar year",
  "6 Monate nach Beendigung": "6 months after completion",
  "sofort": "immediately",
  "nach Widerruf": "after withdrawal",
  "Beendigung des Arbeitsverhältnisses": "termination of employment",
  
  // TOM Hints & general BSI references
  "Siehe TOM-Richtlinie des Unternehmens (BSI IT-Grundschutz)": "See company TOM policy (based on BSI IT-Grundschutz)",
  
  // Core template titles
  "Abgleich Embargolisten": "Sanction List Screening",
  "Abonnentenverwaltung": "Subscriber Management",
  "Administrationsservice": "Administration Service",
  "Ahnen  und Abstammungsforschung": "Ancestry and Genealogy Research",
  "Akkordlohnerfassung elektronisch": "Electronic Piece Rate Tracking",
  "Akkordlohnerfassung manuell": "Manual Piece Rate Tracking",
  "Akkreditierungsdatenbank": "Accreditation Database",
  "Angebotserstellung": "Proposal Generation",
  "Applikationsservice": "Application Service",
  "Arbeitsplatz Sonderausstattungen": "Workplace Special Equipment",
  "Arbeitszeitverwaltung Mindestlohn": "Working Time Tracking (Minimum Wage)",
  "Arbeitszeitverwaltung Mindestlohn manuell gefuehrt": "Manual Working Time Tracking (Minimum Wage)",
  "Archivierung elektronischer Empfangsquittungen": "Archiving Electronic Delivery Receipts",
  "Archivierung manueller Empfangsquittungen": "Archiving Manual Delivery Receipts",
  "Aus  und Weiterbildung": "Training and Further Education",
  "Auskunftsanfragen": "Data Subject Access Requests",
  "Ausleihverzeichnis": "Lending Directory",
  "Automatisierte Postverteilung": "Automated Mail Distribution",
  "Barkasse manuelle Kassenabrechnung": "Cash Register Manual Reconciliation",
  "Beirats Management": "Advisory Board Management",
  "Beitragsverwaltung": "Contribution Management",
  "Besucherregistrierung": "Visitor Registration",
  "Beteiligungsverwaltung": "Shareholder Management",
  "Betriebliche Altersversorgung": "Company Pension Scheme",
  "Betriebliches Eingliederungsmanagement": "Occupational Integration Management",
  "Betriebliches Vorschlagswesen": "Company Suggestion Scheme",
  "Betriebskostenabrechnung": "Operating Cost Accounting",
  "Betriebsratswahlen": "Works Council Elections",
  "Betriebsrenten Verwaltung": "Company Pension Scheme Administration",
  "Betriebssportverwaltung": "Company Sports Administration",
  "Bewerberauswahl manuell gefuehrt": "Manual Candidate Selection",
  "Bewerberverfahren": "Applicant Procedure",
  "Biometrische Zutrittskontrolle": "Biometric Access Control",
  "Blog Login": "Blog Login",
  "Bonitaetspruefung": "Credit Check",
  "Callcenter Gespraechsaufzeichnung": "Call Center Call Recording",
  "Casting und Talentmanagement": "Casting and Talent Management",
  "Cloud Anwendungen": "Cloud Applications",
  "Compliance Pruefungen": "Compliance Audits",
  "Contractmanagement": "Contract Management",
  "CRM ERP Systeme": "CRM ERP Systems",
  "Datenschutzschulungen": "Data Protection Training",
  "Dienstplanung": "Duty Scheduling",
  "Dienstreisenplanung": "Business Travel Planning",
  "Dokumentenmanagement": "Document Management",
  "E Learning System": "E-Learning System",
  "E Mail Verfahren": "E-Mail Procedure",
  "Einwilligungsdatenbank": "Consent Database",
  "Elektronische Zeiterfassung": "Electronic Time Tracking",
  "Elektronischer Zahlungsverkehr": "Electronic Payment Transactions",
  "Ersthelferorganisation": "First Aider Organization",
  "Externe Zahlungsabwicklung": "External Payment Processing",
  "Fahrkostenabrechnung": "Travel Expense Accounting",
  "Fahrtenschreiberverwaltung": "Tachograph Administration",
  "Fahrzeug Bussgeldzahlungen": "Vehicle Fine Payments",
  "Fahrzeugkostenabrechnung": "Vehicle Cost Accounting",
  "Fahrzeugverleih": "Vehicle Rental"
};

// Intelligent text translator for fields in German BSI VVT and TOM templates
export function translateText(text: string | undefined, lang: string): string {
  if (!text || lang !== "en") return text || "";
  
  // Try exact match first
  const trimmed = text.trim();
  if (terminologyDict[trimmed]) return terminologyDict[trimmed];
  
  // Substring replacement for lists (comma separated, etc.)
  let translated = text;
  
  // Sort keys by length descending to avoid greedy partial replacement of words
  const sortedKeys = Object.keys(terminologyDict).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    if (key.length > 3) { // Avoid replacing very short words blindly
      const regex = new RegExp(`\\b${escapeRegExp(key)}\\b`, "gi");
      translated = translated.replace(regex, terminologyDict[key]);
    }
  }
  
  // Translate standard GDPR legal basis formats
  translated = translated
    .replace(/Art\.\s*6\s*Abs\.\s*1\s*lit\.\s*a/g, "Art. 6 (1) (a) GDPR")
    .replace(/Art\.\s*6\s*Abs\.\s*1\s*lit\.\s*b/g, "Art. 6 (1) (b) GDPR")
    .replace(/Art\.\s*6\s*Abs\.\s*1\s*lit\.\s*c/g, "Art. 6 (1) (c) GDPR")
    .replace(/Art\.\s*6\s*Abs\.\s*1\s*lit\.\s*d/g, "Art. 6 (1) (d) GDPR")
    .replace(/Art\.\s*6\s*Abs\.\s*1\s*lit\.\s*e/g, "Art. 6 (1) (e) GDPR")
    .replace(/Art\.\s*6\s*Abs\.\s*1\s*lit\.\s*f/g, "Art. 6 (1) (f) GDPR")
    .replace(/§\s*26\s*BDSG/g, "Sec. 26 BDSG")
    .replace(/BSI IT-Grundschutz/g, "BSI IT-Baseline Protection")
    .replace(/Vertrag/gi, "Contract")
    .replace(/Einwilligung/gi, "Consent")
    .replace(/berechtigtes Interesse/gi, "legitimate interest");

  return translated;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 2. VVT Template Translator
export function translateVvtTemplate(t: any, lang: string) {
  if (lang !== "en") return t;
  return {
    ...t,
    bezeichnung: translateText(t.bezeichnung, "en"),
    zweck: translateText(t.zweck, "en"),
    rechtsgrundlage: translateText(t.rechtsgrundlage, "en"),
    verantwortlicher: translateText(t.verantwortlicher, "en"),
    loeschfrist: translateText(t.loeschfrist, "en"),
    datenkategorien: translateText(t.datenkategorien, "en"),
    betroffenePersonen: translateText(t.betroffenePersonen, "en"),
    empfaenger: translateText(t.empfaenger, "en"),
    tomHinweis: translateText(t.tomHinweis, "en")
  };
}

// 3. TOM Template Translator
export function translateTomTemplate(t: any, lang: string) {
  if (lang !== "en") return t;
  return {
    ...t,
    massnahme: translateText(t.massnahme, "en"),
    beschreibung: translateText(t.beschreibung, "en"),
    verantwortlicher: translateText(t.verantwortlicher, "en"),
    pruefintervall: translateText(t.pruefintervall, "en"),
    schutzziel: translateText(t.schutzziel, "en")
      .replace(/Vertraulichkeit/g, "Confidentiality")
      .replace(/Integrität/g, "Integrity")
      .replace(/Verfügbarkeit/g, "Availability"),
    nachweis: translateText(t.nachweis, "en"),
    wirksamkeit: translateText(t.wirksamkeit, "en")
      .replace(/hoch/g, "high")
      .replace(/mittel/g, "medium")
      .replace(/niedrig/g, "low"),
    notizen: translateText(t.notizen, "en")
  };
}

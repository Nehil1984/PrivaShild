// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

/**
 * LowDB-basierter Storage (JSON-Datei-Backend)
 * Implementiert dasselbe IStorage-Interface wie DatabaseStorage
 */
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import bcrypt from "bcryptjs";
import type { IStorage } from "./storage.js";
import type {
  Mandant, InsertMandant,
  MandantenGruppe, InsertMandantenGruppe,
  Vorlagenpaket, InsertVorlagenpaket,
  MandantenLog, InsertMandantenLog,
  VorlagenpaketHistorie, InsertVorlagenpaketHistorie,
  User, InsertUser,
  Vvt, InsertVvt,
  Avv, InsertAvv,
  Dsfa, InsertDsfa,
  Datenpanne, InsertDatenpanne,
  Dsr, InsertDsr,
  Tom, InsertTom,
  Audit, InsertAudit,
  Pdca, InsertPdca,
  Loeschkonzept, InsertLoeschkonzept,
  Aufgabe, InsertAufgabe,
  Dokument, InsertDokument,
  InterneNotiz, InsertInterneNotiz,
} from "@shared/schema";

interface DbSchema {
  meta: { nextId: Record<string, number> };
  mandanten: Mandant[];
  mandantenGruppen: MandantenGruppe[];
  vorlagenpakete: Vorlagenpaket[];
  mandantenLogs: MandantenLog[];
  vorlagenpaketHistorie: VorlagenpaketHistorie[];
  users: User[];
  vvt: Vvt[];
  avv: Avv[];
  dsfa: Dsfa[];
  datenpannen: Datenpanne[];
  dsr: Dsr[];
  tom: Tom[];
  audits: Audit[];
  pdca: Pdca[];
  loeschkonzept: Loeschkonzept[];
  aufgaben: Aufgabe[];
  dokumente: Dokument[];
  interneNotizen: InterneNotiz[];
}

export const defaultData: DbSchema = {
  meta: { nextId: {} },
  mandanten: [],
  mandantenGruppen: [],
  vorlagenpakete: [
    {
      id: 1,
      name: "DSGVO Basispaket",
      beschreibung: "Grundpaket mit Leitlinien, Aufgaben und Basisdokumentation.",
      kategorie: "datenschutz",
      version: "1.0",
      aktiv: true,
      inhaltJson: JSON.stringify({
        aufgaben: [
          { titel: "Verzeichnis der Verarbeitungstätigkeiten prüfen", typ: "task", prioritaet: "hoch", status: "offen", kategorie: "vvt" },
          { titel: "Datenschutzleitlinie abstimmen", typ: "milestone", prioritaet: "mittel", status: "offen", kategorie: "dokumente" }
        ],
        dokumente: [
          { titel: "Datenschutzleitlinie", kategorie: "leitlinie_datenschutz", status: "entwurf", version: "1.0" },
          { titel: "Verfahrensdokumentation Verarbeitungstätigkeiten", kategorie: "verfahrensdokumentation", status: "entwurf", version: "1.0" }
        ]
      }),
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Microsoft 365 Copilot – Datenschutz- & Compliance-Paket",
      beschreibung: "Musterpaket für datenschutzrechtliche Bewertung, Governance und Dokumentation beim Einsatz von Microsoft 365 Copilot.",
      kategorie: "ki-compliance",
      version: "1.0",
      aktiv: true,
      inhaltJson: JSON.stringify({
        meta: {
          templateKey: "m365-copilot-compliance",
          templateLabel: "Microsoft 365 Copilot – Datenschutz- & Compliance-Paket",
          scope: "ki-compliance",
          source: "interne Fachvorlage TOM / DSGVO",
          notes: "Bewertungs- und Umsetzungspaket, keine pauschale Freigabe",
        },
        aufgaben: [
          {
            titel: "Microsoft 365 Copilot: AVV / DPA prüfen",
            beschreibung: "Prüfung des Auftragsverarbeitungsverhältnisses mit Microsoft, inklusive Data Processing Addendum, Product Terms und dokumentierter Datenschutzgarantien.",
            typ: "task",
            prioritaet: "hoch",
            status: "offen",
            kategorie: "avv",
            sortierung: 10,
          },
          {
            titel: "Microsoft 365 Copilot: Subprocessor-Liste dokumentieren",
            beschreibung: "Herstellerangaben zu Unterauftragsverarbeitern erfassen, bewerten und intern dokumentieren.",
            typ: "task",
            prioritaet: "hoch",
            status: "offen",
            kategorie: "avv",
            sortierung: 20,
          },
          {
            titel: "Microsoft 365 Copilot: EU Data Boundary und Drittlandbezug prüfen",
            beschreibung: "Prüfen, welche Datenflüsse innerhalb der EU/EWR verbleiben und welche optionalen Funktionen, Support- oder Integrationsszenarien Drittlandbezüge auslösen können.",
            typ: "task",
            prioritaet: "hoch",
            status: "offen",
            kategorie: "vvt",
            sortierung: 30,
          },
          {
            titel: "Microsoft 365 Copilot: Berechtigungsreview für Teams, SharePoint und OneDrive durchführen",
            beschreibung: "Oversharing-Risiken identifizieren; Freigaben, Link-Sharing, Gruppen- und Rollenberechtigungen gezielt überprüfen.",
            typ: "task",
            prioritaet: "kritisch",
            status: "offen",
            kategorie: "tom",
            sortierung: 40,
          },
          {
            titel: "Microsoft 365 Copilot: sensible Datenquellen identifizieren",
            beschreibung: "Bereiche mit besonders sensiblen, vertraulichen oder berufsgeheimnisgeschützten Daten erfassen und gesondert bewerten.",
            typ: "task",
            prioritaet: "kritisch",
            status: "offen",
            kategorie: "dsfa",
            sortierung: 50,
          },
          {
            titel: "Microsoft 365 Copilot: Ausschluss- und Einschränkungskonzept festlegen",
            beschreibung: "Festlegen, welche Datenquellen, Bibliotheken oder Arbeitsbereiche vom Einsatz ausgenommen oder technisch eingeschränkt werden sollen.",
            typ: "task",
            prioritaet: "hoch",
            status: "offen",
            kategorie: "tom",
            sortierung: 60,
          },
          {
            titel: "Microsoft 365 Copilot: VVT-Eintrag erstellen",
            beschreibung: "Verarbeitungstätigkeit für den Einsatz von Microsoft 365 Copilot mit Zweck, Datenkategorien, Betroffenengruppen, Empfängern und Drittlandprüfung dokumentieren.",
            typ: "task",
            prioritaet: "hoch",
            status: "offen",
            kategorie: "vvt",
            sortierung: 70,
          },
          {
            titel: "Microsoft 365 Copilot: DSFA durchführen",
            beschreibung: "Datenschutz-Folgenabschätzung mit Risikobewertung, Maßnahmenkatalog, Restrisikoanalyse und ggf. Art.-36-Prüfung durchführen.",
            typ: "milestone",
            prioritaet: "kritisch",
            status: "offen",
            kategorie: "dsfa",
            sortierung: 80,
          },
          {
            titel: "Microsoft 365 Copilot: DSB-Stellungnahme einholen",
            beschreibung: "Datenschutzbeauftragten in die Bewertung einbinden und Stellungnahme dokumentieren.",
            typ: "task",
            prioritaet: "hoch",
            status: "offen",
            kategorie: "dsfa",
            sortierung: 90,
          },
          {
            titel: "Microsoft 365 Copilot: Betriebsrat / Mitbestimmung prüfen",
            beschreibung: "Prüfen, ob und in welchem Umfang Mitbestimmungsrechte berührt sind; Dokumentation und Abstimmung vorbereiten.",
            typ: "task",
            prioritaet: "hoch",
            status: "offen",
            kategorie: "dokumente",
            sortierung: 100,
          },
          {
            titel: "Microsoft 365 Copilot: Mitarbeiterinformation erstellen",
            beschreibung: "Datenschutzbezogene Information für Beschäftigte zum Einsatz von Copilot und zur Verarbeitung personenbezogener Daten vorbereiten.",
            typ: "task",
            prioritaet: "mittel",
            status: "offen",
            kategorie: "dokumente",
            sortierung: 110,
          },
          {
            titel: "Microsoft 365 Copilot: KI-Nutzungsrichtlinie abstimmen",
            beschreibung: "Regeln für zulässige Nutzung, unzulässige Eingaben, Verifikation von Ergebnissen und Umgang mit sensiblen Daten festlegen.",
            typ: "milestone",
            prioritaet: "hoch",
            status: "offen",
            kategorie: "dokumente",
            sortierung: 120,
          },
          {
            titel: "Microsoft 365 Copilot: Review-Termin festlegen",
            beschreibung: "Regelmäßige Überprüfung von Konfiguration, Risiken, Dokumentation und Herstellerangaben terminieren.",
            typ: "review",
            prioritaet: "mittel",
            status: "offen",
            kategorie: "dsfa",
            sortierung: 130,
          },
        ],
        dokumente: [
          {
            titel: "Mitarbeiterinformation – Microsoft 365 Copilot",
            kategorie: "vorlage",
            dokumentTyp: "information",
            status: "entwurf",
            version: "1.0",
            inhalt: "Zweck der Vorlage: Information der Beschäftigten über Einsatz, Datenverarbeitung, Zwecke, Empfänger, Schutzmaßnahmen und Rechte im Zusammenhang mit Microsoft 365 Copilot.",
          },
          {
            titel: "KI-Nutzungsrichtlinie – Microsoft 365 Copilot",
            kategorie: "richtlinie",
            dokumentTyp: "richtlinie",
            status: "entwurf",
            version: "1.0",
            inhalt: "Zweck der Vorlage: Regelung zulässiger Anwendungsfälle, Verbot sensibler Eingaben ohne Freigabe, Pflicht zur Ergebnisprüfung, Verantwortlichkeiten und Eskalationswege.",
          },
          {
            titel: "Prüfvermerk AVV / DPA – Microsoft 365 Copilot",
            kategorie: "vertrag",
            dokumentTyp: "pruefvermerk",
            status: "entwurf",
            version: "1.0",
            inhalt: "Zweck der Vorlage: Dokumentation der Prüfung von DPA, Product Terms, Subprozessoren, EU Data Boundary, SCC-Konstellationen und Restrisiken.",
          },
          {
            titel: "DSFA-Freigabevermerk – Microsoft 365 Copilot",
            kategorie: "risikobewertung",
            dokumentTyp: "freigabevermerk",
            status: "entwurf",
            version: "1.0",
            inhalt: "Zweck der Vorlage: Management-/DSB-Freigabe der DSFA, dokumentierte Restrisiken, Maßnahmenstatus und Reviewtermin.",
          },
          {
            titel: "Mitbestimmungs- / Betriebsratsnotiz – Microsoft 365 Copilot",
            kategorie: "protokoll",
            dokumentTyp: "vermerk",
            status: "entwurf",
            version: "1.0",
            inhalt: "Zweck der Vorlage: Dokumentation mitbestimmungsrelevanter Aspekte, Gesprächsstände, Abgrenzung zur Leistungs- und Verhaltenskontrolle und offene Punkte.",
          },
          {
            titel: "Management Summary – Einführung Microsoft 365 Copilot",
            kategorie: "verfahrensdokumentation",
            dokumentTyp: "management-summary",
            status: "entwurf",
            version: "1.0",
            inhalt: "Zweck der Vorlage: Verdichtete Managemententscheidung zu Nutzen, Risiken, Maßnahmen, Freigabebedingungen und Reviewpflichten.",
          },
        ],
        vvt: [
          {
            bezeichnung: "Microsoft 365 Copilot – KI-gestützte Assistenz in Microsoft 365",
            zweck: "Unterstützung von Beschäftigten bei Recherche, Zusammenfassung, Entwurfserstellung, Wissenserschließung und produktivitätssteigernder Nutzung freigegebener Inhalte innerhalb der Microsoft-365-Umgebung.",
            rechtsgrundlage: "Art. 6 Abs. 1 lit. f DSGVO; ergänzend je Use Case gesondert zu prüfen; bei Beschäftigtendaten zusätzlich arbeitsrechtlich und national zu würdigen.",
            datenkategorien: ["Beschäftigtendaten", "Kommunikationsdaten", "Dokumenteninhalte", "Kunden- und Interessentendaten", "Vertrags- und Projektdaten", "Nutzungs- und Metadaten"],
            betroffenePersonen: ["Beschäftigte", "Kunden", "Interessenten", "Lieferantenkontakte", "Geschäftspartnerkontakte"],
            empfaenger: "Microsoft als Auftragsverarbeiter sowie interne berechtigte Stellen",
            drittlandtransfer: true,
            loeschfrist: "Gemäß zugrunde liegenden Quellsystemen, Retention Policies und dokumentierten Aufbewahrungsregeln.",
            loeschklasse: "KI-Systeme / Produktivsysteme",
            aufbewahrungsgrund: "Erforderlichkeit für den jeweiligen Geschäftsprozess sowie gesetzliche und interne Aufbewahrungsregeln.",
            tomHinweis: "Berechtigungskonzept, Sensitivity Labels, DLP, Audit Logging, Freigabe- und Sharing-Review, Richtlinie zur KI-Nutzung.",
            verantwortlicher: "",
            verantwortlicherEmail: "",
            verantwortlicherTelefon: "",
            status: "entwurf",
            dsfa: true,
          },
        ],
        avv: [
          {
            auftragsverarbeiter: "Microsoft / Microsoft 365",
            gegenstand: "Bereitstellung und Betrieb von Microsoft 365 Copilot sowie damit verbundener Cloud-Dienste.",
            vertragsdatum: "",
            laufzeit: "",
            status: "entwurf",
            sccs: true,
            subauftragnehmer: ["Gemäß aktueller Herstellerliste gesondert zu dokumentieren"],
            avKontaktName: "",
            avKontaktEmail: "",
            avKontaktTelefon: "",
            genehmigteSubdienstleister: [],
            pruefFaellig: "",
            notizen: "DPA, Product Terms, EU Data Boundary, Subprocessor-Liste sowie Drittland- und Support-Konstellationen prüfen.",
          },
        ],
        dsfa: [
          {
            titel: "DSFA – Einsatz von Microsoft 365 Copilot",
            beschreibung: "Bewertung der datenschutzrechtlichen Risiken beim Einsatz von Microsoft 365 Copilot zur KI-gestützten Verarbeitung, Analyse, Zusammenfassung und Generierung von Inhalten auf Basis freigegebener Daten aus Microsoft-365-Diensten.",
            zweck: "Produktivitätssteigerung, Wissenserschließung, Unterstützung bei Kommunikation und Dokumentenarbeit.",
            prozessablauf: "Nutzer geben Prompts ein; Copilot verarbeitet freigegebene Kontextdaten aus angebundenen Quellen; das System erzeugt Antwort, Zusammenfassung oder Entwurf; Nutzer prüft und verwendet das Ergebnis.",
            verarbeitungskontext: "Cloudbasierte KI-Unterstützung in Microsoft 365 mit potenziellem Zugriff auf Inhalte aus Exchange, Teams, SharePoint, OneDrive und weiteren freigegebenen Datenquellen.",
            datenquellen: "Exchange Online, Teams, SharePoint Online, OneDrive, Office-Dokumente, optional weitere M365-Quellen.",
            empfaenger: "Microsoft sowie konzernangehörige technische Leistungserbringer gemäß DPA und Subprocessor-Dokumentation.",
            drittlandtransfer: true,
            auftragsverarbeiter: "Microsoft",
            technologienSysteme: "Microsoft 365 Copilot, Microsoft 365, Entra ID, Purview, Exchange Online, SharePoint Online, Teams",
            profiling: false,
            automatisierteEntscheidung: false,
            notwendigkeit: "Nur zulässig bei dokumentierter Zweckdefinition, rollenbezogenem Einsatz und Begrenzung auf erforderliche Datenquellen.",
            rechtsgrundlage: "Art. 6 Abs. 1 lit. f DSGVO; ergänzend je Use Case sowie im Beschäftigungskontext gesondert zu würdigen.",
            zweckbindungBewertung: "Prüfbedürftig; Zweckgrenzen und zulässige Einsatzszenarien müssen dokumentiert und intern kommuniziert werden.",
            datenminimierungBewertung: "Kritisch wegen möglichem breitem Kontextzugriff; Zugriff auf unnötige Datenquellen ist technisch und organisatorisch zu vermeiden.",
            speicherbegrenzungBewertung: "An Quellsysteme, Retention Policies und dokumentierte Löschregeln zu koppeln.",
            transparenzBewertung: "Aktive Information der Beschäftigten und interne Transparenzmaßnahmen erforderlich.",
            betroffenenrechteBewertung: "Betroffenenrechte sind organisatorisch sicherzustellen; Auskunfts- und Löschprozesse müssen die Copilot-Nutzung mitdenken.",
            zugriffskonzeptBewertung: "Zentraler Risikofaktor; Berechtigungskonzept und Freigabestrukturen sind vor Rollout zu überprüfen.",
            privacyByDesignBewertung: "Abhängig von Konfiguration, Restriktionen, Governance und Ausschluss sensibler Datenbereiche.",
            risiken: [
              {
                titel: "Oversharing durch zu weite Berechtigungen",
                beschreibung: "Copilot greift auf Inhalte zu, die formal freigegeben, aber organisatorisch nicht für den konkreten Nutzungskontext bestimmt sind.",
                betroffeneRechte: "Vertraulichkeit, Datenminimierung",
                betroffeneGruppen: "Beschäftigte, Kunden, Geschäftspartner",
                datenarten: "Dokumenteninhalte, Kommunikationsdaten, Vertragsdaten",
                ursache: "Historisch gewachsene Freigaben und unzureichendes Berechtigungsmanagement",
                bestehendeKontrollen: "M365-Berechtigungen, Gruppensteuerung, manuelle Freigaberegeln",
                eintrittswahrscheinlichkeit: "mittel",
                schweregrad: "hoch",
                inhärentesRisiko: "hoch",
                restrisiko: "mittel",
                weitereMassnahmen: "Berechtigungsreview, Ausschluss sensibler Bibliotheken, Sensitivity Labels, DLP",
                verantwortlicher: "IT / Datenschutz",
                status: "offen",
              },
              {
                titel: "Verarbeitung sensibler oder vertraulicher Daten ohne ausreichende Einschränkung",
                beschreibung: "Besonders schützenswerte Inhalte werden in Prompts oder Kontexten verarbeitet, obwohl dies organisatorisch oder rechtlich unzulässig ist.",
                betroffeneRechte: "Vertraulichkeit, Integrität",
                betroffeneGruppen: "Beschäftigte, Kunden, Patienten, Mandanten",
                datenarten: "besondere Kategorien personenbezogener Daten, vertrauliche Inhalte",
                ursache: "Fehlende Nutzungsrichtlinien und technische Restriktionen",
                bestehendeKontrollen: "Allgemeine Datenschutzregeln",
                eintrittswahrscheinlichkeit: "mittel",
                schweregrad: "hoch",
                inhärentesRisiko: "hoch",
                restrisiko: "mittel",
                weitereMassnahmen: "KI-Nutzungsrichtlinie, Schulung, Ausschluss sensibler Bereiche",
                verantwortlicher: "Datenschutz / Fachbereich",
                status: "offen",
              },
              {
                titel: "Unzureichende Transparenz gegenüber Beschäftigten und sonstigen Betroffenen",
                beschreibung: "Betroffene verstehen nicht ausreichend, dass und wie personenbezogene Daten im Rahmen des Copilot-Einsatzes verarbeitet werden.",
                betroffeneRechte: "Transparenz, informationelle Selbstbestimmung",
                betroffeneGruppen: "Beschäftigte, Kunden, Ansprechpartner",
                datenarten: "Kommunikations- und Inhaltsdaten",
                ursache: "Fehlende oder unklare Informationen",
                bestehendeKontrollen: "Allgemeine Datenschutzhinweise",
                eintrittswahrscheinlichkeit: "mittel",
                schweregrad: "mittel",
                inhärentesRisiko: "mittel",
                restrisiko: "niedrig",
                weitereMassnahmen: "Mitarbeiterinformation, Governance-Dokumentation, interne Kommunikation",
                verantwortlicher: "Datenschutz / HR",
                status: "offen",
              },
            ],
            massnahmen: "Berechtigungsreview vor Rollout, Freigaben in SharePoint und Teams prüfen, sensible Bereiche einschränken oder ausschließen, Purview / DLP / Labels konfigurieren, Mitarbeiterinformation erstellen, Betriebsrat einbinden, KI-Nutzungsrichtlinie einführen, DSFA regelmäßig reviewen, Audit- und Logauswertung definieren.",
            restrisikoBegruendung: "Das verbleibende Risiko ist nur bei wirksam umgesetztem Berechtigungs-, Governance- und Kontrollkonzept vertretbar.",
            art36Erforderlich: false,
            art36Begruendung: "",
            ergebnis: "offen",
            konsultation: false,
            status: "entwurf",
            reviewer: "",
            verantwortlicherBereich: "Datenschutz / IT / Compliance",
            dsbBeteiligt: true,
            dsbStellungnahme: "",
            freigabeentscheidung: "",
            freigabeBegruendung: "",
            freigabeDatum: "",
            naechstePruefungAm: "",
          },
        ],
        tom: [
          {
            kategorie: "zugriffskontrolle",
            massnahme: "Rollen- und Berechtigungskonzept für M365-Datenquellen überprüfen",
            beschreibung: "Prüfung von Rollen, Gruppen, Bibliotheken, Teams und individuellen Freigaben auf Oversharing-Risiken.",
            status: "geplant",
            verantwortlicher: "IT",
            pruefDatum: "",
            pruefintervall: "halbjährlich",
            schutzziel: "Vertraulichkeit",
            nachweis: "",
            wirksamkeit: "",
            notizen: "",
          },
          {
            kategorie: "trennung",
            massnahme: "Vertrauliche Bereiche und sensible Bibliotheken gesondert absichern",
            beschreibung: "Sensible Inhalte und besonders geschützte Bereiche sind organisatorisch und technisch vom allgemeinen Copilot-Kontext abzugrenzen.",
            status: "geplant",
            verantwortlicher: "IT / Fachbereich",
            pruefDatum: "",
            pruefintervall: "quartalsweise",
            schutzziel: "Vertraulichkeit",
            nachweis: "",
            wirksamkeit: "",
            notizen: "",
          },
          {
            kategorie: "weitergabe",
            massnahme: "Externe Freigaben und Link-Sharing überprüfen und einschränken",
            beschreibung: "Öffentliche oder unkontrollierte Freigaben sind im Hinblick auf Copilot-Risiken besonders zu prüfen.",
            status: "geplant",
            verantwortlicher: "IT",
            pruefDatum: "",
            pruefintervall: "quartalsweise",
            schutzziel: "Vertraulichkeit",
            nachweis: "",
            wirksamkeit: "",
            notizen: "",
          },
          {
            kategorie: "zugangskontrolle",
            massnahme: "MFA und bedingte Zugriffe für relevante Benutzergruppen absichern",
            beschreibung: "Zugriff auf produktive KI-gestützte Dienste nur unter wirksamen Authentifizierungs- und Zugriffsbedingungen.",
            status: "geplant",
            verantwortlicher: "IT",
            pruefDatum: "",
            pruefintervall: "jährlich",
            schutzziel: "Vertraulichkeit",
            nachweis: "",
            wirksamkeit: "",
            notizen: "",
          },
          {
            kategorie: "auftrag",
            massnahme: "Microsoft-Vertragsunterlagen, DPA und Subprocessor-Prüfung dokumentieren",
            beschreibung: "Vertragliche und organisatorische Kontrolle des Auftragsverarbeiters und seiner Unterauftragnehmer dokumentieren.",
            status: "geplant",
            verantwortlicher: "Datenschutz / Einkauf",
            pruefDatum: "",
            pruefintervall: "jährlich",
            schutzziel: "Rechtmäßigkeit",
            nachweis: "",
            wirksamkeit: "",
            notizen: "",
          },
          {
            kategorie: "eingabe",
            massnahme: "Audit-Logs und Nachvollziehbarkeit für relevante Copilot- und M365-Aktivitäten sicherstellen",
            beschreibung: "Sicherstellen, dass sicherheits- und compliance-relevante Aktivitäten nachvollzogen und geprüft werden können.",
            status: "geplant",
            verantwortlicher: "IT / Compliance",
            pruefDatum: "",
            pruefintervall: "monatlich",
            schutzziel: "Nachvollziehbarkeit",
            nachweis: "",
            wirksamkeit: "",
            notizen: "",
          },
          {
            kategorie: "verfuegbarkeit",
            massnahme: "Retention-, Backup- und Wiederherstellungslogik dokumentieren",
            beschreibung: "Sicherstellen, dass Lösch- und Aufbewahrungslogik sowie Wiederherstellungsfähigkeit dokumentiert und abgestimmt sind.",
            status: "geplant",
            verantwortlicher: "IT",
            pruefDatum: "",
            pruefintervall: "jährlich",
            schutzziel: "Verfügbarkeit",
            nachweis: "",
            wirksamkeit: "",
            notizen: "",
          },
          {
            kategorie: "trennung",
            massnahme: "Richtlinie für zulässige und unzulässige KI-Nutzung festlegen",
            beschreibung: "Verbotene Inhalte, sensible Eingaben, Prüfpflichten und Eskalationsregeln verbindlich festlegen.",
            status: "geplant",
            verantwortlicher: "Datenschutz / Compliance / HR",
            pruefDatum: "",
            pruefintervall: "jährlich",
            schutzziel: "Rechtmäßigkeit",
            nachweis: "",
            wirksamkeit: "",
            notizen: "",
          },
        ],
      }),
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: "DSDMS – DSMS Governance & Richtlinien",
      beschreibung: "Umfassendes Datenschutz-Management-System (DSMS) Paket mit ausformulierten Leitlinien, Standard-Prozessen (Betroffenenrechte, Datenpannen), operativen Richtlinien (Beschäftigtendatenschutz, Web-Compliance, TOM) und Audit-Konzepten.",
      kategorie: "datenschutz",
      version: "1.0",
      aktiv: true,
      inhaltJson: "{\"aufgaben\":[{\"titel\":\"Datenschutzleitlinie abstimmen und freigeben\",\"beschreibung\":\"Die Grundsatzerklärung der Geschäftsführung zum Datenschutz (Art. 24 DSGVO) intern abstimmen, unterzeichnen und für alle Beschäftigten zugänglich machen.\",\"typ\":\"milestone\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"dokumente\",\"sortierung\":10},{\"titel\":\"Verzeichnis der Verarbeitungstätigkeiten (VVT) anlegen\",\"beschreibung\":\"Erfassung aller datenverarbeitenden Prozesse des Unternehmens im VVT-Modul (Art. 30 DSGVO) zur Einhaltung der Rechenschaftspflicht.\",\"typ\":\"task\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"vvt\",\"sortierung\":20},{\"titel\":\"Prozess zur Bearbeitung von Betroffenenrechten einführen\",\"beschreibung\":\"Sicherstellung der fristgerechten und sicheren Beantwortung von Anfragen betroffener Personen nach Art. 12-22 DSGVO (Auskunft, Löschung).\",\"typ\":\"task\",\"prioritaet\":\"mittel\",\"status\":\"offen\",\"kategorie\":\"dsr\",\"sortierung\":30},{\"titel\":\"Prozess zum Datenpannenmanagement schulen\",\"beschreibung\":\"Sensibilisierung der Belegschaft für Sicherheitsvorfälle und Einführung des Prozesses zur Einhaltung der gesetzlichen 72-Stunden-Meldepflicht.\",\"typ\":\"task\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"datenpanne\",\"sortierung\":40},{\"titel\":\"Richtlinie Beschäftigtendatenschutz mit Betriebsrat abstimmen\",\"beschreibung\":\"Verbindung der Anforderungen aus § 26 BDSG mit betrieblichen Abläufen und formelle Abstimmung/Betriebsvereinbarung vorbereiten.\",\"typ\":\"task\",\"prioritaet\":\"mittel\",\"status\":\"offen\",\"kategorie\":\"dokumente\",\"sortierung\":50},{\"titel\":\"Web-Datenschutz und Cookie-Compliance prüfen\",\"beschreibung\":\"Verbindung von Webseite und Consent-Management-Tool analysieren und auf Einhaltung von § 25 TDDDG und DSGVO prüfen.\",\"typ\":\"task\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"tom\",\"sortierung\":60},{\"titel\":\"Technische und organisatorische Maßnahmen (TOM) dokumentieren\",\"beschreibung\":\"Lückenlose Erfassung der Sicherheitsmaßnahmen (Zutritt, Zugang, Zugriff, Weitergabe, Verfügbarkeit) nach Art. 32 DSGVO.\",\"typ\":\"task\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"tom\",\"sortierung\":70},{\"titel\":\"Erstes internes Datenschutz-Audit planen\",\"beschreibung\":\"Systematisches, internes Audit zur Einhaltung der Datenschutzvorgaben planen, durchführen und dokumentieren (Art. 32 Abs. 1 lit. d DSGVO).\",\"typ\":\"review\",\"prioritaet\":\"mittel\",\"status\":\"offen\",\"kategorie\":\"audits\",\"sortierung\":80}],\"dokumente\":[{\"titel\":\"1.1 Datenschutzleitlinie\",\"kategorie\":\"leitlinie_datenschutz\",\"dokumentTyp\":\"leitlinie\",\"beschreibung\":\"Grundsatzerklärung zum Datenschutz und zur Wahrung des Grundrechts auf informationelle Selbstbestimmung.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Prüfung\\n- [ ] Freigegeben\\n\\nGültig für:  \\n**Alle Beschäftigten und Vertragspartner**\\n\\nVerantwortlich:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\nReview-Zyklus (in Monaten):  \\n**{{snippet: document_frontmatter name=review_cycle_months}}**\\n\\n# Versionsstand & Änderungsverzeichnis\\n\\nVersionshistorie und Änderungsnachverfolgung dieses Dokuments erfolgt durch das Versionskontrollsystem der Organisation. Die jeweils gültige Fassung ist durch das Deckblatt und das im Seitenkopf angegebene Dokumentdatum gekennzeichnet.\\n\\n{{snippet: git_document_history format=table limit=15}}\\n\\n# 1. Grundsatzerklärung des Managements\\n\\nDer Schutz personenbezogener Daten und die Wahrung des Grundrechts auf informationelle Selbstbestimmung sind fundamentale Pfeiler unserer Unternehmenskultur. Die Geschäftsführung der **{{snippet: global_organisation}}** verpflichtet sich, die Einhaltung aller datenschutzrechtlichen Vorgaben der Datenschutz-Grundverordnung (DSGVO), des Bundesdatenschutzgesetzes (BDSG) sowie weiterer relevanter Gesetze zur Digital- und Telekommunikations-Compliance uneingeschränkt sicherzustellen.\\n\\nDiese Leitlinie bildet das normative Fundament unseres Datenschutz-Management-Systems (DSMS). Sie legt die grundlegenden Prinzipien fest, nach denen wir Daten verarbeiten, und definiert die Pflichten und Verantwortlichkeiten für alle Beschäftigten.\\n\\n# 2. Datenschutzgrundsätze (Art. 5 DSGVO)\\n\\nJede Verarbeitung personenbezogener Daten in unserer Organisation hat unter strikter Einhaltung der folgenden gesetzlichen Grundsätze zu erfolgen:\\n\\n1. **Rechtmäßigkeit, Verarbeitung nach Treu und Glauben, Transparenz:** Datenverarbeitungen müssen auf einer wirksamen Rechtsgrundlage (Art. 6 und Art. 9 DSGVO) beruhen. Betroffene müssen umfassend und verständlich informiert werden.\\n2. **Zweckbindung:** Daten dürfen nur für festgelegte, eindeutige und rechtmäßige Zwecke erhoben werden. Eine Zweckänderung ist grundsätzlich unzulässig.\\n3. **Datenminimierung:** Die Verarbeitung ist auf das für die Zwecke notwendige Maß zu beschränken (\\\"so viel wie nötig, so wenig wie möglich\\\").\\n4. **Richtigkeit:** Unrichtige Daten müssen unverzüglich korrigiert oder gelöscht werden.\\n5. **Speicherbegrenzung:** Daten müssen in einer Form gespeichert werden, die die Identifizierung der Betroffenen nur so lange ermöglicht, wie es für die Zwecke erforderlich ist.\\n6. **Integrität und Vertraulichkeit:** Durch geeignete technische und organisatorische Maßnahmen (TOM) gewährleisten wir den Schutz vor unbefugter oder unrechtmäßiger Verarbeitung, Zerstörung oder Beschädigung.\\n\\n# 3. Das Datenschutz-Management-System (DSMS)\\n\\nWir etablieren und betreiben ein DSMS, um die datenschutzrechtliche Compliance systematisch und nachweisbar (Rechenschaftspflicht, Art. 5 Abs. 2 DSGVO) zu steuern:\\n\\n- **Verzeichnis der Verarbeitungstätigkeiten (VVT):** Alle datenverarbeitenden Prozesse werden lückenlos im VVT (Art. 30 DSGVO) erfasst und regelmäßig aktualisiert.\\n- **Risikoanalyse & DSFA:** Verarbeitungen mit voraussichtlich hohem Risiko für die Rechte und Freiheiten natürlicher Personen unterliegen einer formellen Datenschutz-Folgenabschätzung (Art. 35 DSGVO).\\n- **Löschkonzept:** Für alle Datenarten und Systeme gelten verbindliche Aufbewahrungs- und Löschfristen.\\n- **Mitarbeiterschulung:** Alle Beschäftigten werden regelmäßig für Datenschutzthemen sensibilisiert und zur Einhaltung des Datengeheimnisses verpflichtet.\\n\\n# 4. Rollen und Verantwortlichkeiten\\n\\n- **Geschäftsführung:** Trägt die Gesamtverantwortung für die Bereitstellung ausreichender Ressourcen zur Umsetzung dieser Leitlinie und für die gesetzliche Compliance.\\n- **Datenschutzbeauftragter (DSB):** Überwacht als unabhängiger Berater die Einhaltung der Datenschutzvorschriften, berät die Geschäftsführung und die Abteilungen und dient als Ansprechpartner für Betroffene und Aufsichtsbehörden.\\n- **Datenschutzmanager:** Koordiniert operativ das DSMS, pflegt die Dokumentation und treibt die Umsetzung von Verbesserungsmaßnahmen voran.\\n- **Führungskräfte / Abteilungsleiter:** Stellen die Einhaltung dieser Leitlinie und operativer Datenschutzanweisungen in ihren jeweiligen Fachbereichen sicher.\\n- **Beschäftigte:** Jede(r) Mitarbeiter(in) ist verpflichtet, personenbezogene Daten sorgfältig, vertraulich und gesetzeskonform zu behandeln.\\n\\n# 5. Konsequenzen bei Verstößen\\n\\nVerstöße gegen datenschutzrechtliche Vorgaben oder interne Richtlinien gefährden das Vertrauen unserer Kunden und Partner und können erhebliche Bußgelder oder Reputationsschäden nach sich ziehen. Bei vorsätzlichen oder grob fahrlässigen Verletzungen der Datenschutzregeln behält sich die Organisation arbeits- und zivilrechtliche Schritte vor.\\n\\n# 6. Inkrafttreten und Review\\n\\nDiese Leitlinie tritt mit Beschluss der Geschäftsführung in Kraft. Sie wird mindestens einmal jährlich sowie anlassbezogen (z. B. bei Gesetzesänderungen oder wesentlichen Prozessumstellungen) durch den DSB und das Management überprüft und bei Bedarf fortgeschrieben.\\n\\n---\\n**Genehmigt am:** 28.05.2026  \\n**Durch:** **{{snippet: global_role_verantwortlicher}}**\"},{\"titel\":\"2.1 Prozessbeschreibung: Bearbeitung von Betroffenenrechten\",\"kategorie\":\"prozessbeschreibung\",\"dokumentTyp\":\"betroffenenrechte\",\"beschreibung\":\"Standardarbeitsanweisung (SOP) zur gesetzeskonformen Bearbeitung von Betroffenenanfragen gemäß Art. 12-22 DSGVO.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Prüfung\\n- [ ] Freigegeben\\n\\nVerantwortlich:  \\n**Datenschutzmanager / Kundenservice**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\n# 1. Zweck und Geltungsbereich\\n\\nDieser Prozess regelt den Ablauf der Entgegennahme, Identifikation, Prüfung und Beantwortung von Anfragen natürlicher Personen (Betroffene), die ihre gesetzlichen Rechte gemäß der Datenschutz-Grundverordnung (DSGVO) geltend machen. \\n\\nDer Prozess gilt für alle Abteilungen der **{{snippet: global_organisation}}**, insbesondere für den Kundenservice, die Personalabteilung und die IT-Administration.\\n\\n# 2. Die Rechte der Betroffenen (Übersicht)\\n\\nDie DSGVO sichert betroffenen Personen weitreichende Rechte zu, die innerhalb der gesetzlichen Fristen bedient werden müssen:\\n\\n- **Recht auf Auskunft (Art. 15 DSGVO):** Bestätigung über Verarbeitung und Kopie aller personenbezogenen Daten.\\n- **Recht auf Berichtigung (Art. 16 DSGVO):** Unverzügliche Korrektur unrichtiger Daten.\\n- **Recht auf Löschung / \\\"Vergessenwerden\\\" (Art. 17 DSGVO):** Löschung von Daten bei Wegfall des Verarbeitungszwecks oder Widerruf.\\n- **Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):** Markierung gespeicherter Daten mit dem Ziel, ihre künftige Verarbeitung einzuschränken.\\n- **Recht auf Datenübertragbarkeit (Art. 20 DSGVO):** Aushändigung der Daten in einem strukturierten, gängigen und maschinenlesbaren Format.\\n- **Widerspruchsrecht (Art. 21 DSGVO):** Widerspruch gegen Verarbeitungen, die auf berechtigtem Interesse oder Direktwerbung basieren.\\n\\n# 3. Der Prozessablauf (Schritt für Schritt)\\n\\n```mermaid\\ngraph TD\\n    A[Eingang der Anfrage] --> B[Identitätsprüfung & Erfassung]\\n    B --> C{Identität geklärt?}\\n    C -- Nein --> D[Nachforderung ID-Nachweis]\\n    C -- Ja --> E[Inhaltliche Prüfung & Fristberechnung]\\n    E --> F[Datenbeschaffung in Fachabteilungen & IT]\\n    F --> G[Erstellung des Antwortentwurfs]\\n    G --> H[Freigabe durch DSB / Management]\\n    H --> I[Sichere Auslieferung an Betroffenen]\\n    I --> J[Dokumentation & Archivierung]\\n```\\n\\n## Schritt 1: Eingang und Kennzeichnung\\n- Anfragen können über jeden Kommunikationskanal (E-Mail, Brief, Web-Formular, Telefon) eingehen.\\n- Jede Anfrage ist unverzüglich an das Datenschutz-Team bzw. den Datenschutzmanager weiterzuleiten (E-Mail: `datenschutz@privashield-demo.local`).\\n- Das Eingangsdatum wird taggenau dokumentiert.\\n\\n## Schritt 2: Identitätsprüfung und Registrierung\\n- Um unbefugte Offenlegung gegenüber Dritten zu verhindern, ist die Identität des Anfragenden zweifelsfrei zu prüfen (z. B. durch Abgleich von Kundennummer, E-Mail-Adresse oder bei sensiblen Daten Anforderung einer Kopie eines Ausweises mit geschwärzten nicht benötigten Feldern).\\n- Jede Anfrage wird im PrivaShield Betroffenenrechte-Modul registriert.\\n\\n## Schritt 3: Fristberechnung\\n- Anfragen müssen **unverzüglich**, spätestens jedoch **innerhalb eines Monats** nach Eingang beantwortet werden (Art. 12 Abs. 3 DSGVO).\\n- Bei komplexen Fällen kann die Frist um maximal zwei weitere Monate verlängert werden. Die betroffene Person muss darüber unter Angabe der Gründe innerhalb des ersten Monats informiert werden.\\n\\n## Schritt 4: Datenbeschaffung und Konsolidierung\\n- Der Datenschutzmanager fordert die relevanten Daten bei den Fachabteilungen (z. B. HR bei Bewerbern, Vertrieb bei Kunden) und der IT-Administration an.\\n- Die IT exportiert die Daten aus allen relevanten Systemen (CRM, ERP, Mailserver, Backups).\\n\\n## Schritt 5: Rechtliche Würdigung und Schwärzung\\n- Der Datenschutzbeauftragte prüft, ob gesetzliche Ausnahmen (z. B. Geschäftsgeheimnisse, Rechte Dritter, steuerliche Aufbewahrungspflichten) der Auskunft oder Löschung entgegenstehen.\\n- Daten Dritter oder vertrauliche Unternehmensdaten sind im Auskunfts-PDF unkenntlich zu machen (Schwärzung).\\n\\n## Schritt 6: Freigabe und Antwort\\n- Die finale Antwort sowie der Datenexport werden durch den Datenschutzbeauftragten (DSB) rechtlich geprüft und freigegeben.\\n- Die Übermittlung an den Betroffenen erfolgt auf einem sicheren Weg (z. B. verschlüsseltes ZIP via E-Mail mit separatem Kennwortweg oder per Einschreiben).\\n\\n## Schritt 7: Protokollierung (Rechenschaftspflicht)\\n- Der Vorgang wird im PrivaShield DSR-Modul geschlossen.\\n- Die gesamte Kommunikation, die Identitätsnachweise und die Freigaben werden revisionssicher archiviert (Aufbewahrung für 3 Jahre ab Abschluss zur Abwehr von Haftungsansprüchen).\\n\\n# 4. Eskalationsmanagement\\nKann eine Anfrage nicht fristgerecht beantwortet werden, droht ein behördliches Beschwerdeverfahren. In solchen Fällen ist unverzüglich die Geschäftsführung zu informieren, um zusätzliche personelle oder technische Ressourcen freizugeben.\"},{\"titel\":\"2.2 Prozessbeschreibung: Datenpannenmanagement\",\"kategorie\":\"prozessbeschreibung\",\"dokumentTyp\":\"datenpannen\",\"beschreibung\":\"Standardarbeitsanweisung (SOP) zur Erkennung, Meldung und Dokumentation von Verletzungen des Schutzes personenbezogener Daten gemäß Art. 33/34 DSGVO.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Prüfung\\n- [ ] Freigegeben\\n\\nVerantwortlich:  \\n**Datenschutzmanager / IT-Sicherheit**\\n\\nFristenüberwachung:  \\n**{{snippet: global_role_dsb}}**\\n\\n# 1. Einleitung und gesetzliche Pflicht\\nEine Verletzung des Schutzes personenbezogener Daten (Datenpanne) liegt vor, wenn es zu einem Sicherheitsvorfall kommt, der zum unbeabsichtigten oder unrechtmäßigen Verlust, zur Veränderung, zur unbefugten Offenlegung oder zum unbefugten Zugriff auf personenbezogene Daten führt (Art. 4 Nr. 12 DSGVO).\\n\\nIm Falle einer Datenpanne ist die **{{snippet: global_organisation}}** gesetzlich verpflichtet:\\n1. Den Vorfall **innerhalb von 72 Stunden** an die zuständige Datenschutz-Aufsichtsbehörde zu melden, es sei denn, der Vorfall führt voraussichtlich nicht zu einem Risiko für die Rechte und Freiheiten natürlicher Personen (Art. 33 DSGVO).\\n2. Die betroffenen Personen unverzüglich zu informieren, wenn die Verletzung voraussichtlich ein **hohes Risiko** für deren persönliche Rechte und Freiheiten zur Folge hat (Art. 34 DSGVO).\\n3. Jeden Vorfall – unabhängig von der Meldepflicht – intern lückenlos zu dokumentieren (Art. 33 Abs. 5 DSGVO).\\n\\n# 2. Der Ablauf im Ernstfall (72-Stunden-Szenario)\\n\\n```mermaid\\ngraph TD\\n    A[Vorfall erkannt / gemeldet] --> B[Sofortmaßnahmen & Schadensbegrenzung]\\n    B --> C[Vorfall erfassen & DSB informieren]\\n    C --> D[Risikoanalyse durch DSB & IT-Sec]\\n    D --> E{Risiko für Betroffene?}\\n    E -- Kein Risiko --> F[Nur interne Dokumentation]\\n    E -- Mittleres Risiko --> G[Meldung an Aufsichtsbehörde < 72h]\\n    E -- Hohes Risiko --> H[Meldung an Behörde < 72h & Info an Betroffene]\\n```\\n\\n## Phase 1: Erkennung und Schadensminimierung (Stunde 0 - 4)\\n- **Erkennung:** Ein Vorfall kann durch IT-Monitoring, Mitarbeiterberichte, Kundenhinweise oder externe Dienstleister gemeldet werden.\\n- **Sofortmaßnahmen:** Die IT-Administration ergreift unverzüglich Maßnahmen zur Eindämmung des Schadens (z. B. Trennung betroffener Server vom Netzwerk, Sperrung kompromittierter Benutzerkonten, Schließen von Sicherheitslücken).\\n\\n## Phase 2: Meldung an das Datenschutz-Team (Stunde 4 - 12)\\n- Jeder Vorfall muss sofort über das interne Vorfall-Formular oder per E-Mail an `sicherheitsvorfall@privashield-demo.local` gemeldet werden.\\n- Der Vorfall wird im PrivaShield Datenpannen-Modul registriert. Dadurch wird die automatische Fristenüberwachung (72h-Countdown ab Kenntnisnahme) gestartet.\\n\\n## Phase 3: Sachverhaltsermittlung und Risikoanalyse (Stunde 12 - 36)\\nDer Datenschutzbeauftragte führt gemeinsam mit der IT-Sicherheit eine strukturierte Risikobewertung durch:\\n- Welche Datenkategorien sind betroffen (sensible Finanzdaten, Gesundheitsdaten, Passwörter)?\\n- Wie viele Personen sind betroffen?\\n- Welche konkreten Gefahren drohen den Betroffenen (Identitätsdiebstahl, finanzieller Verlust, Diskriminierung, Reputationsschaden)?\\n- Risikoklassifizierung (kein Risiko, geringes Risiko, mittleres Risiko, hohes Risiko).\\n\\n## Phase 4: Entscheidung und Behördenmeldung (Stunde 36 - 48)\\n- Die Geschäftsführung entscheidet auf Empfehlung des DSB über die Meldepflicht.\\n- **Meldung an die Behörde:** Bei mittlerem, hohem oder kritischem Risiko erfolgt die Meldung elektronisch an die zuständige Aufsichtsbehörde (z. B. LDI NRW).\\n- **Inhalt der Meldung:** Art des Vorfalls, betroffene Personengruppen, Kontaktdaten des DSB, wahrscheinliche Folgen und ergriffene Gegenmaßnahmen.\\n\\n## Phase 5: Benachrichtigung der Betroffenen (Stunde 48 - 72)\\n- Liegt ein **hohes Risiko** vor, entwirft das PR- und Datenschutz-Team ein Informationsschreiben an die betroffenen Personen.\\n- Die Benachrichtigung muss in klarer und einfacher Sprache erfolgen und konkrete Handlungsempfehlungen (z. B. Passwortänderungen, Sperrung von Bankkarten) enthalten.\\n\\n## Phase 6: Nachbereitung und Dokumentation (Nach Abschluss)\\n- Der Vorfall wird vollständig im PrivaShield-Modul dokumentiert (inklusive aller getroffenen Eindämmungsmaßnahmen, Behördenmeldungen und Risikoabwägungen).\\n- Im Rahmen des PDCA-Zyklus werden die Ursachen analysiert und technische oder organisatorische Verbesserungen vereinbart, um eine Wiederholung zu verhindern.\\n\\n# 3. Wichtige Notfallkontakte\\n- **Datenschutzbeauftragter:** **{{snippet: global_role_dsb}}**\\n- **IT-Notfall-Hotline:** +49 (0) 231 999-888-7\\n- **Geschäftsführung:** **{{snippet: global_role_verantwortlicher}}**\"},{\"titel\":\"3.1 Richtlinie: Beschäftigtendatenschutz\",\"kategorie\":\"richtlinie\",\"dokumentTyp\":\"beschaeftigtendatenschutz\",\"beschreibung\":\"Verbindliche Richtlinie zur datenschutzkonformen Verarbeitung von Beschäftigtendaten im laufenden Arbeitsverhältnis, im Bewerbungsprozess sowie nach dem Ausscheiden.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Prüfung\\n- [ ] Freigegeben\\n\\nGültig für:  \\n**Personalabteilung, Führungskräfte und Betriebsrat**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\n# 1. Zielsetzung und Geltungsbereich\\nDiese Richtlinie konkretisiert die Vorgaben des Artikels 88 DSGVO und des § 26 Bundesdatenschutzgesetz (BDSG) für die **{{snippet: global_organisation}}**. \\n\\nSie dient dem Schutz der Persönlichkeitsrechte aller Beschäftigten, Bewerber, Auszubildenden und ehemaligen Mitarbeiter und legt verbindliche Verhaltensregeln für den Umgang mit Beschäftigtendaten fest.\\n\\n# 2. Rechtsgrundlagen der Verarbeitung\\nDie Verarbeitung von Beschäftigtendaten ist nur zulässig, wenn eine der folgenden Bedingungen erfüllt ist:\\n\\n1. **Begründung, Durchführung und Beendigung des Arbeitsverhältnisses (§ 26 Abs. 1 BDSG):** Die Erhebung und Nutzung von Daten (wie Name, Steuerdaten, Gehaltsdaten) ist zulässig, wenn sie für die Entscheidung über die Begründung eines Beschäftigungsverhältnisses oder nach dessen Begründung für dessen Durchführung oder Beendigung erforderlich ist.\\n2. **Kollektivvereinbarungen (§ 26 Abs. 4 BDSG):** Verarbeitung auf Grundlage von Betriebsvereinbarungen oder Tarifverträgen.\\n3. **Einwilligung (§ 26 Abs. 2 BDSG):** Freiwillige, schriftliche oder elektronische Einwilligung (z. B. für die Veröffentlichung von Mitarbeiterfotos auf der Webseite).\\n4. **Erfüllung rechtlicher Pflichten (Art. 6 Abs. 1 lit. c DSGVO):** Abführung von Lohnsteuer und Sozialabgaben an Finanzämter und Krankenkassen.\\n\\n# 3. Regelungen für den Bewerbungsprozess\\n- **Erhebung:** Es dürfen nur Daten abgefragt werden, die für die Beurteilung der Eignung für die konkrete Stelle erforderlich sind. Unzulässige Fragen (z. B. nach Schwangerschaft, Religion, Gewerkschaftszugehörigkeit) sind untersagt.\\n- **Aufbewahrungsfrist:** Bewerbungsunterlagen abgelehnter Bewerber müssen spätestens **6 Monate** nach Zugang des Ablehnungsschreibens gelöscht/vernichtet werden (Abwehrfrist nach dem Allgemeinen Gleichbehandlungsgesetz - AGG).\\n- **Bewerberpool:** Eine längere Speicherung (z. B. zur Berücksichtigung bei künftigen Stellen) ist nur mit ausdrücklicher, schriftlicher Einwilligung des Bewerbers zulässig.\\n\\n# 4. Regelungen während des Beschäftigungsverhältnisses\\n\\n## 4.1 Die Personalakte\\n- Personalakten sind unter strengem Verschluss (physisch verschließbar, digital verschlüsselt und zugriffsbegrenzt) aufzubewahren.\\n- Zugriff auf Personalakten haben ausschließlich berechtigte Mitarbeiter der Personalabteilung.\\n\\n## 4.2 Nutzung von IT-Systemen, Internet und E-Mail\\n- **Dienstliche Nutzung:** Alle bereitgestellten Kommunikationsmittel (E-Mail, Teams, Internet) sind grundsätzlich für dienstliche Zwecke bestimmt.\\n- **Private Nutzung:** *(Entweder Verbot oder Freigabe mit klaren Regeln, z. B. im Rahmen einer Betriebsvereinbarung).* \\n  > [!NOTE]\\n  > Bei Freigabe der privaten Internet-/E-Mail-Nutzung gelten für den Arbeitgeber im Hinblick auf den Zugriff auf E-Mails des Mitarbeiters besonders strenge gesetzliche Grenzen des Fernmeldegeheimnisses (TDDDG).\\n- **Leistungs- und Verhaltenskontrolle:** Eine systematische, dauerhafte Überwachung der Leistung oder des Verhaltens der Mitarbeiter (z. B. durch Keylogger, permanente Videoüberwachung oder heimliche Auswertung von Logfiles) ist unzulässig.\\n\\n## 4.3 Besondere Kategorien von Daten (Art. 9 DSGVO)\\n- Die Erhebung von Gesundheitsdaten (z. B. Krankmeldungen, Betriebliches Eingliederungsmanagement - BEM) unterliegt besonders strengen Sicherheitsvorkehrungen und darf nur durch dafür autorisiertes Personal verarbeitet werden.\\n\\n# 5. Regelungen nach Beendigung des Arbeitsverhältnisses\\n- Nach dem Ausscheiden eines Mitarbeiters sind die Personalaktendaten schrittweise zu sperren und zu löschen.\\n- Für steuerlich und sozialversicherungsrechtlich relevante Unterlagen gelten die gesetzlichen Aufbewahrungsfristen (in der Regel 6 bis 10 Jahre nach Ablauf des Kalenderjahres des Ausscheidens). Nach Ablauf dieser Fristen sind die Daten unwiderruflich zu löschen.\\n\\n# 6. Mitbestimmungsrechte des Betriebsrates\\nBei der Einführung und Nutzung von technischen Systemen, die geeignet sind, das Verhalten oder die Leistung der Beschäftigten zu überwachen, sind die Mitbestimmungsrechte des Betriebsrates (gemäß BetrVG) zwingend zu wahren. Entsprechende Betriebsvereinbarungen sind abzuschließen.\"},{\"titel\":\"3.2 Richtlinie: Web- & Telemedien-Compliance\",\"kategorie\":\"richtlinie\",\"dokumentTyp\":\"web_telemedien\",\"beschreibung\":\"Verbindliche Richtlinie zur Einhaltung datenschutz- und telemedienrechtlicher Vorgaben beim Betrieb von Webseiten, Web-Apps, Cookie-Nutzung und Tracking-Technologien gemäß § 25 TDDDG, DDG und DSGVO.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Prüfung\\n- [ ] Freigegeben\\n\\nGültig für:  \\n**Marketing, IT-Webentwicklung und Webseitenbetreuer**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\n# 1. Einleitung und gesetzlicher Hintergrund\\nDer Betrieb von Telemedien (wie Webseiten, Kundenportalen und Online-Shops) unterliegt strengen gesetzlichen Regelungen:\\n- **§ 25 TDDDG** regelt die Einwilligungspflicht für das Speichern von Informationen im Endgerät des Nutzers (z. B. Cookies) oder den Zugriff auf bereits gespeicherte Informationen.\\n- Die **DSGVO** regelt die anschließende Verarbeitung personenbezogener Daten (z. B. IP-Adressen, Nutzer-IDs).\\n- Das **DDG (Digitale-Dienste-Gesetz)** regelt die gesetzlichen Impressumspflichten.\\n\\nDiese Richtlinie stellt sicher, dass alle Webauftritte der **{{snippet: global_organisation}}** gesetzeskonform betrieben werden.\\n\\n# 2. Die Cookie- & Tracking-Regeln (§ 25 TDDDG)\\n\\n## 2.1 Der Grundsatz der Einwilligungspflicht\\nJeder Zugriff auf das Endgerät des Nutzers (Speichern von Cookies, LocalStorage-Nutzung, Browser-Fingerprinting) bedarf der **vorherigen, informierten und freiwilligen Einwilligung** des Nutzers.\\n\\n## 2.2 Die gesetzliche Ausnahme\\nEine Einwilligung ist ausnahmsweise **nicht** erforderlich, wenn:\\n1. Der alleinige Zweck der Speicherung/des Zugriffs die Durchführung der Übertragung einer Nachricht über ein öffentliches Telekommunikationsnetz ist, oder\\n2. Die Speicherung/der Zugriff **unbedingt erforderlich** ist, damit der Anbieter einen vom Nutzer ausdrücklich gewünschten Dienst zur Verfügung stellen kann (z. B. Cookie zur Speicherung des Warenkorbs, Logindaten-Session-Cookie oder Speicherung des Consent-Status selbst).\\n\\n## 2.3 Das Consent-Management-Tool (CMP)\\n- Webseiten, die einwilligungspflichtige Dienste (z. B. Google Analytics, Facebook-Pixel, YouTube-Embeds, Google Maps) nutzen, müssen ein wirksames Consent-Management-Tool (Cookie-Banner) vorschalten.\\n- **Opt-in-Zwang:** Einwilligungspflichtige Skripte dürfen erst geladen werden, nachdem der Nutzer aktiv auf \\\"Akzeptieren\\\" geklickt hat.\\n- **Gleichwertigkeit der Buttons:** Der Button zur Ablehnung der Cookies (\\\"Ablehnen\\\" / \\\"Nur notwendige Cookies\\\") muss auf der ersten Ebene des Banners genauso leicht erreichbar, farblich und gestalterisch gleichwertig dargestellt sein wie der Button zur Annahme (\\\"Alle akzeptieren\\\"). Das Ausnutzen von *Dark Patterns* (z. B. versteckte oder graue Ablehnungs-Buttons) ist verboten.\\n- **Widerrufsmöglichkeit:** Der Nutzer muss seine Einwilligung jederzeit ebenso einfach widerrufen können, wie er sie erteilt hat (z. B. über ein kleines schwebendes Icon auf der Webseite).\\n\\n# 3. Impressums- und Datenschutzerklärungspflichten\\n\\n## 3.1 Das Impressum (Anbieterkennzeichnung gemäß DDG)\\n- Jede geschäftsmäßige Webseite muss ein leicht erkennbares, unmittelbar erreichbares und ständig verfügbares Impressum enthalten.\\n- Das Impressum darf maximal **zwei Klicks** von jeder Unterseite entfernt sein und muss als \\\"Impressum\\\" betitelt sein.\\n- **Pflichtinhalte:** Vollständiger Firmenname, Rechtsform, Vertretungsberechtigte Personen, Anschrift, E-Mail-Adresse und Telefonnummer, Registergericht und Registernummer, Umsatzsteuer-Identifikationsnummer (USt-IdNr.).\\n\\n## 3.2 Die Datenschutzerklärung (Art. 13 DSGVO)\\n- Jede Webseite muss eine aktuelle Datenschutzerklärung enthalten, die transparent über die Verarbeitung personenbezogener Daten auf der Webseite informiert.\\n- **Inhalte:** Verantwortliche Stelle, Kontaktdaten des DSB, erhobene Daten (z. B. Server-Logfiles, Kontaktformulardaten), Zwecke und Rechtsgrundlagen der Verarbeitung, Speicherdauer, Drittlandtransfers und Rechte der betroffenen Personen.\\n\\n# 4. Webseiten-Audits und Qualitätssicherung\\n- Der Webseitenbetreuer und die IT-Webentwicklung führen in Abstimmung mit dem Datenschutzbeauftragten vor jedem Release neuer Webseiten-Funktionen einen **Web-Datenschutz-Check** durch.\\n- Mindestens vierteljährlich erfolgt ein Audit aller aktiven Skripte und Cookies auf den Live-Webseiten unter Zuhilfenahme des PrivaShield Web-Compliance-Moduls.\\n- Nicht mehr benötigte Skripte oder Cookies sind unverzüglich aus dem Quellcode der Webseiten zu entfernen.\"},{\"titel\":\"3.3 Richtlinie: Technische & Organisatorische Maßnahmen (TOM)\",\"kategorie\":\"richtlinie\",\"dokumentTyp\":\"tom\",\"beschreibung\":\"Sicherheitsrichtlinie zur Festlegung und Überwachung technischer und organisatorischer Maßnahmen gemäß Art. 32 DSGVO.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Prüfung\\n- [ ] Freigegeben\\n\\nGültig für:  \\n**IT-Administration, Informationssicherheitsbeauftragter (ISB) und alle Beschäftigten**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\n# 1. Zielsetzung und gesetzliche Verpflichtung\\nDie **{{snippet: global_organisation}}** ist gesetzlich verpflichtet, unter Berücksichtigung des Stands der Technik, der Implementierungskosten und der Art, des Umfangs, der Umstände und der Zwecke der Verarbeitung sowie der unterschiedlichen Eintrittswahrscheinlichkeit und Schwere des Risikos für die Rechte und Freiheiten natürlicher Personen geeignete technische und organisatorische Maßnahmen (TOM) zu treffen, um ein dem Risiko angemessenes Schutzniveau zu gewährleisten (Art. 32 DSGVO).\\n\\nDiese Richtlinie definiert die Mindestsicherheitsanforderungen für den Betrieb unserer IT-Infrastruktur und den Umgang mit personenbezogenen Daten.\\n\\n# 2. Die Schutzkategorien der TOM (Klassischer Standard)\\n\\n## 2.1 Zutrittskontrolle (Räumliche Sicherheit)\\nMaßnahmen, die unbefugten Personen den physischen Zutritt zu Datenverarbeitungsanlagen (Serverräume, Büros, Archive) verwehren:\\n- Abschließen von Büroräumen beim Verlassen.\\n- Elektronisches Schließsystem mit chipkartenbasierter Protokollierung.\\n- Serverräume sind alarmgesichert und klimatisiert; Zutritt nur für autorisiertes IT-Personal.\\n- Begleitung und Protokollierung von externen Besuchern und Handwerkern.\\n\\n## 2.2 Zugangskontrolle (System-Sicherheit)\\nMaßnahmen, die verhindern, dass unbefugte Personen Datenverarbeitungssysteme nutzen können:\\n- **Passwortrichtlinie:** Passwörter müssen mindestens 12 Zeichen lang sein und Groß-/Kleinschreibung, Zahlen und Sonderzeichen enthalten (erzwungen durch System-GPOs).\\n- **Zwei-Faktor-Authentifizierung (2FA):** Zwingend erforderlich für VPN-Verbindungen, E-Mail-Zugriff und Cloud-Dienste (M365, AWS).\\n- **Bildschirmsperre:** Automatische Aktivierung der Bildschirmsperre nach maximal 10 Minuten Inaktivität.\\n- **Virenschutz & Firewall:** Einsatz von zentral verwalteten Endpoint-Protection-Systemen und Next-Generation-Firewalls.\\n\\n## 2.3 Zugriffskontrolle (Daten-Sicherheit)\\nMaßnahmen, die gewährleisten, dass zur Benutzung eines Datenverarbeitungssystems Berechtigte ausschließlich auf die ihrer Zugriffsberechtigung unterliegenden Daten zugreifen können:\\n- **Need-to-Know-Prinzip:** Berechtigungen werden restriktiv und nur auf begründeten Antrag hin vergeben (Rollen- und Berechtigungskonzept).\\n- **Admin-Konten:** Administrative Tätigkeiten dürfen nur mit separaten Admin-Konten durchgeführt werden, nicht im normalen Tagesbetrieb.\\n- **Regelmäßiges Review:** Vierteljährliche Überprüfung aller aktiven Konten und Berechtigungsgruppen.\\n\\n## 2.4 Weitergabekontrolle (Übertragungs-Sicherheit)\\nMaßnahmen, die gewährleisten, dass personenbezogene Daten bei der elektronischen Übertragung oder während ihres Transports oder ihrer Speicherung auf Datenträger nicht unbefugt gelesen, kopiert, verändert oder entfernt werden können:\\n- **Verschlüsselung:** Zwingender Einsatz von Transportverschlüsselung (SSL/TLS, HTTPS) bei der Datenübertragung.\\n- **E-Mail-Verschlüsselung:** Vertrauliche E-Mails an Externe müssen verschlüsselt gesendet werden (PGP, S/MIME oder kennwortgeschützte ZIP-Dateien auf getrenntem Übertragungskanal).\\n- **Festplattenverschlüsselung:** Zwingende Verschlüsselung (BitLocker / FileVault) für alle mobilen Endgeräte (Laptops, Smartphones).\\n\\n## 2.5 Eingabekontrolle (Nachvollziehbarkeit)\\nMaßnahmen, die gewährleisten, dass nachträglich überprüft und festgestellt werden kann, ob und von wem personenbezogene Daten in Datenverarbeitungssysteme eingegeben, verändert oder entfernt worden sind:\\n- Aktivierung von Audit-Logs in allen produktiven Systemen und Datenbanken.\\n- Protokolle werden manipulationssicher gespeichert und nach den gesetzlichen Vorgaben rotiert und gelöscht.\\n\\n## 2.6 Verfügbarkeitskontrolle (Zuverlässigkeit)\\nMaßnahmen, die gewährleisten, dass personenbezogene Daten gegen zufällige Zerstörung oder Verlust geschützt sind:\\n- **Backup-Konzept:** Tägliche, inkrementelle und wöchentliche Vollsicherungen. Die Backups werden verschlüsselt und an einem getrennten Ort (Offsite / Cloud) gelagert.\\n- **Notstromversorgung (USV):** Absicherung kritischer Serverinfrastruktur gegen Stromausfälle.\\n- **Wiederherstellungstests:** Mindestens halbjährliche Tests der Datenwiederherstellung (Restore-Tests) zur Verifikation der Backup-Integrität.\\n\\n## 2.7 Trennungsgebot (Zwecktrennung)\\nMaßnahmen, die gewährleisten, dass zu unterschiedlichen Zwecken erhobene Daten getrennt verarbeitet werden können:\\n- Trennung von Entwicklungs-, Test- und Produktivumgebungen. Keine Verwendung von echten Produktionsdaten in Testsystemen.\\n- Logische Trennung von Mandantendaten in unseren Datenbanken (Multitenancy-Absicherung).\\n\\n# 3. Überwachung und Wirksamkeitsprüfung\\n- Der Informationssicherheitsbeauftragte (ISB) führt in enger Abstimmung mit dem Datenschutzbeauftragten (DSB) regelmäßige Audits der technischen und organisatorischen Maßnahmen durch.\\n- Die Ergebnisse werden im PrivaShield TOM-Modul und im internen Auditprotokoll dokumentiert und dienen als Grundlage für den PDCA-Verbesserungsprozess.\"},{\"titel\":\"4.1 Konzept: Interne Datenschutz-Audits & Kontrollen\",\"kategorie\":\"verfahrensdokumentation\",\"dokumentTyp\":\"audit\",\"beschreibung\":\"Konzept und Prüfleitfaden für die Durchführung systematischer interner Datenschutz-Audits zur Sicherstellung und Verbesserung des Datenschutzniveaus gemäß Art. 32 Abs. 1 lit. d und Art. 24 DSGVO.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Prüfung\\n- [ ] Freigegeben\\n\\nGültig für:  \\n**Datenschutzbeauftragter (DSB), Datenschutzmanager und Abteilungsleiter**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\n# 1. Zielsetzung und gesetzliche Pflicht\\nDie Wirksamkeit der getroffenen Schutzmaßnahmen (TOM) muss regelmäßig überprüft, bewertet und evaluiert werden (Art. 32 Abs. 1 lit. d DSGVO). Zudem fordert die Rechenschaftspflicht (Art. 5 Abs. 2 DSGVO) den Nachweis, dass die Datenschutzgrundsätze im Alltag eingehalten werden.\\n\\nDieses Auditkonzept der **{{snippet: global_organisation}}** stellt sicher, dass:\\n- Schwachstellen, Prozessfehler oder Compliance-Lücken im Umgang mit personenbezogenen Daten frühzeitig erkannt werden.\\n- Abteilungen und Verantwortliche systematisch überprüft und beraten werden.\\n- Korrekturmaßnahmen eingeleitet, nachverfolgt und dokumentiert werden (PDCA-Verbesserungszyklus).\\n\\n# 2. Audit-Typen und Intervalle\\n\\n- **System-Audits (Jährlich):** Ganzheitliche Überprüfung des gesamten Datenschutz-Management-Systems (DSMS), inklusive Aktualität des VVT, Schulungsstände, Löschkonzepte und Verträge.\\n- **Bereichs-Audits (Halbjährlich rollierend):** Gezielte Prüfung einzelner Fachbereiche mit hohem Risiko (z. B. HR/Personal, Marketing/Webseiten, Kundenservice, IT-Administration).\\n- **Anlassbezogene Audits (Unverzüglich):** Bei schweren Datenpannen, Sicherheitsvorfällen, Beschwerden von Betroffenen, behördlichen Kontrollen oder wesentlichen Prozessumstellungen.\\n\\n# 3. Der Auditprozess (Ablauf)\\n\\n```mermaid\\ngraph TD\\n    A[Audit-Planung & Ankündigung] --> B[Dokumentenprüfung & VVT-Abgleich]\\n    B --> C[Audit-Interviews & Stichproben]\\n    C --> D[Abweichungsanalyse & Risikobewertung]\\n    D --> E[Erstellung des Auditberichts]\\n    E --> F[PDCA-Korrekturmaßnahmen vereinbaren]\\n    F --> G[Nachverfolgung im PrivaShield]\\n```\\n\\n## Schritt 1: Planung und Vorbereitung\\n- Der Auditor (in der Regel der DSB oder ein externer Prüfer) stimmt den Termin und den Prüfungsbereich mit den Fachabteilungsleitern ab.\\n- Ein Prüfplan wird erstellt, der die konkreten Fragen und Stichproben festlegt (z. B. \\\"Prüfung der Löschfristen im Bewerber-Tool\\\").\\n\\n## Schritt 2: Dokumentenprüfung\\n- Der Auditor prüft vorab die bestehenden Leitlinien, Richtlinien, AV-Verträge des Bereichs sowie die entsprechenden VVT-Einträge im PrivaShield.\\n\\n## Schritt 3: Durchführung (Interviews & Stichproben)\\n- Durchführung von Interviews mit den Prozessverantwortlichen.\\n- Stichprobenhafte Prüfung der realen Gegebenheiten vor Ort bzw. in den Systemen (z. B. \\\"Zeigen Sie mir bitte die Berechtigungsgruppe für das Personal-Laufwerk\\\" oder \\\"Wie werden physische Akten geschreddert?\\\").\\n\\n## Schritt 4: Berichtserstellung und Bewertung\\n- Der Auditor dokumentiert positive Aspekte sowie Abweichungen (Lücken) und Empfehlungen.\\n- Die Abweichungen werden nach Schweregrad eingestuft:\\n  - **Geringfügige Abweichung:** Kein direkter Verstoß, aber Verbesserungspotenzial (Empfehlung).\\n  - **Wesentliche Abweichung:** Prozesslücke oder mangelnde Dokumentation (Korrekturmaßnahme erforderlich).\\n  - **Kritische Abweichung:** Direkter Verstoß gegen gesetzliche Vorgaben (z. B. fehlender AVV, unverschlüsselte Übertragung sensibler Daten) -> Sofortmaßnahme zwingend!\\n\\n## Schritt 5: PDCA-Zyklus und Nachverfolgung\\n- Für jede wesentliche oder kritische Abweichung wird eine konkrete Maßnahme mit Zuständigkeit und Erledigungsfrist vereinbart.\\n- Das Audit wird im PrivaShield Audits-Modul erfasst und die abgeleiteten Maßnahmen werden im PDCA- und Aufgabenmodul zur Nachverfolgung eingetragen.\\n\\n# 4. Nachweisbarkeit (Rechenschaft)\\nDie Auditberichte, Protokolle der Stichproben und die Nachweise der behobenen Mängel werden revisionssicher im PrivaShield archiviert. Sie dienen der Geschäftsführung als Nachweis gegenüber Aufsichtsbehörden bei Kontrollen.\"}]}",
      createdAt: new Date().toISOString(),
    }
  ],
  mandantenLogs: [],
  vorlagenpaketHistorie: [],
  users: [],
  vvt: [],
  avv: [],
  dsfa: [],
  datenpannen: [],
  dsr: [],
  tom: [],
  audits: [],
  pdca: [],
  loeschkonzept: [],
  aufgaben: [],
  dokumente: [],
  interneNotizen: [],
};

let _db: Low<DbSchema> | null = null;

async function getDb(): Promise<Low<DbSchema>> {
  if (_db) return _db;
  const dbDir = process.env.DATABASE_PATH
    ? path.dirname(process.env.DATABASE_PATH)
    : path.resolve("data");
  const jsonPath = path.join(dbDir, "privashield.json");
  const adapter = new JSONFile<DbSchema>(jsonPath);
  _db = new Low<DbSchema>(adapter, defaultData);
  await _db.read();
  // Merge defaults (in case new collections were added)
  _db.data = {
    ...defaultData,
    ..._db.data,
    meta: {
      ...defaultData.meta,
      ..._db.data?.meta,
      nextId: {
        ...defaultData.meta.nextId,
        ..._db.data?.meta?.nextId,
      },
    },
  };
  syncNextIds(_db);
  await _db.write();
  return _db;
}

function syncNextIds(db: Low<DbSchema>) {
  const collections: (keyof DbSchema)[] = [
    "mandanten",
    "mandantenGruppen",
    "vorlagenpakete",
    "mandantenLogs",
    "vorlagenpaketHistorie",
    "users",
    "vvt",
    "avv",
    "dsfa",
    "datenpannen",
    "dsr",
    "tom",
    "aufgaben",
    "dokumente",
    "loeschkonzept",
    "audits",
    "pdca",
    "interneNotizen",
  ];

  for (const col of collections) {
    const rows = db.data[col] as unknown as Array<{ id?: number }>;
    const maxId = rows.reduce((max, row) => Math.max(max, Number(row?.id || 0)), 0);
    db.data.meta.nextId[col as string] = Math.max(db.data.meta.nextId[col as string] ?? 0, maxId);
  }
}

function nextId(db: Low<DbSchema>, col: string): number {
  const cur = db.data.meta.nextId[col] ?? 0;
  const id = cur + 1;
  db.data.meta.nextId[col] = id;
  return id;
}

export class LowdbStorage implements IStorage {
  // ─── Users ───────────────────────────────────────────────────────────────
  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await getDb();
    return db.data.users.find((u) => u.email === email);
  }
  async getUserById(id: number): Promise<User | undefined> {
    const db = await getDb();
    return db.data.users.find((u) => u.id === id);
  }
  async createUser(data: InsertUser & { password?: string }): Promise<User> {
    const db = await getDb();
    const { password, ...rest } = data as any;
    const passwordHash = await bcrypt.hash(password || "", 12);
    const user: User = {
      id: nextId(db, "users"),
      email: rest.email,
      name: rest.name,
      role: rest.role ?? "user",
      passwordHash,
      mandantIds: rest.mandantIds ?? "[]",
      aktiv: true,
      failedLoginAttempts: 0,
      temporaryLockUntil: null as any,
      adminLocked: false,
      adminLockedAt: null as any,
      lastFailedLoginAt: null as any,
      createdAt: new Date().toISOString(),
    };
    db.data.users.push(user);
    await db.write();
    return user;
  }
  async getAllUsers(): Promise<User[]> {
    const db = await getDb();
    return db.data.users;
  }
  async updateUser(id: number, data: Partial<InsertUser> & { password?: string }): Promise<User | undefined> {
    const db = await getDb();
    const idx = db.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    const { password, ...rest } = data as any;
    const updates: any = { ...rest };
    if (password) updates.passwordHash = await bcrypt.hash(password, 12);
    db.data.users[idx] = { ...db.data.users[idx], ...updates };
    await db.write();
    return db.data.users[idx];
  }
  async deleteUser(id: number): Promise<void> {
    const db = await getDb();
    db.data.users = db.data.users.filter((u) => u.id !== id);
    await db.write();
  }

  // ─── Mandanten ───────────────────────────────────────────────────────────
  async getMandanten(): Promise<Mandant[]> {
    const db = await getDb();
    return db.data.mandanten;
  }
  async getMandant(id: number): Promise<Mandant | undefined> {
    const db = await getDb();
    return db.data.mandanten.find((m) => m.id === id);
  }
  async createMandant(data: InsertMandant): Promise<Mandant> {
    const db = await getDb();
    const item: Mandant = { id: nextId(db, "mandanten"), ...data as any, createdAt: new Date().toISOString() };
    db.data.mandanten.push(item);
    db.data.mandantenLogs.push({
      id: nextId(db, "mandantenLogs"),
      mandantId: item.id,
      zeitpunkt: new Date().toISOString(),
      userId: null as any,
      userName: "System",
      aktion: "mandant_erstellt",
      modul: "mandanten",
      entitaetTyp: "mandant",
      entitaetId: item.id,
      beschreibung: `Mandant '${item.name}' wurde angelegt.`,
      detailsJson: JSON.stringify(item),
    });
    await db.write();
    return item;
  }
  async updateMandant(id: number, data: Partial<InsertMandant>): Promise<Mandant | undefined> {
    const db = await getDb();
    const idx = db.data.mandanten.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    const vorher = db.data.mandanten[idx];
    db.data.mandanten[idx] = { ...db.data.mandanten[idx], ...data as any };
    db.data.mandantenLogs.push({
      id: nextId(db, "mandantenLogs"),
      mandantId: id,
      zeitpunkt: new Date().toISOString(),
      userId: null as any,
      userName: "System",
      aktion: "mandant_aktualisiert",
      modul: "mandanten",
      entitaetTyp: "mandant",
      entitaetId: id,
      beschreibung: `Mandant '${db.data.mandanten[idx].name}' wurde aktualisiert.`,
      detailsJson: JSON.stringify({ vorher, nachher: db.data.mandanten[idx] }),
    });
    await db.write();
    return db.data.mandanten[idx];
  }
  async deleteMandant(id: number): Promise<void> {
    const db = await getDb();
    db.data.mandanten = db.data.mandanten.filter((m) => m.id !== id);
    await db.write();
  }

  // ─── Mandantengruppen ─────────────────────────────────────────────────────
  async getMandantenGruppen(): Promise<MandantenGruppe[]> {
    const db = await getDb();
    return db.data.mandantenGruppen;
  }
  async getMandantenGruppe(id: number): Promise<MandantenGruppe | undefined> {
    const db = await getDb();
    return db.data.mandantenGruppen.find((g) => g.id === id);
  }
  async createMandantenGruppe(data: InsertMandantenGruppe): Promise<MandantenGruppe> {
    const db = await getDb();
    const item: MandantenGruppe = { id: nextId(db, "mandantenGruppen"), ...data as any, createdAt: new Date().toISOString() };
    db.data.mandantenGruppen.push(item);
    await db.write();
    return item;
  }
  async updateMandantenGruppe(id: number, data: Partial<InsertMandantenGruppe>): Promise<MandantenGruppe | undefined> {
    const db = await getDb();
    const idx = db.data.mandantenGruppen.findIndex((g) => g.id === id);
    if (idx === -1) return undefined;
    db.data.mandantenGruppen[idx] = { ...db.data.mandantenGruppen[idx], ...data as any };
    await db.write();
    return db.data.mandantenGruppen[idx];
  }
  async deleteMandantenGruppe(id: number): Promise<void> {
    const db = await getDb();
    db.data.mandantenGruppen = db.data.mandantenGruppen.filter((g) => g.id !== id);
    await db.write();
  }

  // ─── Vorlagenpakete ───────────────────────────────────────────────────────
  async getVorlagenpakete(): Promise<Vorlagenpaket[]> {
    const db = await getDb();
    return db.data.vorlagenpakete;
  }
  async getVorlagenpaket(id: number): Promise<Vorlagenpaket | undefined> {
    const db = await getDb();
    return db.data.vorlagenpakete.find((p) => p.id === id);
  }
  async createVorlagenpaket(data: InsertVorlagenpaket): Promise<Vorlagenpaket> {
    const db = await getDb();
    const item: Vorlagenpaket = { id: nextId(db, "vorlagenpakete"), ...data as any, createdAt: new Date().toISOString() };
    db.data.vorlagenpakete.push(item);
    await db.write();
    return item;
  }
  async updateVorlagenpaket(id: number, data: Partial<InsertVorlagenpaket>): Promise<Vorlagenpaket | undefined> {
    const db = await getDb();
    const idx = db.data.vorlagenpakete.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    db.data.vorlagenpakete[idx] = { ...db.data.vorlagenpakete[idx], ...data as any };
    await db.write();
    return db.data.vorlagenpakete[idx];
  }
  async deleteVorlagenpaket(id: number): Promise<void> {
    const db = await getDb();
    db.data.vorlagenpakete = db.data.vorlagenpakete.filter((p) => p.id !== id);
    await db.write();
  }
  async applyVorlagenpaketToMandant(mandantId: number, paketId: number, user?: { id?: number; name?: string }): Promise<{ ok: true; created: Record<string, number>; skipped: Record<string, number> }> {
    const db = await getDb();
    const paket = db.data.vorlagenpakete.find((p) => p.id === paketId);
    if (!paket) throw new Error("Vorlagenpaket nicht gefunden");
    const inhalt = JSON.parse(paket.inhaltJson || "{}");
    const created = { aufgaben: 0, dokumente: 0, vvt: 0, avv: 0, dsfa: 0, tom: 0 };
    const skipped = { aufgaben: 0, dokumente: 0, vvt: 0, avv: 0, dsfa: 0, tom: 0 };
    for (const a of inhalt.aufgaben || []) {
      if (!String(a?.titel || "").trim()) {
        skipped.aufgaben++;
        continue;
      }
      (db.data.aufgaben as Aufgabe[]).push({
        id: nextId(db, "aufgaben"),
        mandantId,
        titel: a.titel,
        beschreibung: a.beschreibung || "",
        typ: a.typ || "task",
        prioritaet: a.prioritaet || "mittel",
        status: a.status || "offen",
        fortschritt: a.fortschritt || 0,
        verantwortlicher: a.verantwortlicher || "",
        startDatum: a.startDatum || null as any,
        faelligAm: a.faelligAm || null as any,
        abgeschlossenAm: null as any,
        kategorie: a.kategorie || "sonstige",
        referenzId: null as any,
        parentTaskId: null as any,
        sortierung: a.sortierung || 0,
        vorlagenBezug: paket.name,
        createdAt: new Date().toISOString(),
      });
      created.aufgaben++;
    }
    for (const d of inhalt.dokumente || []) {
      if (!String(d?.titel || "").trim()) {
        skipped.dokumente++;
        continue;
      }
      (db.data.dokumente as Dokument[]).push({
        id: nextId(db, "dokumente"),
        mandantId,
        titel: d.titel,
        kategorie: d.kategorie || "vorlage",
        beschreibung: d.beschreibung || "",
        dokumentTyp: d.dokumentTyp || "vorlage",
        dateiname: d.dateiname || "",
        version: d.version || "1.0",
        status: d.status || "entwurf",
        gueltigBis: null as any,
        verantwortlicher: d.verantwortlicher || "",
        freigegebenVon: null as any,
        freigegebenAm: null as any,
        naechstePruefungAm: null as any,
        inhalt: d.inhalt || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      created.dokumente++;
    }
    for (const item of inhalt.vvt || []) {
      if (!String(item?.bezeichnung || "").trim()) {
        skipped.vvt++;
        continue;
      }
      (db.data.vvt as Vvt[]).push({
        id: nextId(db, "vvt"),
        mandantId,
        bezeichnung: item.bezeichnung,
        zweck: item.zweck || "",
        rechtsgrundlage: item.rechtsgrundlage || "",
        datenkategorien: JSON.stringify(Array.isArray(item.datenkategorien) ? item.datenkategorien : []),
        betroffenePersonen: JSON.stringify(Array.isArray(item.betroffenePersonen) ? item.betroffenePersonen : []),
        empfaenger: item.empfaenger || "",
        drittlandtransfer: !!item.drittlandtransfer,
        risikostufe: item.risikostufe || "niedrig",
        risikobegruendung: item.risikobegruendung || "",
        risikoTriggers: JSON.stringify(Array.isArray(item.risikoTriggers) ? item.risikoTriggers : (() => { try { return JSON.parse(item.risikoTriggers || "[]"); } catch { return []; } })()),
        risikopruefungAm: item.risikopruefungAm || new Date().toISOString().slice(0, 10),
        loeschfrist: item.loeschfrist || "",
        loeschklasse: item.loeschklasse || "",
        aufbewahrungsgrund: item.aufbewahrungsgrund || "",
        tomHinweis: item.tomHinweis || "",
        verantwortlicher: item.verantwortlicher || "",
        verantwortlicherEmail: item.verantwortlicherEmail || "",
        verantwortlicherTelefon: item.verantwortlicherTelefon || "",
        status: item.status || "entwurf",
        dsfa: !!item.dsfa,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      created.vvt++;
    }
    for (const item of inhalt.avv || []) {
      if (!String(item?.auftragsverarbeiter || "").trim()) {
        skipped.avv++;
        continue;
      }
      (db.data.avv as Avv[]).push({
        id: nextId(db, "avv"),
        mandantId,
        auftragsverarbeiter: item.auftragsverarbeiter,
        gegenstand: item.gegenstand || "",
        vertragsdatum: item.vertragsdatum || "",
        laufzeit: item.laufzeit || "",
        status: item.status || "entwurf",
        sccs: !!item.sccs,
        subauftragnehmer: JSON.stringify(Array.isArray(item.subauftragnehmer) ? item.subauftragnehmer : []),
        avKontaktName: item.avKontaktName || "",
        avKontaktEmail: item.avKontaktEmail || "",
        avKontaktTelefon: item.avKontaktTelefon || "",
        genehmigteSubdienstleister: JSON.stringify(Array.isArray(item.genehmigteSubdienstleister) ? item.genehmigteSubdienstleister : []),
        pruefFaellig: item.pruefFaellig || "",
        datenarten: item.datenarten || "",
        betroffenePersonen: item.betroffenePersonen || "",
        technischeMassnahmen: item.technischeMassnahmen || "",
        pruefintervall: item.pruefintervall || "",
        subauftragnehmerHinweis: item.subauftragnehmerHinweis || "",
        notizen: item.notizen || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      created.avv++;
    }
    for (const item of inhalt.dsfa || []) {
      if (!String(item?.titel || "").trim()) {
        skipped.dsfa++;
        continue;
      }
      (db.data.dsfa as Dsfa[]).push({
        id: nextId(db, "dsfa"),
        mandantId,
        titel: item.titel,
        vvtId: item.vvtId ?? null as any,
        beschreibung: item.beschreibung || "",
        zweck: item.zweck || "",
        prozessablauf: item.prozessablauf || "",
        verarbeitungskontext: item.verarbeitungskontext || "",
        datenquellen: item.datenquellen || "",
        empfaenger: item.empfaenger || "",
        drittlandtransfer: !!item.drittlandtransfer,
        auftragsverarbeiter: item.auftragsverarbeiter || "",
        technologienSysteme: item.technologienSysteme || "",
        profiling: !!item.profiling,
        automatisierteEntscheidung: !!item.automatisierteEntscheidung,
        notwendigkeit: item.notwendigkeit || "",
        rechtsgrundlage: item.rechtsgrundlage || "",
        zweckbindungBewertung: item.zweckbindungBewertung || "",
        datenminimierungBewertung: item.datenminimierungBewertung || "",
        speicherbegrenzungBewertung: item.speicherbegrenzungBewertung || "",
        transparenzBewertung: item.transparenzBewertung || "",
        betroffenenrechteBewertung: item.betroffenenrechteBewertung || "",
        zugriffskonzeptBewertung: item.zugriffskonzeptBewertung || "",
        privacyByDesignBewertung: item.privacyByDesignBewertung || "",
        risiken: JSON.stringify(Array.isArray(item.risiken) ? item.risiken : []),
        massnahmen: item.massnahmen || "",
        restrisikoBegruendung: item.restrisikoBegruendung || "",
        art36Erforderlich: !!item.art36Erforderlich,
        art36Begruendung: item.art36Begruendung || "",
        ergebnis: item.ergebnis || "",
        konsultation: !!item.konsultation,
        status: item.status || "entwurf",
        reviewer: item.reviewer || "",
        verantwortlicherBereich: item.verantwortlicherBereich || "",
        dsbBeteiligt: !!item.dsbBeteiligt,
        dsbStellungnahme: item.dsbStellungnahme || "",
        freigabeentscheidung: item.freigabeentscheidung || "",
        freigabeBegruendung: item.freigabeBegruendung || "",
        freigabeDatum: item.freigabeDatum || "",
        naechstePruefungAm: item.naechstePruefungAm || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      created.dsfa++;
    }
    for (const item of inhalt.tom || []) {
      if (!String(item?.kategorie || "").trim() || !String(item?.massnahme || "").trim()) {
        skipped.tom++;
        continue;
      }
      (db.data.tom as Tom[]).push({
        id: nextId(db, "tom"),
        mandantId,
        kategorie: item.kategorie,
        massnahme: item.massnahme,
        beschreibung: item.beschreibung || "",
        status: item.status || "geplant",
        verantwortlicher: item.verantwortlicher || "",
        pruefDatum: item.pruefDatum || "",
        pruefintervall: item.pruefintervall || "",
        schutzziel: item.schutzziel || "",
        nachweis: item.nachweis || "",
        wirksamkeit: item.wirksamkeit || "",
        notizen: item.notizen || "",
        createdAt: new Date().toISOString(),
      });
      created.tom++;
    }
    db.data.mandantenLogs.push({
      id: nextId(db, "mandantenLogs"),
      mandantId,
      zeitpunkt: new Date().toISOString(),
      userId: user?.id ?? null as any,
      userName: user?.name ?? "System",
      aktion: "vorlagenpaket_zugewiesen",
      modul: "vorlagenpakete",
      entitaetTyp: "vorlagenpaket",
      entitaetId: paketId,
      beschreibung: `Vorlagenpaket '${paket.name}' wurde angewendet.`,
      detailsJson: JSON.stringify({ paketId, paketName: paket.name, created, skipped }),
    });
    db.data.vorlagenpaketHistorie.push({
      id: nextId(db, "vorlagenpaketHistorie"),
      mandantId,
      paketId,
      paketName: paket.name,
      paketVersion: paket.version || "1.0",
      angewendetAm: new Date().toISOString(),
      angewendetVon: user?.name ?? "System",
      detailsJson: JSON.stringify({ created, skipped }),
    });
    await db.write();
    return { ok: true, created, skipped };
  }

  // ─── Mandanten-Logs ───────────────────────────────────────────────────────
  async getMandantenLogs(mandantId: number): Promise<MandantenLog[]> {
    const db = await getDb();
    return db.data.mandantenLogs.filter((l) => l.mandantId === mandantId).sort((a, b) => ((a.zeitpunkt || "") < (b.zeitpunkt || "") ? 1 : -1));
  }
  async createMandantenLog(data: InsertMandantenLog): Promise<MandantenLog> {
    const db = await getDb();
    const item: MandantenLog = { id: nextId(db, "mandantenLogs"), ...data as any, zeitpunkt: new Date().toISOString() };
    db.data.mandantenLogs.push(item);
    await db.write();
    return item;
  }

  async getVorlagenpaketHistorie(mandantId: number): Promise<VorlagenpaketHistorie[]> {
    const db = await getDb();
    return db.data.vorlagenpaketHistorie.filter((h) => h.mandantId === mandantId).sort((a, b) => ((a.angewendetAm || "") < (b.angewendetAm || "") ? 1 : -1));
  }
  async createVorlagenpaketHistorie(data: InsertVorlagenpaketHistorie): Promise<VorlagenpaketHistorie> {
    const db = await getDb();
    const item: VorlagenpaketHistorie = { id: nextId(db, "vorlagenpaketHistorie"), ...data as any, angewendetAm: new Date().toISOString() };
    db.data.vorlagenpaketHistorie.push(item);
    await db.write();
    return item;
  }

  // ─── Generic helper ──────────────────────────────────────────────────────
  private async _getAll<T extends { mandantId: number }>(col: keyof DbSchema, mandantId: number): Promise<T[]> {
    const db = await getDb();
    return (db.data[col] as unknown as T[]).filter((x) => x.mandantId === mandantId);
  }
  private async _getOne<T extends { id: number }>(col: keyof DbSchema, id: number): Promise<T | undefined> {
    const db = await getDb();
    return (db.data[col] as unknown as T[]).find((x) => x.id === id);
  }
  private async _create<T extends { id: number }>(col: keyof DbSchema, data: any, extra?: any): Promise<T> {
    const db = await getDb();
    const now = new Date().toISOString();
    const item: T = { id: nextId(db, col as string), ...data, createdAt: now, updatedAt: now, ...extra };
    (db.data[col] as unknown as T[]).push(item);
    await db.write();
    return item;
  }
  private async _update<T extends { id: number }>(col: keyof DbSchema, id: number, data: any): Promise<T | undefined> {
    const db = await getDb();
    const arr = db.data[col] as unknown as T[];
    const idx = arr.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    arr[idx] = { ...arr[idx], ...data, updatedAt: new Date().toISOString() };
    await db.write();
    return arr[idx];
  }
  private async _delete(col: keyof DbSchema, id: number): Promise<void> {
    const db = await getDb();
    (db.data[col] as unknown as any[]) = (db.data[col] as unknown as any[]).filter((x: any) => x.id !== id);
    await db.write();
  }

  // ─── VVT ─────────────────────────────────────────────────────────────────
  async getVvtByMandant(mandantId: number) { return this._getAll<Vvt>("vvt", mandantId); }
  async getVvt(id: number) { return this._getOne<Vvt>("vvt", id); }
  async createVvt(data: InsertVvt) { return this._create<Vvt>("vvt", data); }
  async updateVvt(id: number, data: Partial<InsertVvt>) { return this._update<Vvt>("vvt", id, data); }
  async deleteVvt(id: number) { return this._delete("vvt", id); }

  // ─── AVV ─────────────────────────────────────────────────────────────────
  async getAvvByMandant(mandantId: number) { return this._getAll<Avv>("avv", mandantId); }
  async getAvv(id: number) { return this._getOne<Avv>("avv", id); }
  async createAvv(data: InsertAvv) { return this._create<Avv>("avv", data); }
  async updateAvv(id: number, data: Partial<InsertAvv>) { return this._update<Avv>("avv", id, data); }
  async deleteAvv(id: number) { return this._delete("avv", id); }

  // ─── DSFA ────────────────────────────────────────────────────────────────
  async getDsfaByMandant(mandantId: number) { return this._getAll<Dsfa>("dsfa", mandantId); }
  async getDsfa(id: number) { return this._getOne<Dsfa>("dsfa", id); }
  async createDsfa(data: InsertDsfa) { return this._create<Dsfa>("dsfa", data); }
  async updateDsfa(id: number, data: Partial<InsertDsfa>) { return this._update<Dsfa>("dsfa", id, data); }
  async deleteDsfa(id: number) { return this._delete("dsfa", id); }

  // ─── Datenpannen ─────────────────────────────────────────────────────────
  async getDatenpannenByMandant(mandantId: number) { return this._getAll<Datenpanne>("datenpannen", mandantId); }
  async getDatenpanne(id: number) { return this._getOne<Datenpanne>("datenpannen", id); }
  async createDatenpanne(data: InsertDatenpanne) { return this._create<Datenpanne>("datenpannen", data); }
  async updateDatenpanne(id: number, data: Partial<InsertDatenpanne>) { return this._update<Datenpanne>("datenpannen", id, data); }
  async deleteDatenpanne(id: number) { return this._delete("datenpannen", id); }

  // ─── DSR ─────────────────────────────────────────────────────────────────
  async getDsrByMandant(mandantId: number) { return this._getAll<Dsr>("dsr", mandantId); }
  async getDsr(id: number) { return this._getOne<Dsr>("dsr", id); }
  async createDsr(data: InsertDsr) { return this._create<Dsr>("dsr", data); }
  async updateDsr(id: number, data: Partial<InsertDsr>) { return this._update<Dsr>("dsr", id, data); }
  async deleteDsr(id: number) { return this._delete("dsr", id); }

  // ─── TOM ─────────────────────────────────────────────────────────────────
  async getTomByMandant(mandantId: number) { return this._getAll<Tom>("tom", mandantId); }
  async getTom(id: number) { return this._getOne<Tom>("tom", id); }
  async createTom(data: InsertTom) { return this._create<Tom>("tom", data); }
  async updateTom(id: number, data: Partial<InsertTom>) { return this._update<Tom>("tom", id, data); }
  async deleteTom(id: number) { return this._delete("tom", id); }

  // ─── Audit ────────────────────────────────────────────────────────────────
  async getAuditsByMandant(mandantId: number) { return this._getAll<Audit>("audits", mandantId); }
  async getAudit(id: number) { return this._getOne<Audit>("audits", id); }
  async createAudit(data: InsertAudit) { return this._create<Audit>("audits", data); }
  async updateAudit(id: number, data: Partial<InsertAudit>) { return this._update<Audit>("audits", id, data); }
  async deleteAudit(id: number) { return this._delete("audits", id); }

  // ─── Löschkonzept ───────────────────────────────────────────────────────
  async getLoeschkonzeptByMandant(mandantId: number): Promise<Loeschkonzept[]> {
    const db = await getDb();
    return db.data.loeschkonzept.filter((x) => x.mandantId === mandantId).sort((a, b) => ((a.updatedAt || a.createdAt || "") < (b.updatedAt || b.createdAt || "") ? 1 : -1));
  }
  async getLoeschkonzept(id: number): Promise<Loeschkonzept | undefined> {
    const db = await getDb();
    return db.data.loeschkonzept.find((x) => x.id === id);
  }
  async createLoeschkonzept(data: InsertLoeschkonzept): Promise<Loeschkonzept> {
    const db = await getDb();
    const now = new Date().toISOString();
    const item: Loeschkonzept = { id: nextId(db, "loeschkonzept"), ...data as any, createdAt: now, updatedAt: now };
    db.data.loeschkonzept.push(item);
    await db.write();
    return item;
  }
  async updateLoeschkonzept(id: number, data: Partial<InsertLoeschkonzept>): Promise<Loeschkonzept | undefined> {
    const db = await getDb();
    const idx = db.data.loeschkonzept.findIndex((x) => x.id === id);
    if (idx === -1) return undefined;
    db.data.loeschkonzept[idx] = { ...db.data.loeschkonzept[idx], ...data as any, updatedAt: new Date().toISOString() };
    await db.write();
    return db.data.loeschkonzept[idx];
  }
  async deleteLoeschkonzept(id: number): Promise<void> {
    const db = await getDb();
    db.data.loeschkonzept = db.data.loeschkonzept.filter((x) => x.id !== id);
    await db.write();
  }

  // ─── Aufgaben ─────────────────────────────────────────────────────────────
  async getAufgabenByMandant(mandantId: number) { return this._getAll<Aufgabe>("aufgaben", mandantId); }
  async getAufgabe(id: number) { return this._getOne<Aufgabe>("aufgaben", id); }
  async createAufgabe(data: InsertAufgabe) { return this._create<Aufgabe>("aufgaben", data); }
  async updateAufgabe(id: number, data: Partial<InsertAufgabe>) { return this._update<Aufgabe>("aufgaben", id, data); }
  async deleteAufgabe(id: number) { return this._delete("aufgaben", id); }

  // ─── Dokumente ────────────────────────────────────────────────────────────
  async getDokumenteByMandant(mandantId: number) { return this._getAll<Dokument>("dokumente", mandantId); }
  async getDokument(id: number) { return this._getOne<Dokument>("dokumente", id); }
  async createDokument(data: InsertDokument) { return this._create<Dokument>("dokumente", data); }
  async updateDokument(id: number, data: Partial<InsertDokument>) { return this._update<Dokument>("dokumente", id, data); }
  async deleteDokument(id: number) { return this._delete("dokumente", id); }

  async getInterneNotizenByMandant(mandantId: number) { return this._getAll<InterneNotiz>("interneNotizen", mandantId); }
  async getInterneNotiz(id: number) { return this._getOne<InterneNotiz>("interneNotizen", id); }
  async createInterneNotiz(data: InsertInterneNotiz) { const now = new Date().toISOString(); return this._create<InterneNotiz>("interneNotizen", { ...data, createdAt: now, updatedAt: now } as any); }
  async updateInterneNotiz(id: number, data: Partial<InsertInterneNotiz>) { return this._update<InterneNotiz>("interneNotizen", id, { ...data, updatedAt: new Date().toISOString() } as any); }
  async deleteInterneNotiz(id: number) { return this._delete("interneNotizen", id); }

  async getPdcaByMandant(mandantId: number) { return this._getAll<Pdca>("pdca", mandantId); }
  async getPdca(id: number) { return this._getOne<Pdca>("pdca", id); }
  async createPdca(data: InsertPdca) { const now = new Date().toISOString(); return this._create<Pdca>("pdca", { ...data, createdAt: now, updatedAt: now } as any); }
  async updatePdca(id: number, data: Partial<InsertPdca>) { return this._update<Pdca>("pdca", id, { ...data, updatedAt: new Date().toISOString() } as any); }
  async deletePdca(id: number) { return this._delete("pdca", id); }

  // ─── Stats ────────────────────────────────────────────────────────────────
  async getStatsForMandant(mandantId: number): Promise<Record<string, number>> {
    const db = await getDb();
    const f = (col: keyof DbSchema) => (db.data[col] as any[]).filter((x: any) => x.mandantId === mandantId).length;
    return {
      vvt: f("vvt"),
      avv: f("avv"),
      dsfa: f("dsfa"),
      datenpannen: f("datenpannen"),
      dsr: f("dsr"),
      tom: f("tom"),
      audits: f("audits"),
      pdca: f("pdca"),
      loeschkonzept: f("loeschkonzept"),
      aufgaben: f("aufgaben"),
      offeneAufgaben: (db.data.aufgaben as Aufgabe[]).filter((x) => x.mandantId === mandantId && x.status === "offen").length,
      dokumente: f("dokumente"),
    };
  }
}


// interne notizen
export interface __LowdbStorageInterneNotizenMarker {}

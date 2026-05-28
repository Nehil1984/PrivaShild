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
      name: "DSDMS \u2013 DSMS Governance & Richtlinien",
      beschreibung: "Umfassendes Datenschutz-Management-System (DSMS) Paket mit ausformulierten Leitlinien, Standard-Prozessen (Betroffenenrechte, Datenpannen), operativen Richtlinien (Besch\u00e4ftigtendatenschutz, Web-Compliance, TOM) und Audit-Konzepten.",
      kategorie: "datenschutz",
      version: "1.1",
      aktiv: true,
      inhaltJson: "{\"aufgaben\":[{\"titel\":\"Datenschutzleitlinie abstimmen und freigeben\",\"beschreibung\":\"Die Grundsatzerkl\u00e4rung der Gesch\u00e4ftsf\u00fchrung zum Datenschutz (Art. 24 DSGVO) intern abstimmen, unterzeichnen und f\u00fcr alle Besch\u00e4ftigten zug\u00e4nglich machen.\",\"typ\":\"milestone\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"dokumente\",\"sortierung\":10},{\"titel\":\"Verzeichnis der Verarbeitungst\u00e4tigkeiten (VVT) anlegen\",\"beschreibung\":\"Erfassung aller datenverarbeitenden Prozesse des Unternehmens im VVT-Modul (Art. 30 DSGVO) zur Einhaltung der Rechenschaftspflicht.\",\"typ\":\"task\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"vvt\",\"sortierung\":20},{\"titel\":\"Prozess zur Bearbeitung von Betroffenenrechten einf\u00fchren\",\"beschreibung\":\"Sicherstellung der fristgerechten und sicheren Beantwortung von Anfragen betroffener Personen nach Art. 12-22 DSGVO (Auskunft, L\u00f6schung).\",\"typ\":\"task\",\"prioritaet\":\"mittel\",\"status\":\"offen\",\"kategorie\":\"dsr\",\"sortierung\":30},{\"titel\":\"Prozess zum Datenpannenmanagement schulen\",\"beschreibung\":\"Sensibilisierung der Belegschaft f\u00fcr Sicherheitsvorf\u00e4lle und Einf\u00fchrung des Prozesses zur Einhaltung der gesetzlichen 72-Stunden-Meldepflicht.\",\"typ\":\"task\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"datenpanne\",\"sortierung\":40},{\"titel\":\"Richtlinie Besch\u00e4ftigtendatenschutz mit Betriebsrat abstimmen\",\"beschreibung\":\"Verbindung der Anforderungen aus \u00a7 26 BDSG mit betrieblichen Abl\u00e4ufen und formelle Abstimmung/Betriebsvereinbarung vorbereiten.\",\"typ\":\"task\",\"prioritaet\":\"mittel\",\"status\":\"offen\",\"kategorie\":\"dokumente\",\"sortierung\":50},{\"titel\":\"Web-Datenschutz und Cookie-Compliance pr\u00fcfen\",\"beschreibung\":\"Verbindung von Webseite und Consent-Management-Tool analysieren und auf Einhaltung von \u00a7 25 TDDDG und DSGVO pr\u00fcfen.\",\"typ\":\"task\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"tom\",\"sortierung\":60},{\"titel\":\"Technische und organisatorische Ma\u00dfnahmen (TOM) dokumentieren\",\"beschreibung\":\"L\u00fcckenlose Erfassung der Sicherheitsma\u00dfnahmen (Zutritt, Zugang, Zugriff, Weitergabe, Verf\u00fcgbarkeit) nach Art. 32 DSGVO.\",\"typ\":\"task\",\"prioritaet\":\"hoch\",\"status\":\"offen\",\"kategorie\":\"tom\",\"sortierung\":70},{\"titel\":\"Erstes internes Datenschutz-Audit planen\",\"beschreibung\":\"Systematisches, internes Audit zur Einhaltung der Datenschutzvorgaben planen, durchf\u00fchren und dokumentieren (Art. 32 Abs. 1 lit. d DSGVO).\",\"typ\":\"review\",\"prioritaet\":\"mittel\",\"status\":\"offen\",\"kategorie\":\"audits\",\"sortierung\":80}],\"dokumente\":[{\"titel\":\"1.1 Leitlinie Datenschutz und Informationssicherheit\",\"kategorie\":\"leitlinie_datenschutz\",\"dokumentTyp\":\"leitlinie\",\"beschreibung\":\"Normatives Grundlagendokument des DSMS. Legt Grunds\u00e4tze, Ziele, Organisation und Verantwortlichkeiten f\u00fcr Datenschutz (DSGVO) und Informationssicherheit fest.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Pr\u00fcfung\\n- [ ] Freigegeben\\n\\nG\u00fcltig f\u00fcr:  \\n**Alle Besch\u00e4ftigten, Auftragsverarbeiter und Vertragspartner**\\n\\nVerantwortlich:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\nReview-Zyklus (in Monaten):  \\n**{{snippet: document_frontmatter name=review_cycle_months}}**\\n\\n# Versionsstand & \u00c4nderungsverzeichnis\\n\\nVersionshistorie und \u00c4nderungsnachverfolgung dieses Dokuments erfolgt durch das Versionskontrollsystem der Organisation. Die jeweils g\u00fcltige Fassung ist durch das Deckblatt und das im Seitenkopf angegebene Dokumentdatum gekennzeichnet.\\n\\n{{snippet: git_document_history format=table limit=15}}\\n\\n---\\n\\n# 1. Grundsatzerkl\u00e4rung des Managements\\n\\nDer Schutz personenbezogener Daten und die Wahrung des Grundrechts auf informationelle Selbstbestimmung sind fundamentale Pfeiler unserer Unternehmenskultur. Die Gesch\u00e4ftsf\u00fchrung der **{{snippet: global_organisation}}** verpflichtet sich, die Einhaltung aller datenschutzrechtlichen Vorgaben der Datenschutz-Grundverordnung (DSGVO), des Bundesdatenschutzgesetzes (BDSG) sowie weiterer relevanter Gesetze zur Digital- und Telekommunikations-Compliance uneingeschr\u00e4nkt sicherzustellen.\\n\\nAls Unternehmen verarbeiten wir eine Vielzahl von \u2013 auch personenbezogenen \u2013 Daten, um unsere Aufgaben und Pflichten gegen\u00fcber unseren Kunden, Vertragspartnern, Dienstleistern, \u00f6ffentlichen Stellen und sonstigen Dritten zu erf\u00fcllen. Diese Leitlinie bildet das normative Fundament unseres Datenschutz-Management-Systems (DSMS) und legt die grundlegenden Prinzipien fest, nach denen wir Daten verarbeiten. Sie definiert dar\u00fcber hinaus die Strategie, Organisation und Ziele von Datenschutz und Informationssicherheit in unserem Unternehmen.\\n\\n# 2. Geltungsbereich\\n\\nDiese Leitlinie gilt f\u00fcr das gesamte Unternehmen und erstreckt sich auf alle Standorte. Sie verpflichtet alle Besch\u00e4ftigten, Auftragsverarbeiter, Lieferanten und sonstigen externen Partner zur Einhaltung der hier festgelegten Grunds\u00e4tze.\\n\\n# 3. Datenschutzgrunds\u00e4tze (Art. 5 DSGVO)\\n\\nJede Verarbeitung personenbezogener Daten hat unter strikter Einhaltung der folgenden gesetzlichen Grunds\u00e4tze zu erfolgen:\\n\\n1. **Rechtm\u00e4\u00dfigkeit, Verarbeitung nach Treu und Glauben, Transparenz:** Datenverarbeitungen m\u00fcssen auf einer wirksamen Rechtsgrundlage (Art. 6 und Art. 9 DSGVO) beruhen. Betroffene Personen m\u00fcssen umfassend und verst\u00e4ndlich informiert werden.\\n2. **Zweckbindung:** Daten d\u00fcrfen nur f\u00fcr festgelegte, eindeutige und rechtm\u00e4\u00dfige Zwecke erhoben werden. Eine Zweck\u00e4nderung ist grunds\u00e4tzlich unzul\u00e4ssig.\\n3. **Datenminimierung:** Die Verarbeitung ist auf das f\u00fcr die Zwecke notwendige Ma\u00df zu beschr\u00e4nken (\u201eso viel wie n\u00f6tig, so wenig wie m\u00f6glich\\\").\\n4. **Richtigkeit:** Unrichtige Daten m\u00fcssen unverz\u00fcglich korrigiert oder gel\u00f6scht werden.\\n5. **Speicherbegrenzung:** Daten m\u00fcssen in einer Form gespeichert werden, die die Identifizierung der betroffenen Personen nur so lange erm\u00f6glicht, wie es f\u00fcr die Zwecke erforderlich ist.\\n6. **Integrit\u00e4t und Vertraulichkeit:** Durch geeignete technische und organisatorische Ma\u00dfnahmen (TOM) gew\u00e4hrleisten wir den Schutz vor unbefugter oder unrechtm\u00e4\u00dfiger Verarbeitung, Zerst\u00f6rung oder Besch\u00e4digung.\\n7. **Verf\u00fcgbarkeit und Belastbarkeit:** Systeme und Dienste m\u00fcssen dauerhaft verf\u00fcgbar und widerstandsf\u00e4hig gegen\u00fcber Ausf\u00e4llen sein.\\n8. **Intervenierbarkeit:** Die Rechte der betroffenen Personen (Auskunft, Berichtigung, L\u00f6schung etc.) m\u00fcssen wirksam ausge\u00fcbt werden k\u00f6nnen.\\n9. **Rechenschaftspflicht (Accountability-Prinzip):** Die Organisation muss die Einhaltung aller Grunds\u00e4tze nachweisen k\u00f6nnen (Art. 5 Abs. 2 DSGVO).\\n\\n# 4. Ziele der Informationssicherheit\\n\\nBei der Planung, Einf\u00fchrung und dem laufenden Betrieb von Prozessen ber\u00fccksichtigt das Unternehmen neben den datenschutzrechtlichen Grunds\u00e4tzen folgende Schutzziele der Informationssicherheit:\\n\\n- **Vertraulichkeit** \u2013 Schutz vor unbefugtem Zugriff auf Informationen.\\n- **Integrit\u00e4t** \u2013 Sicherstellung der Vollst\u00e4ndigkeit und Unverf\u00e4lschtheit von Daten.\\n- **Verf\u00fcgbarkeit** \u2013 Gew\u00e4hrleistung der Zug\u00e4nglichkeit von Informationen und Systemen f\u00fcr Berechtigte.\\n- **Belastbarkeit** \u2013 F\u00e4higkeit, St\u00f6rungen und Angriffe zu widerstehen und sich schnell zu erholen.\\n\\nDie Umsetzung dieser Ziele erfolgt durch technische und organisatorische Ma\u00dfnahmen (TOM) in einem wirtschaftlich vertretbaren Verh\u00e4ltnis zum jeweiligen Schutzbedarf.\\n\\n# 5. Organisation von Datenschutz und Informationssicherheit\\n\\nZur Erreichung der Ziele dieser Leitlinie wird ein integriertes **Datenschutz- und Informationssicherheits-Managementsystem** betrieben. Es umfasst:\\n\\n- **Verzeichnis der Verarbeitungst\u00e4tigkeiten (VVT):** Alle datenverarbeitenden Prozesse werden l\u00fcckenlos im VVT (Art. 30 DSGVO) erfasst und regelm\u00e4\u00dfig aktualisiert.\\n- **Risikoanalyse & DSFA:** Verarbeitungen mit voraussichtlich hohem Risiko f\u00fcr die Rechte und Freiheiten nat\u00fcrlicher Personen unterliegen einer formellen Datenschutz-Folgenabsch\u00e4tzung (Art. 35 DSGVO).\\n- **L\u00f6schkonzept:** F\u00fcr alle Datenarten und Systeme gelten verbindliche Aufbewahrungs- und L\u00f6schfristen.\\n- **Mitarbeiterschulung:** Alle Besch\u00e4ftigten werden regelm\u00e4\u00dfig f\u00fcr Datenschutz- und Informationssicherheitsthemen sensibilisiert und zur Einhaltung des Datengeheimnisses verpflichtet.\\n- **Kontinuierlicher Verbesserungsprozess (PDCA):** Ein regelm\u00e4\u00dfiger Verbesserungskreislauf gew\u00e4hrleistet die fortlaufende Optimierung aller Datenschutz- und Sicherheitsma\u00dfnahmen.\\n\\nEs wird ein **Datenschutz- und Informationssicherheitsteam (DST)** gebildet, das die Planung, Umsetzung und Evaluierung von Datenschutz und Informationssicherheit begleitet und direkt an die Gesch\u00e4ftsf\u00fchrung berichtet.\\n\\n# 6. Rollen und Verantwortlichkeiten\\n\\n| Rolle | Aufgaben |\\n|---|---|\\n| **Gesch\u00e4ftsf\u00fchrung** | Gesamtverantwortung; Bereitstellung notwendiger Ressourcen; Erlass verbindlicher Richtlinien |\\n| **Datenschutzbeauftragter (DSB)** | Unabh\u00e4ngige Beratung und \u00dcberwachung; Ansprechpartner f\u00fcr Betroffene und Aufsichtsbeh\u00f6rden; Durchf\u00fchrung von DSFA |\\n| **Informationssicherheitsbeauftragter (ISB)** | Initiierung, Planung und Steuerung des Informationssicherheitsprozesses; Ansprechpartner f\u00fcr IT-Sicherheit; halbj\u00e4hrliche Berichterstattung an GF |\\n| **Datenschutzmanager (DSM)** | Operative Koordination des DSMS; Pflege des VVT; Umsetzung von Verbesserungsma\u00dfnahmen |\\n| **IT-Verantwortlicher / IT-Dienstleister** | Technische Umsetzung von Richtlinien und TOM; Abstimmung mit ISB und DSM |\\n| **F\u00fchrungskr\u00e4fte / Abteilungsleiter** | Umsetzung der Leitlinie in ihrem Verantwortungsbereich; Genehmigung von Datenantr\u00e4gen |\\n| **Projekt-/Prozessverantwortliche** | Konsultation von DSM und ISB bei allen Projekten mit Datenschutz-/Sicherheitsrelevanz; Meldung von Verarbeitungst\u00e4tigkeiten |\\n| **Besch\u00e4ftigte** | Einhaltung aller Datenschutz- und Sicherheitsregeln; unverz\u00fcgliche Meldung von Vorf\u00e4llen an DSB oder ISB |\\n| **Auftragsverarbeiter / Lieferanten** | Einhaltung der vereinbarten Datenschutz- und Sicherheitsvorgaben gem\u00e4\u00df AVV |\\n\\n# 7. Ma\u00dfnahmen\\n\\nMa\u00dfnahmen zur Umsetzung dieser Leitlinie k\u00f6nnen in Form von technischen und organisatorischen Ma\u00dfnahmen erfolgen. Dazu geh\u00f6ren Richtlinien, betriebliche Regelungen und Arbeitsanweisungen, die von allen Besch\u00e4ftigten einzuhalten sind. Die konkrete Ausgestaltung erfolgt durch gesonderte Richtlinien (3-richtlinien) und Prozessbeschreibungen (2-prozesse).\\n\\n# 8. Meldepflichten bei Vorf\u00e4llen\\n\\n- **Datenschutzvorf\u00e4lle** sind von allen Besch\u00e4ftigten unverz\u00fcglich nach Kenntnisnahme an den **DSB** zu melden.\\n- **Informationssicherheitsvorf\u00e4lle** sind unverz\u00fcglich an den **ISB** zu melden.\\n- Im Zweifel erfolgt die Meldung an den DSB, der die Weiterleitung an den ISB \u00fcbernimmt.\\n- Bei schwerwiegenden Datenschutzverletzungen gilt die 72-Stunden-Meldefrist gegen\u00fcber der Aufsichtsbeh\u00f6rde (Art. 33 DSGVO).\\n\\n# 9. Sanktionen bei Verst\u00f6\u00dfen\\n\\nVerst\u00f6\u00dfe gegen datenschutzrechtliche Vorgaben oder interne Richtlinien gef\u00e4hrden das Vertrauen unserer Kunden und Partner und k\u00f6nnen erhebliche Bu\u00dfgelder (Art. 83 DSGVO) oder Reputationssch\u00e4den nach sich ziehen. Ein Versto\u00df gegen diese Leitlinie kann eine arbeitsvertragliche Pflichtverletzung darstellen und entsprechend sanktioniert werden. F\u00fcr Lieferanten und externe Auftragnehmer werden bei besonderen Risiken Vertragsstrafen vereinbart.\\n\\n# 10. Inkrafttreten und Review\\n\\nDiese Leitlinie tritt mit Beschluss der Gesch\u00e4ftsf\u00fchrung in Kraft. Sie wird mindestens einmal j\u00e4hrlich sowie anlassbezogen (z. B. bei Gesetzes\u00e4nderungen, wesentlichen Prozessumstellungen oder nach Sicherheitsvorf\u00e4llen) durch den DSB, den ISB und das Management \u00fcberpr\u00fcft und bei Bedarf fortgeschrieben. Der Eigent\u00fcmer des Dokuments ist die Gesch\u00e4ftsf\u00fchrung.\\n\\n---\\n**Genehmigt am:** {{snippet: document_frontmatter name=date}}  \\n**Durch:** **{{snippet: global_role_verantwortlicher}}**\"},{\"titel\":\"2.1 Prozessbeschreibung: Bearbeitung von Betroffenenrechten\",\"kategorie\":\"prozessbeschreibung\",\"dokumentTyp\":\"betroffenenrechte\",\"beschreibung\":\"Standardarbeitsanweisung (SOP) zur gesetzeskonformen Bearbeitung von Betroffenenanfragen gem\u00e4\u00df Art. 12\u201322 DSGVO. Beschreibt den vollst\u00e4ndigen 7-Schritte-Ablauf von Eingang bis Archivierung.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Pr\u00fcfung\\n- [ ] Freigegeben\\n\\nVerantwortlich:  \\n**Datenschutzmanager / Kundenservice**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\nReview-Zyklus (in Monaten):  \\n**{{snippet: document_frontmatter name=review_cycle_months}}**\\n\\n# Versionsstand & \u00c4nderungsverzeichnis\\n\\nVersionshistorie und \u00c4nderungsnachverfolgung dieses Dokuments erfolgt durch das Versionskontrollsystem der Organisation. Die jeweils g\u00fcltige Fassung ist durch das Deckblatt und das im Seitenkopf angegebene Dokumentdatum gekennzeichnet.\\n\\n{{snippet: git_document_history format=table limit=15}}\\n\\n---\\n\\n# 1. Zweck und Geltungsbereich\\n\\nDieser Prozess regelt den vollst\u00e4ndigen Ablauf der Entgegennahme, Identifikation, Pr\u00fcfung und Beantwortung von Anfragen nat\u00fcrlicher Personen (Betroffene), die ihre gesetzlichen Rechte gem\u00e4\u00df der DSGVO geltend machen.\\n\\nDer Prozess gilt f\u00fcr alle Abteilungen der **{{snippet: global_organisation}}**, insbesondere f\u00fcr den Kundenservice, die Personalabteilung, die IT-Administration und alle Bereiche, die personenbezogene Daten verarbeiten.\\n\\n**Verantwortliche Stelle:**  \\n{{snippet: global_organisation}}  \\n{{snippet: global_address}}  \\nE-Mail: `datenschutz@{{snippet: global_domain}}`\\n\\n# 2. \u00dcbersicht der Betroffenenrechte (Art. 12\u201322 DSGVO)\\n\\n| Recht | Rechtsgrundlage | Frist |\\n|---|---|---|\\n| Auskunftsrecht | Art. 15 DSGVO | 1 Monat (verl\u00e4ngerbar auf 3 Monate) |\\n| Recht auf Berichtigung | Art. 16 DSGVO | Unverz\u00fcglich |\\n| Recht auf L\u00f6schung / \u201eVergessenwerden\\\" | Art. 17 DSGVO | Unverz\u00fcglich |\\n| Recht auf Einschr\u00e4nkung der Verarbeitung | Art. 18 DSGVO | Unverz\u00fcglich |\\n| Recht auf Daten\u00fcbertragbarkeit | Art. 20 DSGVO | 1 Monat |\\n| Widerspruchsrecht | Art. 21 DSGVO | Unverz\u00fcglich |\\n| Widerruf der Einwilligung | Art. 7 Abs. 3 DSGVO | Unverz\u00fcglich f\u00fcr die Zukunft |\\n\\n# 3. Prozessablauf (Schritt f\u00fcr Schritt)\\n\\n```mermaid\\ngraph TD\\n    A[Eingang der Anfrage] --> B[Identit\u00e4tspr\u00fcfung & Erfassung im DSM-System]\\n    B --> C{Identit\u00e4t gekl\u00e4rt?}\\n    C -- Nein --> D[Nachforderung ID-Nachweis]\\n    D --> C\\n    C -- Ja --> E[Anlage lfd. Nummer & Fristberechnung]\\n    E --> F[Weiterleitung Pr\u00fcfb\u00f6gen an Fachabteilungen & ggf. Auftragsverarbeiter]\\n    F --> G[Datenbeschaffung & Konsolidierung]\\n    G --> H[Rechtliche W\u00fcrdigung & Schw\u00e4rzung durch DSB]\\n    H --> I[Erstellung Antwortentwurf]\\n    I --> J[Freigabe durch DSB / Management]\\n    J --> K[Sichere Auslieferung an Betroffenen]\\n    K --> L[Dokumentation & Archivierung unter lfd. Nummer]\\n```\\n\\n## Schritt 1: Eingang und Kennzeichnung\\n\\n- Anfragen k\u00f6nnen \u00fcber jeden Kommunikationskanal (E-Mail, Brief, Web-Formular, Telefon) eingehen.\\n- Jede Anfrage ist **unverz\u00fcglich** an den Datenschutzmanager bzw. das Datenschutz-Team weiterzuleiten.\\n- Das **Eingangsdatum** wird taggenau dokumentiert \u2013 es startet die gesetzliche Frist.\\n- Es wird eine **laufende Nummer** im Datenschutzmanagementsystem vergeben.\\n\\n## Schritt 2: Identit\u00e4tspr\u00fcfung und Registrierung\\n\\n- Um unbefugte Offenlegung gegen\u00fcber Dritten zu verhindern, ist die Identit\u00e4t des Anfragenden zweifelsfrei zu pr\u00fcfen (z. B. Abgleich von Kundennummer, E-Mail-Adresse oder Anforderung eines Ausweisdokuments mit geschw\u00e4rzten nicht ben\u00f6tigten Feldern).\\n- Der Antrag wird im DSM-System unter der lfd. Nummer mit Eingangsdatum und Art des Antrags (Art. 15\u201322 DSGVO) registriert.\\n- Das Formblatt **4.1.1 Checkliste Antrag Betroffenenrechte** wird angelegt.\\n\\n## Schritt 3: Fristberechnung\\n\\n- Antr\u00e4ge m\u00fcssen **unverz\u00fcglich, sp\u00e4testens innerhalb eines Monats** nach Eingang beantwortet werden (Art. 12 Abs. 3 DSGVO).\\n- Bei komplexen F\u00e4llen kann die Frist um maximal **zwei weitere Monate** verl\u00e4ngert werden. Die betroffene Person muss dar\u00fcber unter Angabe der Gr\u00fcnde **innerhalb des ersten Monats** informiert werden.\\n- Die maximale Frist wird im DSM-System hinterlegt und \u00fcberwacht.\\n\\n## Schritt 4: Pr\u00fcfung der Datenbest\u00e4nde\\n\\n- Die Pr\u00fcfb\u00f6gen (**D-PRO-009-003/004 Formblatt Pr\u00fcfung Daten Betroffener**) werden mit den relevanten Daten an die **Fachverantwortlichen** f\u00fcr alle Speicherorte sowie ggf. an Auftragsverarbeiter und gemeinsam Verantwortliche (bei Anwendbarkeit von Art. 26 DSGVO) weitergeleitet.\\n- Die Fachabteilungen und die IT-Administration exportieren die Daten aus allen relevanten Systemen (CRM, ERP, Mailserver, Backups).\\n- Ausgef\u00fcllte Pr\u00fcfb\u00f6gen werden an den Datenschutzmanager zur\u00fcckgegeben.\\n\\n## Schritt 5: Rechtliche W\u00fcrdigung durch den DSB\\n\\n- Der **Datenschutzbeauftragte** pr\u00fcft, ob gesetzliche Ausnahmen (z. B. Gesch\u00e4ftsgeheimnisse, Rechte Dritter, steuerliche Aufbewahrungspflichten) der Auskunft, L\u00f6schung oder \u00dcbertragung entgegenstehen.\\n- Daten Dritter oder vertrauliche Unternehmensdaten sind im Auskunfts-PDF **unkenntlich zu machen (Schw\u00e4rzung)**.\\n- Bei **gemeinsamer Verantwortlichkeit** (z. B. Social-Media-Fanpages) wird das Verfahren gem\u00e4\u00df der Vereinbarung nach Art. 26 DSGVO durchgef\u00fchrt.\\n\\n## Schritt 6: Erstellung und Freigabe der Antwort\\n\\n- Die finale Antwort (unter Verwendung der entsprechenden Antwort-Templates **2.1.3 bis 007**) wird durch den Datenschutzbeauftragten (DSB) rechtlich gepr\u00fcft und freigegeben.\\n- Die \u00dcbermittlung an den Betroffenen erfolgt auf einem **sicheren Weg** (z. B. verschl\u00fcsseltes ZIP per E-Mail mit separatem Kennwortweg oder per Einschreiben).\\n\\n## Schritt 7: Protokollierung und Dokumentation\\n\\n- Der Vorgang wird im DSM-System geschlossen.\\n- Die gesamte Kommunikation, die Identit\u00e4tsnachweise und die Freigaben werden **revisionssicher archiviert** unter der lfd. Nummer.\\n- **Aufbewahrungsfrist:** 3 Jahre nach Abschluss (Abwehr von Rechtsanspr\u00fcchen nach OWiG), anschlie\u00dfend L\u00f6schung bzw. vollst\u00e4ndige Anonymisierung des Registereintrags.\\n\\n# 4. Eskalationsmanagement\\n\\nKann eine Anfrage nicht fristgerecht beantwortet werden, droht ein beh\u00f6rdliches Beschwerdeverfahren. In solchen F\u00e4llen ist **unverz\u00fcglich die Gesch\u00e4ftsf\u00fchrung** zu informieren, um zus\u00e4tzliche personelle oder technische Ressourcen freizugeben.\\n\\nBei Beschwerden oder Nachfragen der Aufsichtsbeh\u00f6rde sind alle relevanten Unterlagen unter der lfd. Nummer und dem Namen des Antragstellers jederzeit auffindbar und nachvollziehbar bereit zu halten.\\n\\n# 5. Rollen & Verantwortlichkeiten\\n\\n| Rolle | Aufgaben im Prozess |\\n|---|---|\\n| **Datenschutzbeauftragter (DSB)** | Koordination, rechtliche Pr\u00fcfung, Freigabe der Antwort |\\n| **Datenschutzmanager (DSM)** | Pflege des DSM-Systems, Frist\u00fcberwachung, Unterst\u00fctzung bei Umsetzung |\\n| **Fachabteilungen** | Technische Umsetzung (Datenexport, L\u00f6schung, Berichtigung) |\\n| **IT-Administration** | Bereitstellung von Export-/L\u00f6sch-Tools, Datenbeschaffung aus IT-Systemen |\\n| **Gesch\u00e4ftsf\u00fchrung** | Freigabe bei Eskalation; Entscheidung bei Ausnahmen |\\n\\n# 6. Referenzdokumente und Anlagen\\n\\n- **4.1.1** \u2013 Checkliste Antrag Betroffenenrechte\\n- **4.1.2** \u2013 Formblatt Pr\u00fcfung Daten Betroffener\\n- **4.1.3** \u2013 Formblatt Pr\u00fcfung Daten Betroffener (Erg\u00e4nzungsblatt)\\n- **2.1.2** \u2013 Antwort Betroffenenantrag (allgemein)\\n- **2.1.3** \u2013 Antwort Auskunft (Art. 15 DSGVO)\\n- **4.1.4** \u2013 Antwort Berichtigung (Art. 16 DSGVO)\\n- **2.1.4** \u2013 Antwort Einschr\u00e4nkung der DV (Art. 18 DSGVO)\\n- **2.1.5** \u2013 Antwort L\u00f6schung (Art. 17 DSGVO)\\n- **2.1.6** \u2013 Antwort Daten\u00fcbertragbarkeit (Art. 20 DSGVO)\\n- **2.1.7** \u2013 Antwort Widerspruch (Art. 21 DSGVO)\\n- **2.1.8** \u2013 Antwort Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)\"},{\"titel\":\"2.2 Prozessbeschreibung: Umgang mit Datenpannen\",\"kategorie\":\"prozessbeschreibung\",\"dokumentTyp\":\"datenpannen\",\"beschreibung\":\"Prozessbeschreibung zur Erkennung, Bewertung, Meldung und Dokumentation von Datenschutzverletzungen gem\u00e4\u00df Art. 33\u201334 DSGVO (72-Stunden-Frist).\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Pr\u00fcfung\\n- [ ] Freigegeben\\n\\nVerantwortlich:  \\n**Datenschutzmanager / IT-Sicherheit**\\n\\nFristen\u00fcberwachung:  \\n**{{snippet: global_role_dsb}}**\\n\\n# 1. Einleitung und gesetzliche Pflicht\\nEine Verletzung des Schutzes personenbezogener Daten (Datenpanne) liegt vor, wenn es zu einem Sicherheitsvorfall kommt, der zum unbeabsichtigten oder unrechtm\u00e4\u00dfigen Verlust, zur Ver\u00e4nderung, zur unbefugten Offenlegung oder zum unbefugten Zugriff auf personenbezogene Daten f\u00fchrt (Art. 4 Nr. 12 DSGVO).\\n\\nIm Falle einer Datenpanne ist die **{{snippet: global_organisation}}** gesetzlich verpflichtet:\\n1. Den Vorfall **innerhalb von 72 Stunden** an die zust\u00e4ndige Datenschutz-Aufsichtsbeh\u00f6rde zu melden, es sei denn, der Vorfall f\u00fchrt voraussichtlich nicht zu einem Risiko f\u00fcr die Rechte und Freiheiten nat\u00fcrlicher Personen (Art. 33 DSGVO).\\n2. Die betroffenen Personen unverz\u00fcglich zu informieren, wenn die Verletzung voraussichtlich ein **hohes Risiko** f\u00fcr deren pers\u00f6nliche Rechte und Freiheiten zur Folge hat (Art. 34 DSGVO).\\n3. Jeden Vorfall \u2013 unabh\u00e4ngig von der Meldepflicht \u2013 intern l\u00fcckenlos zu dokumentieren (Art. 33 Abs. 5 DSGVO).\\n\\n# 2. Der Ablauf im Ernstfall (72-Stunden-Szenario)\\n\\n```mermaid\\ngraph TD\\n    A[Vorfall erkannt / gemeldet] --> B[Sofortma\u00dfnahmen & Schadensbegrenzung]\\n    B --> C[Vorfall erfassen & DSB informieren]\\n    C --> D[Risikoanalyse durch DSB & IT-Sec]\\n    D --> E{Risiko f\u00fcr Betroffene?}\\n    E -- Kein Risiko --> F[Nur interne Dokumentation]\\n    E -- Mittleres Risiko --> G[Meldung an Aufsichtsbeh\u00f6rde < 72h]\\n    E -- Hohes Risiko --> H[Meldung an Beh\u00f6rde < 72h & Info an Betroffene]\\n```\\n\\n## Phase 1: Erkennung und Schadensminimierung (Stunde 0 - 4)\\n- **Erkennung:** Ein Vorfall kann durch IT-Monitoring, Mitarbeiterberichte, Kundenhinweise oder externe Dienstleister gemeldet werden.\\n- **Sofortma\u00dfnahmen:** Die IT-Administration ergreift unverz\u00fcglich Ma\u00dfnahmen zur Eind\u00e4mmung des Schadens (z. B. Trennung betroffener Server vom Netzwerk, Sperrung kompromittierter Benutzerkonten, Schlie\u00dfen von Sicherheitsl\u00fccken).\\n\\n## Phase 2: Meldung an das Datenschutz-Team (Stunde 4 - 12)\\n- Jeder Vorfall muss sofort \u00fcber das interne Vorfall-Formular oder per E-Mail an `sicherheitsvorfall@privashield-demo.local` gemeldet werden.\\n- Der Vorfall wird im PrivaShield Datenpannen-Modul registriert. Dadurch wird die automatische Fristen\u00fcberwachung (72h-Countdown ab Kenntnisnahme) gestartet.\\n\\n## Phase 3: Sachverhaltsermittlung und Risikoanalyse (Stunde 12 - 36)\\nDer Datenschutzbeauftragte f\u00fchrt gemeinsam mit der IT-Sicherheit eine strukturierte Risikobewertung durch:\\n- Welche Datenkategorien sind betroffen (sensible Finanzdaten, Gesundheitsdaten, Passw\u00f6rter)?\\n- Wie viele Personen sind betroffen?\\n- Welche konkreten Gefahren drohen den Betroffenen (Identit\u00e4tsdiebstahl, finanzieller Verlust, Diskriminierung, Reputationsschaden)?\\n- Risikoklassifizierung (kein Risiko, geringes Risiko, mittleres Risiko, hohes Risiko).\\n\\n## Phase 4: Entscheidung und Beh\u00f6rdenmeldung (Stunde 36 - 48)\\n- Die Gesch\u00e4ftsf\u00fchrung entscheidet auf Empfehlung des DSB \u00fcber die Meldepflicht.\\n- **Meldung an die Beh\u00f6rde:** Bei mittlerem, hohem oder kritischem Risiko erfolgt die Meldung elektronisch an die zust\u00e4ndige Aufsichtsbeh\u00f6rde (z. B. LDI NRW).\\n- **Inhalt der Meldung:** Art des Vorfalls, betroffene Personengruppen, Kontaktdaten des DSB, wahrscheinliche Folgen und ergriffene Gegenma\u00dfnahmen.\\n\\n## Phase 5: Benachrichtigung der Betroffenen (Stunde 48 - 72)\\n- Liegt ein **hohes Risiko** vor, entwirft das PR- und Datenschutz-Team ein Informationsschreiben an die betroffenen Personen.\\n- Die Benachrichtigung muss in klarer und einfacher Sprache erfolgen und konkrete Handlungsempfehlungen (z. B. Passwort\u00e4nderungen, Sperrung von Bankkarten) enthalten.\\n\\n## Phase 6: Nachbereitung und Dokumentation (Nach Abschluss)\\n- Der Vorfall wird vollst\u00e4ndig im PrivaShield-Modul dokumentiert (inklusive aller getroffenen Eind\u00e4mmungsma\u00dfnahmen, Beh\u00f6rdenmeldungen und Risikoabw\u00e4gungen).\\n- Im Rahmen des PDCA-Zyklus werden die Ursachen analysiert und technische oder organisatorische Verbesserungen vereinbart, um eine Wiederholung zu verhindern.\\n\\n# 3. Wichtige Notfallkontakte\\n- **Datenschutzbeauftragter:** **{{snippet: global_role_dsb}}**\\n- **IT-Notfall-Hotline:** +49 (0) 231 999-888-7\\n- **Gesch\u00e4ftsf\u00fchrung:** **{{snippet: global_role_verantwortlicher}}**\"},{\"titel\":\"3.1 Richtlinie: Besch\u00e4ftigtendatenschutz\",\"kategorie\":\"richtlinie\",\"dokumentTyp\":\"beschaeftigtendatenschutz\",\"beschreibung\":\"Verbindliche Richtlinie zur datenschutzkonformen Verarbeitung von Besch\u00e4ftigtendaten gem\u00e4\u00df \u00a7 26 BDSG und DSGVO.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Pr\u00fcfung\\n- [ ] Freigegeben\\n\\nG\u00fcltig f\u00fcr:  \\n**Personalabteilung, F\u00fchrungskr\u00e4fte und Betriebsrat**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\n# 1. Zielsetzung und Geltungsbereich\\nDiese Richtlinie konkretisiert die Vorgaben des Artikels 88 DSGVO und des \u00a7 26 Bundesdatenschutzgesetz (BDSG) f\u00fcr die **{{snippet: global_organisation}}**. \\n\\nSie dient dem Schutz der Pers\u00f6nlichkeitsrechte aller Besch\u00e4ftigten, Bewerber, Auszubildenden und ehemaligen Mitarbeiter und legt verbindliche Verhaltensregeln f\u00fcr den Umgang mit Besch\u00e4ftigtendaten fest.\\n\\n# 2. Rechtsgrundlagen der Verarbeitung\\nDie Verarbeitung von Besch\u00e4ftigtendaten ist nur zul\u00e4ssig, wenn eine der folgenden Bedingungen erf\u00fcllt ist:\\n\\n1. **Begr\u00fcndung, Durchf\u00fchrung und Beendigung des Arbeitsverh\u00e4ltnisses (\u00a7 26 Abs. 1 BDSG):** Die Erhebung und Nutzung von Daten (wie Name, Steuerdaten, Gehaltsdaten) ist zul\u00e4ssig, wenn sie f\u00fcr die Entscheidung \u00fcber die Begr\u00fcndung eines Besch\u00e4ftigungsverh\u00e4ltnisses oder nach dessen Begr\u00fcndung f\u00fcr dessen Durchf\u00fchrung oder Beendigung erforderlich ist.\\n2. **Kollektivvereinbarungen (\u00a7 26 Abs. 4 BDSG):** Verarbeitung auf Grundlage von Betriebsvereinbarungen oder Tarifvertr\u00e4gen.\\n3. **Einwilligung (\u00a7 26 Abs. 2 BDSG):** Freiwillige, schriftliche oder elektronische Einwilligung (z. B. f\u00fcr die Ver\u00f6ffentlichung von Mitarbeiterfotos auf der Webseite).\\n4. **Erf\u00fcllung rechtlicher Pflichten (Art. 6 Abs. 1 lit. c DSGVO):** Abf\u00fchrung von Lohnsteuer und Sozialabgaben an Finanz\u00e4mter und Krankenkassen.\\n\\n# 3. Regelungen f\u00fcr den Bewerbungsprozess\\n- **Erhebung:** Es d\u00fcrfen nur Daten abgefragt werden, die f\u00fcr die Beurteilung der Eignung f\u00fcr die konkrete Stelle erforderlich sind. Unzul\u00e4ssige Fragen (z. B. nach Schwangerschaft, Religion, Gewerkschaftszugeh\u00f6rigkeit) sind untersagt.\\n- **Aufbewahrungsfrist:** Bewerbungsunterlagen abgelehnter Bewerber m\u00fcssen sp\u00e4testens **6 Monate** nach Zugang des Ablehnungsschreibens gel\u00f6scht/vernichtet werden (Abwehrfrist nach dem Allgemeinen Gleichbehandlungsgesetz - AGG).\\n- **Bewerberpool:** Eine l\u00e4ngere Speicherung (z. B. zur Ber\u00fccksichtigung bei k\u00fcnftigen Stellen) ist nur mit ausdr\u00fccklicher, schriftlicher Einwilligung des Bewerbers zul\u00e4ssig.\\n\\n# 4. Regelungen w\u00e4hrend des Besch\u00e4ftigungsverh\u00e4ltnisses\\n\\n## 4.1 Die Personalakte\\n- Personalakten sind unter strengem Verschluss (physisch verschlie\u00dfbar, digital verschl\u00fcsselt und zugriffsbegrenzt) aufzubewahren.\\n- Zugriff auf Personalakten haben ausschlie\u00dflich berechtigte Mitarbeiter der Personalabteilung.\\n\\n## 4.2 Nutzung von IT-Systemen, Internet und E-Mail\\n- **Dienstliche Nutzung:** Alle bereitgestellten Kommunikationsmittel (E-Mail, Teams, Internet) sind grunds\u00e4tzlich f\u00fcr dienstliche Zwecke bestimmt.\\n- **Private Nutzung:** *(Entweder Verbot oder Freigabe mit klaren Regeln, z. B. im Rahmen einer Betriebsvereinbarung).* \\n  > [!NOTE]\\n  > Bei Freigabe der privaten Internet-/E-Mail-Nutzung gelten f\u00fcr den Arbeitgeber im Hinblick auf den Zugriff auf E-Mails des Mitarbeiters besonders strenge gesetzliche Grenzen des Fernmeldegeheimnisses (TDDDG).\\n- **Leistungs- und Verhaltenskontrolle:** Eine systematische, dauerhafte \u00dcberwachung der Leistung oder des Verhaltens der Mitarbeiter (z. B. durch Keylogger, permanente Video\u00fcberwachung oder heimliche Auswertung von Logfiles) ist unzul\u00e4ssig.\\n\\n## 4.3 Besondere Kategorien von Daten (Art. 9 DSGVO)\\n- Die Erhebung von Gesundheitsdaten (z. B. Krankmeldungen, Betriebliches Eingliederungsmanagement - BEM) unterliegt besonders strengen Sicherheitsvorkehrungen und darf nur durch daf\u00fcr autorisiertes Personal verarbeitet werden.\\n\\n# 5. Regelungen nach Beendigung des Arbeitsverh\u00e4ltnisses\\n- Nach dem Ausscheiden eines Mitarbeiters sind die Personalaktendaten schrittweise zu sperren und zu l\u00f6schen.\\n- F\u00fcr steuerlich und sozialversicherungsrechtlich relevante Unterlagen gelten die gesetzlichen Aufbewahrungsfristen (in der Regel 6 bis 10 Jahre nach Ablauf des Kalenderjahres des Ausscheidens). Nach Ablauf dieser Fristen sind die Daten unwiderruflich zu l\u00f6schen.\\n\\n# 6. Mitbestimmungsrechte des Betriebsrates\\nBei der Einf\u00fchrung und Nutzung von technischen Systemen, die geeignet sind, das Verhalten oder die Leistung der Besch\u00e4ftigten zu \u00fcberwachen, sind die Mitbestimmungsrechte des Betriebsrates (gem\u00e4\u00df BetrVG) zwingend zu wahren. Entsprechende Betriebsvereinbarungen sind abzuschlie\u00dfen.\"},{\"titel\":\"3.2 Richtlinie: Web und Telemedien\",\"kategorie\":\"richtlinie\",\"dokumentTyp\":\"web_telemedien\",\"beschreibung\":\"Richtlinie zur Einhaltung datenschutz- und telemedienrechtlicher Anforderungen beim Betrieb von Websites und digitalen Diensten.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Pr\u00fcfung\\n- [ ] Freigegeben\\n\\nG\u00fcltig f\u00fcr:  \\n**Marketing, IT-Webentwicklung und Webseitenbetreuer**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\n# 1. Einleitung und gesetzlicher Hintergrund\\nDer Betrieb von Telemedien (wie Webseiten, Kundenportalen und Online-Shops) unterliegt strengen gesetzlichen Regelungen:\\n- **\u00a7 25 TDDDG** regelt die Einwilligungspflicht f\u00fcr das Speichern von Informationen im Endger\u00e4t des Nutzers (z. B. Cookies) oder den Zugriff auf bereits gespeicherte Informationen.\\n- Die **DSGVO** regelt die anschlie\u00dfende Verarbeitung personenbezogener Daten (z. B. IP-Adressen, Nutzer-IDs).\\n- Das **DDG (Digitale-Dienste-Gesetz)** regelt die gesetzlichen Impressumspflichten.\\n\\nDiese Richtlinie stellt sicher, dass alle Webauftritte der **{{snippet: global_organisation}}** gesetzeskonform betrieben werden.\\n\\n# 2. Die Cookie- & Tracking-Regeln (\u00a7 25 TDDDG)\\n\\n## 2.1 Der Grundsatz der Einwilligungspflicht\\nJeder Zugriff auf das Endger\u00e4t des Nutzers (Speichern von Cookies, LocalStorage-Nutzung, Browser-Fingerprinting) bedarf der **vorherigen, informierten und freiwilligen Einwilligung** des Nutzers.\\n\\n## 2.2 Die gesetzliche Ausnahme\\nEine Einwilligung ist ausnahmsweise **nicht** erforderlich, wenn:\\n1. Der alleinige Zweck der Speicherung/des Zugriffs die Durchf\u00fchrung der \u00dcbertragung einer Nachricht \u00fcber ein \u00f6ffentliches Telekommunikationsnetz ist, oder\\n2. Die Speicherung/der Zugriff **unbedingt erforderlich** ist, damit der Anbieter einen vom Nutzer ausdr\u00fccklich gew\u00fcnschten Dienst zur Verf\u00fcgung stellen kann (z. B. Cookie zur Speicherung des Warenkorbs, Logindaten-Session-Cookie oder Speicherung des Consent-Status selbst).\\n\\n## 2.3 Das Consent-Management-Tool (CMP)\\n- Webseiten, die einwilligungspflichtige Dienste (z. B. Google Analytics, Facebook-Pixel, YouTube-Embeds, Google Maps) nutzen, m\u00fcssen ein wirksames Consent-Management-Tool (Cookie-Banner) vorschalten.\\n- **Opt-in-Zwang:** Einwilligungspflichtige Skripte d\u00fcrfen erst geladen werden, nachdem der Nutzer aktiv auf \\\"Akzeptieren\\\" geklickt hat.\\n- **Gleichwertigkeit der Buttons:** Der Button zur Ablehnung der Cookies (\\\"Ablehnen\\\" / \\\"Nur notwendige Cookies\\\") muss auf der ersten Ebene des Banners genauso leicht erreichbar, farblich und gestalterisch gleichwertig dargestellt sein wie der Button zur Annahme (\\\"Alle akzeptieren\\\"). Das Ausnutzen von *Dark Patterns* (z. B. versteckte oder graue Ablehnungs-Buttons) ist verboten.\\n- **Widerrufsm\u00f6glichkeit:** Der Nutzer muss seine Einwilligung jederzeit ebenso einfach widerrufen k\u00f6nnen, wie er sie erteilt hat (z. B. \u00fcber ein kleines schwebendes Icon auf der Webseite).\\n\\n# 3. Impressums- und Datenschutzerkl\u00e4rungspflichten\\n\\n## 3.1 Das Impressum (Anbieterkennzeichnung gem\u00e4\u00df DDG)\\n- Jede gesch\u00e4ftsm\u00e4\u00dfige Webseite muss ein leicht erkennbares, unmittelbar erreichbares und st\u00e4ndig verf\u00fcgbares Impressum enthalten.\\n- Das Impressum darf maximal **zwei Klicks** von jeder Unterseite entfernt sein und muss als \\\"Impressum\\\" betitelt sein.\\n- **Pflichtinhalte:** Vollst\u00e4ndiger Firmenname, Rechtsform, Vertretungsberechtigte Personen, Anschrift, E-Mail-Adresse und Telefonnummer, Registergericht und Registernummer, Umsatzsteuer-Identifikationsnummer (USt-IdNr.).\\n\\n## 3.2 Die Datenschutzerkl\u00e4rung (Art. 13 DSGVO)\\n- Jede Webseite muss eine aktuelle Datenschutzerkl\u00e4rung enthalten, die transparent \u00fcber die Verarbeitung personenbezogener Daten auf der Webseite informiert.\\n- **Inhalte:** Verantwortliche Stelle, Kontaktdaten des DSB, erhobene Daten (z. B. Server-Logfiles, Kontaktformulardaten), Zwecke und Rechtsgrundlagen der Verarbeitung, Speicherdauer, Drittlandtransfers und Rechte der betroffenen Personen.\\n\\n# 4. Webseiten-Audits und Qualit\u00e4tssicherung\\n- Der Webseitenbetreuer und die IT-Webentwicklung f\u00fchren in Abstimmung mit dem Datenschutzbeauftragten vor jedem Release neuer Webseiten-Funktionen einen **Web-Datenschutz-Check** durch.\\n- Mindestens viertelj\u00e4hrlich erfolgt ein Audit aller aktiven Skripte und Cookies auf den Live-Webseiten unter Zuhilfenahme des PrivaShield Web-Compliance-Moduls.\\n- Nicht mehr ben\u00f6tigte Skripte oder Cookies sind unverz\u00fcglich aus dem Quellcode der Webseiten zu entfernen.\"},{\"titel\":\"3.3 Richtlinie: Technische und organisatorische Ma\u00dfnahmen (TOM)\",\"kategorie\":\"richtlinie\",\"dokumentTyp\":\"tom\",\"beschreibung\":\"Sicherheitsrichtlinie zur Festlegung und \u00dcberwachung technischer und organisatorischer Ma\u00dfnahmen (TOM) gem\u00e4\u00df Art. 32 DSGVO.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Pr\u00fcfung\\n- [ ] Freigegeben\\n\\nG\u00fcltig f\u00fcr:  \\n**IT-Administration, Informationssicherheitsbeauftragter (ISB) und alle Besch\u00e4ftigten**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\n# 1. Zielsetzung und gesetzliche Verpflichtung\\nDie **{{snippet: global_organisation}}** ist gesetzlich verpflichtet, unter Ber\u00fccksichtigung des Stands der Technik, der Implementierungskosten und der Art, des Umfangs, der Umst\u00e4nde und der Zwecke der Verarbeitung sowie der unterschiedlichen Eintrittswahrscheinlichkeit und Schwere des Risikos f\u00fcr die Rechte und Freiheiten nat\u00fcrlicher Personen geeignete technische und organisatorische Ma\u00dfnahmen (TOM) zu treffen, um ein dem Risiko angemessenes Schutzniveau zu gew\u00e4hrleisten (Art. 32 DSGVO).\\n\\nDiese Richtlinie definiert die Mindestsicherheitsanforderungen f\u00fcr den Betrieb unserer IT-Infrastruktur und den Umgang mit personenbezogenen Daten.\\n\\n# 2. Die Schutzkategorien der TOM (Klassischer Standard)\\n\\n## 2.1 Zutrittskontrolle (R\u00e4umliche Sicherheit)\\nMa\u00dfnahmen, die unbefugten Personen den physischen Zutritt zu Datenverarbeitungsanlagen (Serverr\u00e4ume, B\u00fcros, Archive) verwehren:\\n- Abschlie\u00dfen von B\u00fcror\u00e4umen beim Verlassen.\\n- Elektronisches Schlie\u00dfsystem mit chipkartenbasierter Protokollierung.\\n- Serverr\u00e4ume sind alarmgesichert und klimatisiert; Zutritt nur f\u00fcr autorisiertes IT-Personal.\\n- Begleitung und Protokollierung von externen Besuchern und Handwerkern.\\n\\n## 2.2 Zugangskontrolle (System-Sicherheit)\\nMa\u00dfnahmen, die verhindern, dass unbefugte Personen Datenverarbeitungssysteme nutzen k\u00f6nnen:\\n- **Passwortrichtlinie:** Passw\u00f6rter m\u00fcssen mindestens 12 Zeichen lang sein und Gro\u00df-/Kleinschreibung, Zahlen und Sonderzeichen enthalten (erzwungen durch System-GPOs).\\n- **Zwei-Faktor-Authentifizierung (2FA):** Zwingend erforderlich f\u00fcr VPN-Verbindungen, E-Mail-Zugriff und Cloud-Dienste (M365, AWS).\\n- **Bildschirmsperre:** Automatische Aktivierung der Bildschirmsperre nach maximal 10 Minuten Inaktivit\u00e4t.\\n- **Virenschutz & Firewall:** Einsatz von zentral verwalteten Endpoint-Protection-Systemen und Next-Generation-Firewalls.\\n\\n## 2.3 Zugriffskontrolle (Daten-Sicherheit)\\nMa\u00dfnahmen, die gew\u00e4hrleisten, dass zur Benutzung eines Datenverarbeitungssystems Berechtigte ausschlie\u00dflich auf die ihrer Zugriffsberechtigung unterliegenden Daten zugreifen k\u00f6nnen:\\n- **Need-to-Know-Prinzip:** Berechtigungen werden restriktiv und nur auf begr\u00fcndeten Antrag hin vergeben (Rollen- und Berechtigungskonzept).\\n- **Admin-Konten:** Administrative T\u00e4tigkeiten d\u00fcrfen nur mit separaten Admin-Konten durchgef\u00fchrt werden, nicht im normalen Tagesbetrieb.\\n- **Regelm\u00e4\u00dfiges Review:** Viertelj\u00e4hrliche \u00dcberpr\u00fcfung aller aktiven Konten und Berechtigungsgruppen.\\n\\n## 2.4 Weitergabekontrolle (\u00dcbertragungs-Sicherheit)\\nMa\u00dfnahmen, die gew\u00e4hrleisten, dass personenbezogene Daten bei der elektronischen \u00dcbertragung oder w\u00e4hrend ihres Transports oder ihrer Speicherung auf Datentr\u00e4ger nicht unbefugt gelesen, kopiert, ver\u00e4ndert oder entfernt werden k\u00f6nnen:\\n- **Verschl\u00fcsselung:** Zwingender Einsatz von Transportverschl\u00fcsselung (SSL/TLS, HTTPS) bei der Daten\u00fcbertragung.\\n- **E-Mail-Verschl\u00fcsselung:** Vertrauliche E-Mails an Externe m\u00fcssen verschl\u00fcsselt gesendet werden (PGP, S/MIME oder kennwortgesch\u00fctzte ZIP-Dateien auf getrenntem \u00dcbertragungskanal).\\n- **Festplattenverschl\u00fcsselung:** Zwingende Verschl\u00fcsselung (BitLocker / FileVault) f\u00fcr alle mobilen Endger\u00e4te (Laptops, Smartphones).\\n\\n## 2.5 Eingabekontrolle (Nachvollziehbarkeit)\\nMa\u00dfnahmen, die gew\u00e4hrleisten, dass nachtr\u00e4glich \u00fcberpr\u00fcft und festgestellt werden kann, ob und von wem personenbezogene Daten in Datenverarbeitungssysteme eingegeben, ver\u00e4ndert oder entfernt worden sind:\\n- Aktivierung von Audit-Logs in allen produktiven Systemen und Datenbanken.\\n- Protokolle werden manipulationssicher gespeichert und nach den gesetzlichen Vorgaben rotiert und gel\u00f6scht.\\n\\n## 2.6 Verf\u00fcgbarkeitskontrolle (Zuverl\u00e4ssigkeit)\\nMa\u00dfnahmen, die gew\u00e4hrleisten, dass personenbezogene Daten gegen zuf\u00e4llige Zerst\u00f6rung oder Verlust gesch\u00fctzt sind:\\n- **Backup-Konzept:** T\u00e4gliche, inkrementelle und w\u00f6chentliche Vollsicherungen. Die Backups werden verschl\u00fcsselt und an einem getrennten Ort (Offsite / Cloud) gelagert.\\n- **Notstromversorgung (USV):** Absicherung kritischer Serverinfrastruktur gegen Stromausf\u00e4lle.\\n- **Wiederherstellungstests:** Mindestens halbj\u00e4hrliche Tests der Datenwiederherstellung (Restore-Tests) zur Verifikation der Backup-Integrit\u00e4t.\\n\\n## 2.7 Trennungsgebot (Zwecktrennung)\\nMa\u00dfnahmen, die gew\u00e4hrleisten, dass zu unterschiedlichen Zwecken erhobene Daten getrennt verarbeitet werden k\u00f6nnen:\\n- Trennung von Entwicklungs-, Test- und Produktivumgebungen. Keine Verwendung von echten Produktionsdaten in Testsystemen.\\n- Logische Trennung von Mandantendaten in unseren Datenbanken (Multitenancy-Absicherung).\\n\\n# 3. \u00dcberwachung und Wirksamkeitspr\u00fcfung\\n- Der Informationssicherheitsbeauftragte (ISB) f\u00fchrt in enger Abstimmung mit dem Datenschutzbeauftragten (DSB) regelm\u00e4\u00dfige Audits der technischen und organisatorischen Ma\u00dfnahmen durch.\\n- Die Ergebnisse werden im PrivaShield TOM-Modul und im internen Auditprotokoll dokumentiert und dienen als Grundlage f\u00fcr den PDCA-Verbesserungsprozess.\"},{\"titel\":\"4.1 Auditkonzept Datenschutz\",\"kategorie\":\"verfahrensdokumentation\",\"dokumentTyp\":\"audit\",\"beschreibung\":\"Konzept und Pr\u00fcfleitfaden f\u00fcr die Durchf\u00fchrung systematischer interner Datenschutz-Audits. Legt Ziele, Methodik, H\u00e4ufigkeit und Berichtswege fest.\",\"version\":\"1.0\",\"status\":\"entwurf\",\"inhalt\":\"# Dokumentenstatus\\n\\n- [ ] Entwurf\\n- [x] In Pr\u00fcfung\\n- [ ] Freigegeben\\n\\nG\u00fcltig f\u00fcr:  \\n**Datenschutzbeauftragter (DSB), Datenschutzmanager und Abteilungsleiter**\\n\\nFreigabe durch:  \\n**{{snippet: global_role_verantwortlicher}}**\\n\\n# 1. Zielsetzung und gesetzliche Pflicht\\nDie Wirksamkeit der getroffenen Schutzma\u00dfnahmen (TOM) muss regelm\u00e4\u00dfig \u00fcberpr\u00fcft, bewertet und evaluiert werden (Art. 32 Abs. 1 lit. d DSGVO). Zudem fordert die Rechenschaftspflicht (Art. 5 Abs. 2 DSGVO) den Nachweis, dass die Datenschutzgrunds\u00e4tze im Alltag eingehalten werden.\\n\\nDieses Auditkonzept der **{{snippet: global_organisation}}** stellt sicher, dass:\\n- Schwachstellen, Prozessfehler oder Compliance-L\u00fccken im Umgang mit personenbezogenen Daten fr\u00fchzeitig erkannt werden.\\n- Abteilungen und Verantwortliche systematisch \u00fcberpr\u00fcft und beraten werden.\\n- Korrekturma\u00dfnahmen eingeleitet, nachverfolgt und dokumentiert werden (PDCA-Verbesserungszyklus).\\n\\n# 2. Audit-Typen und Intervalle\\n\\n- **System-Audits (J\u00e4hrlich):** Ganzheitliche \u00dcberpr\u00fcfung des gesamten Datenschutz-Management-Systems (DSMS), inklusive Aktualit\u00e4t des VVT, Schulungsst\u00e4nde, L\u00f6schkonzepte und Vertr\u00e4ge.\\n- **Bereichs-Audits (Halbj\u00e4hrlich rollierend):** Gezielte Pr\u00fcfung einzelner Fachbereiche mit hohem Risiko (z. B. HR/Personal, Marketing/Webseiten, Kundenservice, IT-Administration).\\n- **Anlassbezogene Audits (Unverz\u00fcglich):** Bei schweren Datenpannen, Sicherheitsvorf\u00e4llen, Beschwerden von Betroffenen, beh\u00f6rdlichen Kontrollen oder wesentlichen Prozessumstellungen.\\n\\n# 3. Der Auditprozess (Ablauf)\\n\\n```mermaid\\ngraph TD\\n    A[Audit-Planung & Ank\u00fcndigung] --> B[Dokumentenpr\u00fcfung & VVT-Abgleich]\\n    B --> C[Audit-Interviews & Stichproben]\\n    C --> D[Abweichungsanalyse & Risikobewertung]\\n    D --> E[Erstellung des Auditberichts]\\n    E --> F[PDCA-Korrekturma\u00dfnahmen vereinbaren]\\n    F --> G[Nachverfolgung im PrivaShield]\\n```\\n\\n## Schritt 1: Planung und Vorbereitung\\n- Der Auditor (in der Regel der DSB oder ein externer Pr\u00fcfer) stimmt den Termin und den Pr\u00fcfungsbereich mit den Fachabteilungsleitern ab.\\n- Ein Pr\u00fcfplan wird erstellt, der die konkreten Fragen und Stichproben festlegt (z. B. \\\"Pr\u00fcfung der L\u00f6schfristen im Bewerber-Tool\\\").\\n\\n## Schritt 2: Dokumentenpr\u00fcfung\\n- Der Auditor pr\u00fcft vorab die bestehenden Leitlinien, Richtlinien, AV-Vertr\u00e4ge des Bereichs sowie die entsprechenden VVT-Eintr\u00e4ge im PrivaShield.\\n\\n## Schritt 3: Durchf\u00fchrung (Interviews & Stichproben)\\n- Durchf\u00fchrung von Interviews mit den Prozessverantwortlichen.\\n- Stichprobenhafte Pr\u00fcfung der realen Gegebenheiten vor Ort bzw. in den Systemen (z. B. \\\"Zeigen Sie mir bitte die Berechtigungsgruppe f\u00fcr das Personal-Laufwerk\\\" oder \\\"Wie werden physische Akten geschreddert?\\\").\\n\\n## Schritt 4: Berichtserstellung und Bewertung\\n- Der Auditor dokumentiert positive Aspekte sowie Abweichungen (L\u00fccken) und Empfehlungen.\\n- Die Abweichungen werden nach Schweregrad eingestuft:\\n  - **Geringf\u00fcgige Abweichung:** Kein direkter Versto\u00df, aber Verbesserungspotenzial (Empfehlung).\\n  - **Wesentliche Abweichung:** Prozessl\u00fccke oder mangelnde Dokumentation (Korrekturma\u00dfnahme erforderlich).\\n  - **Kritische Abweichung:** Direkter Versto\u00df gegen gesetzliche Vorgaben (z. B. fehlender AVV, unverschl\u00fcsselte \u00dcbertragung sensibler Daten) -> Sofortma\u00dfnahme zwingend!\\n\\n## Schritt 5: PDCA-Zyklus und Nachverfolgung\\n- F\u00fcr jede wesentliche oder kritische Abweichung wird eine konkrete Ma\u00dfnahme mit Zust\u00e4ndigkeit und Erledigungsfrist vereinbart.\\n- Das Audit wird im PrivaShield Audits-Modul erfasst und die abgeleiteten Ma\u00dfnahmen werden im PDCA- und Aufgabenmodul zur Nachverfolgung eingetragen.\\n\\n# 4. Nachweisbarkeit (Rechenschaft)\\nDie Auditberichte, Protokolle der Stichproben und die Nachweise der behobenen M\u00e4ngel werden revisionssicher im PrivaShield archiviert. Sie dienen der Gesch\u00e4ftsf\u00fchrung als Nachweis gegen\u00fcber Aufsichtsbeh\u00f6rden bei Kontrollen.\"}]}",
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

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
  loeschkonzept: Loeschkonzept[];
  aufgaben: Aufgabe[];
  dokumente: Dokument[];
  interneNotizen: InterneNotiz[];
}

const defaultData: DbSchema = {
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
      loeschkonzept: f("loeschkonzept"),
      aufgaben: f("aufgaben"),
      offeneAufgaben: (db.data.aufgaben as Aufgabe[]).filter((x) => x.mandantId === mandantId && x.status === "offen").length,
      dokumente: f("dokumente"),
    };
  }
}


// interne notizen
export interface __LowdbStorageInterneNotizenMarker {}

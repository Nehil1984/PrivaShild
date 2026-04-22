// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";

function normalizeDsfaRisks(raw: unknown) {
  const input = typeof raw === "string"
    ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      })()
    : raw;

  if (!Array.isArray(input)) {
    throw new Error("DSFA-Risiken müssen als JSON-Liste übergeben werden.");
  }

  return input.map((risk, index) => {
    if (!risk || typeof risk !== "object" || Array.isArray(risk)) {
      throw new Error(`DSFA-Risiko ${index + 1} ist ungültig.`);
    }

    const normalized = {
      titel: String((risk as any).titel || "").trim(),
      beschreibung: String((risk as any).beschreibung || "").trim(),
      betroffeneRechte: String((risk as any).betroffeneRechte || "").trim(),
      betroffeneGruppen: String((risk as any).betroffeneGruppen || "").trim(),
      datenarten: String((risk as any).datenarten || "").trim(),
      ursache: String((risk as any).ursache || "").trim(),
      bestehendeKontrollen: String((risk as any).bestehendeKontrollen || "").trim(),
      eintrittswahrscheinlichkeit: String((risk as any).eintrittswahrscheinlichkeit || "").trim(),
      schweregrad: String((risk as any).schweregrad || "").trim(),
      inhärentesRisiko: String((risk as any).inhärentesRisiko || "").trim(),
      restrisiko: String((risk as any).restrisiko || "").trim(),
      weitereMassnahmen: String((risk as any).weitereMassnahmen || "").trim(),
      verantwortlicher: String((risk as any).verantwortlicher || "").trim(),
      status: String((risk as any).status || "offen").trim() || "offen",
    };

    if (!normalized.titel) {
      throw new Error(`DSFA-Risiko ${index + 1} benötigt einen Titel.`);
    }

    return normalized;
  });
}

describe("dsfa route validation", () => {
  it("normalizes valid dsfa risk payloads", () => {
    const result = normalizeDsfaRisks(JSON.stringify([
      {
        titel: "Zu breite Sichtbarkeit",
        restrisiko: "mittel",
      },
    ]));

    expect(result).toEqual([
      {
        titel: "Zu breite Sichtbarkeit",
        beschreibung: "",
        betroffeneRechte: "",
        betroffeneGruppen: "",
        datenarten: "",
        ursache: "",
        bestehendeKontrollen: "",
        eintrittswahrscheinlichkeit: "",
        schweregrad: "",
        inhärentesRisiko: "",
        restrisiko: "mittel",
        weitereMassnahmen: "",
        verantwortlicher: "",
        status: "offen",
      },
    ]);
  });

  it("rejects non-array dsfa risks", () => {
    expect(() => normalizeDsfaRisks("{}"))
      .toThrowError("DSFA-Risiken müssen als JSON-Liste übergeben werden.");
  });

  it("rejects risk entries without title", () => {
    expect(() => normalizeDsfaRisks([{ restrisiko: "hoch" }]))
      .toThrowError("DSFA-Risiko 1 benötigt einen Titel.");
  });
});

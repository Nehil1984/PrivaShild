// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";

function normalizeDsfaRisiken(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((risk) => ({
    titel: String((risk as any)?.titel || ""),
    beschreibung: String((risk as any)?.beschreibung || ""),
    betroffeneRechte: String((risk as any)?.betroffeneRechte || ""),
    betroffeneGruppen: String((risk as any)?.betroffeneGruppen || ""),
    datenarten: String((risk as any)?.datenarten || ""),
    ursache: String((risk as any)?.ursache || ""),
    bestehendeKontrollen: String((risk as any)?.bestehendeKontrollen || ""),
    eintrittswahrscheinlichkeit: String((risk as any)?.eintrittswahrscheinlichkeit || ""),
    schweregrad: String((risk as any)?.schweregrad || ""),
    inhärentesRisiko: String((risk as any)?.inhärentesRisiko || ""),
    restrisiko: String((risk as any)?.restrisiko || ""),
    weitereMassnahmen: String((risk as any)?.weitereMassnahmen || ""),
    verantwortlicher: String((risk as any)?.verantwortlicher || ""),
    status: String((risk as any)?.status || "offen"),
  }));
}

function pickAllowedUserUpdateFields(body: Record<string, unknown>) {
  const allowed: Record<string, unknown> = {};
  for (const key of ["name", "email", "password", "role", "mandantIds", "aktiv"]) {
    if (key in body) allowed[key] = body[key];
  }
  return allowed;
}

function applyUnlock(body: Record<string, unknown>) {
  const sanitized = pickAllowedUserUpdateFields(body);
  if (body.unlockUser === true) {
    Object.assign(sanitized, {
      adminLocked: false,
      adminLockedAt: null,
      failedLoginAttempts: 0,
      temporaryLockUntil: null,
      lastFailedLoginAt: null,
    });
  }
  return sanitized;
}

describe("dsfa risk normalization", () => {
  it("normalizes structured dsfa risk entries defensively", () => {
    const normalized = normalizeDsfaRisiken([
      {
        titel: "Unbefugter Zugriff",
        beschreibung: "Mitarbeiter sehen mehr Daten als erforderlich",
        betroffeneRechte: "Vertraulichkeit",
        betroffeneGruppen: "Beschäftigte",
        datenarten: "HR-Daten",
        ursache: "Zu breite Rollen",
        bestehendeKontrollen: "Rollenmodell",
        eintrittswahrscheinlichkeit: "mittel",
        schweregrad: "hoch",
        inhärentesRisiko: "hoch",
        restrisiko: "mittel",
        weitereMassnahmen: "Rezertifizierung der Rollen",
        verantwortlicher: "IT",
      },
      {
        titel: 123,
        status: "in_umsetzung",
      },
    ]);

    expect(normalized).toEqual([
      {
        titel: "Unbefugter Zugriff",
        beschreibung: "Mitarbeiter sehen mehr Daten als erforderlich",
        betroffeneRechte: "Vertraulichkeit",
        betroffeneGruppen: "Beschäftigte",
        datenarten: "HR-Daten",
        ursache: "Zu breite Rollen",
        bestehendeKontrollen: "Rollenmodell",
        eintrittswahrscheinlichkeit: "mittel",
        schweregrad: "hoch",
        inhärentesRisiko: "hoch",
        restrisiko: "mittel",
        weitereMassnahmen: "Rezertifizierung der Rollen",
        verantwortlicher: "IT",
        status: "offen",
      },
      {
        titel: "123",
        beschreibung: "",
        betroffeneRechte: "",
        betroffeneGruppen: "",
        datenarten: "",
        ursache: "",
        bestehendeKontrollen: "",
        eintrittswahrscheinlichkeit: "",
        schweregrad: "",
        inhärentesRisiko: "",
        restrisiko: "",
        weitereMassnahmen: "",
        verantwortlicher: "",
        status: "in_umsetzung",
      },
    ]);
  });

  it("falls back to an empty list for invalid dsfa risks", () => {
    expect(normalizeDsfaRisiken(null)).toEqual([]);
    expect(normalizeDsfaRisiken({ titel: "x" })).toEqual([]);
  });
});

describe("user security update guards", () => {
  it("keeps only explicitly allowed user update fields", () => {
    const payload = pickAllowedUserUpdateFields({
      name: "Max Mustermann",
      email: "max@example.com",
      role: "user",
      mandantIds: "[1]",
      aktiv: true,
      adminLocked: true,
      failedLoginAttempts: 99,
      temporaryLockUntil: "2099-01-01T00:00:00.000Z",
    });

    expect(payload).toEqual({
      name: "Max Mustermann",
      email: "max@example.com",
      role: "user",
      mandantIds: "[1]",
      aktiv: true,
    });
  });

  it("does not allow direct security-field escalation without unlock flag", () => {
    const payload = applyUnlock({
      adminLocked: false,
      failedLoginAttempts: 0,
      temporaryLockUntil: null,
      lastFailedLoginAt: null,
    });

    expect(payload).toEqual({});
  });

  it("resets lock-related fields only through explicit unlock flow", () => {
    const payload = applyUnlock({ unlockUser: true, name: "Freigabe" });

    expect(payload).toEqual({
      name: "Freigabe",
      adminLocked: false,
      adminLockedAt: null,
      failedLoginAttempts: 0,
      temporaryLockUntil: null,
      lastFailedLoginAt: null,
    });
  });
});

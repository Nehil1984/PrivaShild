// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";

// The risk level reduction function matching the client implementation exactly
function reduceLevel(level: string, steps: number): string {
  const levels = ["niedrig", "mittel", "hoch"];
  const index = levels.indexOf(level.toLowerCase());
  if (index === -1) return "niedrig";
  return levels[Math.max(0, index - steps)];
}

// Emulated DSFA Risk prefill calculator
function calculateRiskPrefill(selectedVvt: any, toms: any[]) {
  let linkedTomIds: any[] = [];
  try {
    linkedTomIds = JSON.parse(selectedVvt.verknuepfteTomIds || "[]");
    if (!Array.isArray(linkedTomIds)) linkedTomIds = [];
  } catch (e) {
    linkedTomIds = [];
  }

  const matchedToms = toms.filter((tom: any) =>
    linkedTomIds.map(String).includes(String(tom.id))
  );
  const tomCount = matchedToms.length;
  const matchedNames = matchedToms.map((t: any) => `${t.massnahme} (${t.kategorie || "BSI"})`).join(", ");

  const bruttoLevel = (selectedVvt.risikostufe || "niedrig").toLowerCase() === "hoch" ? "hoch" :
                      (selectedVvt.risikostufe || "niedrig").toLowerCase() === "mittel" ? "mittel" : "niedrig";

  let steps = 0;
  if (tomCount === 1 || tomCount === 2) {
    steps = 1;
  } else if (tomCount >= 3) {
    steps = 2;
  }

  const netLevel = reduceLevel(bruttoLevel, steps);
  const netProbability = reduceLevel(bruttoLevel, steps);
  const netSeverity = reduceLevel(bruttoLevel, steps);

  const autoControls = matchedNames
    ? `Verknüpfte TOMs aus VVT: ${matchedNames}`
    : selectedVvt.tomHinweis || "Keine verknüpften TOMs in VVT hinterlegt.";

  const autoReasoning = `Das Risiko wurde durch die Implementierung von ${tomCount} verknüpften technischen und organisatorischen Maßnahmen (TOMs) von Brutto (${bruttoLevel.toUpperCase()}) auf Netto (${netLevel.toUpperCase()}) minimiert.${matchedNames ? ` Wirksame Maßnahmen: ${matchedNames}.` : ""}`;

  return {
    bruttoLevel,
    netLevel,
    netProbability,
    netSeverity,
    autoControls,
    autoReasoning,
    tomCount
  };
}

describe("DSFA Risk Prefill Calculator", () => {
  const dummyToms = [
    { id: 1, massnahme: "Verschlüsselung der Datenplatten", kategorie: "CON.1" },
    { id: 2, massnahme: "Zweifaktorauthentifizierung", kategorie: "APP.1" },
    { id: 3, massnahme: "Zutrittskontrolle zum Serverraum", kategorie: "INF.1" },
    { id: 4, massnahme: "Vier-Augen-Prinzip", kategorie: "ORG.1" },
  ];

  it("reduces risk level by 0 steps when no TOMs are linked", () => {
    const selectedVvt = {
      risikostufe: "hoch",
      verknuepfteTomIds: "[]",
      tomHinweis: "Bestehende TOM prüfen."
    };

    const res = calculateRiskPrefill(selectedVvt, dummyToms);
    expect(res.bruttoLevel).toBe("hoch");
    expect(res.netLevel).toBe("hoch");
    expect(res.netProbability).toBe("hoch");
    expect(res.netSeverity).toBe("hoch");
    expect(res.tomCount).toBe(0);
    expect(res.autoControls).toBe("Bestehende TOM prüfen.");
    expect(res.autoReasoning).toContain("von Brutto (HOCH) auf Netto (HOCH) minimiert");
  });

  it("reduces risk level by 1 step when 1 or 2 TOMs are linked", () => {
    const selectedVvt = {
      risikostufe: "hoch",
      verknuepfteTomIds: "[1, 2]",
    };

    const res = calculateRiskPrefill(selectedVvt, dummyToms);
    expect(res.bruttoLevel).toBe("hoch");
    expect(res.netLevel).toBe("mittel");
    expect(res.netProbability).toBe("mittel");
    expect(res.netSeverity).toBe("mittel");
    expect(res.tomCount).toBe(2);
    expect(res.autoControls).toContain("Verschlüsselung der Datenplatten");
    expect(res.autoControls).toContain("Zweifaktorauthentifizierung");
    expect(res.autoReasoning).toContain("von Brutto (HOCH) auf Netto (MITTEL) minimiert");
  });

  it("reduces risk level by 2 steps (down to niedrig) when 3 or more TOMs are linked", () => {
    const selectedVvt = {
      risikostufe: "hoch",
      verknuepfteTomIds: "[1, 2, 3]",
    };

    const res = calculateRiskPrefill(selectedVvt, dummyToms);
    expect(res.bruttoLevel).toBe("hoch");
    expect(res.netLevel).toBe("niedrig");
    expect(res.netProbability).toBe("niedrig");
    expect(res.netSeverity).toBe("niedrig");
    expect(res.tomCount).toBe(3);
    expect(res.autoReasoning).toContain("von Brutto (HOCH) auf Netto (NIEDRIG) minimiert");
  });

  it("limits risk level reduction steps to niedrig", () => {
    const selectedVvt = {
      risikostufe: "mittel",
      verknuepfteTomIds: "[1, 2, 3, 4]",
    };

    const res = calculateRiskPrefill(selectedVvt, dummyToms);
    expect(res.bruttoLevel).toBe("mittel");
    expect(res.netLevel).toBe("niedrig");
    expect(res.tomCount).toBe(4);
    expect(res.autoReasoning).toContain("von Brutto (MITTEL) auf Netto (NIEDRIG) minimiert");
  });
});

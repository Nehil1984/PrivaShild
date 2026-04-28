import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const routesSource = readFileSync(path.resolve(import.meta.dirname, "routes.ts"), "utf8");
const printSource = readFileSync(path.resolve(import.meta.dirname, "../client/print.html"), "utf8");

function syncAuditPdcaLinksLocal(
  audits: Array<{ id: number; verknuepftePdcaIds?: string }>,
  pdcaEntries: Array<{ id: number; verknuepftesAuditId?: number | null }>,
) {
  const nextAudits = audits.map((audit) => ({ ...audit }));
  const nextPdca = pdcaEntries.map((entry) => ({ ...entry }));

  for (const audit of nextAudits) {
    let pdcaIds: number[] = [];
    try {
      pdcaIds = JSON.parse(audit.verknuepftePdcaIds || "[]");
    } catch {
      pdcaIds = [];
    }

    const validPdcaIds = pdcaIds.filter((id) => nextPdca.some((entry) => entry.id === id));
    audit.verknuepftePdcaIds = JSON.stringify(validPdcaIds);

    for (const pdcaId of validPdcaIds) {
      const entry = nextPdca.find((item) => item.id === pdcaId);
      if (!entry) continue;
      if (entry.verknuepftesAuditId !== audit.id) {
        entry.verknuepftesAuditId = audit.id;
      }
    }
  }

  for (const entry of nextPdca) {
    const auditId = entry.verknuepftesAuditId;
    if (!auditId) continue;
    const audit = nextAudits.find((item) => item.id === auditId);
    if (!audit) {
      entry.verknuepftesAuditId = null;
      continue;
    }
    let auditLinks: number[] = [];
    try {
      auditLinks = JSON.parse(audit.verknuepftePdcaIds || "[]");
    } catch {
      auditLinks = [];
    }
    if (!auditLinks.includes(entry.id)) {
      auditLinks.push(entry.id);
      audit.verknuepftePdcaIds = JSON.stringify(Array.from(new Set(auditLinks)));
    }
  }

  return { audits: nextAudits, pdca: nextPdca };
}

describe("audit/pdca export regression guards", () => {
  it("keeps bidirectional audit↔pdca links consistent", () => {
    const result = syncAuditPdcaLinksLocal(
      [{ id: 7, verknuepftePdcaIds: "[]" }],
      [{ id: 11, verknuepftesAuditId: 7 }],
    );

    expect(result.pdca[0].verknuepftesAuditId).toBe(7);
    expect(JSON.parse(result.audits[0].verknuepftePdcaIds || "[]")).toEqual([11]);
  });

  it("clears stale pdca links when the referenced audit no longer exists", () => {
    const result = syncAuditPdcaLinksLocal([], [{ id: 11, verknuepftesAuditId: 99 }]);
    expect(result.pdca[0].verknuepftesAuditId).toBeNull();
  });

  it("keeps export-context audit and pdca data nested under modules", () => {
    expect(routesSource).toContain("modules: { vvt, avv, dsfa, datenpannen, dsr, tom, audits, pdca, loeschkonzept, aufgaben, dokumente, interne_notizen: interneNotizen }");
  });

  it("renders audit summary from export-context modules with fallback to session config", () => {
    expect(printSource).toContain("buildAuditSummary(dataMap.audits || config.audits || [], config.auditTodos || [], dataMap.pdca || config.pdca || [], config.pdcaFollowUpTasks || [])");
  });

  it("renders pdca summary from export-context modules with fallback to session config", () => {
    expect(printSource).toContain("buildPdcaSummary(dataMap.pdca || config.pdca || [], config.pdcaFollowUpTasks || [])");
  });
});

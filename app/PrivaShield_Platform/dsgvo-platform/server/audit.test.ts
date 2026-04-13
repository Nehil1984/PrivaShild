import { describe, expect, it } from "vitest";

function buildAuditEntry(input: {
  mandantId?: number | null;
  userId?: number | null;
  userName?: string;
  aktion: string;
  modul: string;
  entitaetTyp?: string;
  entitaetId?: number | null;
  beschreibung: string;
  details?: Record<string, unknown>;
}) {
  if (!input.mandantId) return null;
  return {
    mandantId: input.mandantId,
    userId: input.userId ?? null,
    userName: input.userName,
    aktion: input.aktion,
    modul: input.modul,
    entitaetTyp: input.entitaetTyp,
    entitaetId: input.entitaetId ?? null,
    beschreibung: input.beschreibung,
    detailsJson: JSON.stringify(input.details || {}),
  };
}

describe("audit logging helper behavior", () => {
  it("creates structured audit entries for mandant-bound events", () => {
    const entry = buildAuditEntry({
      mandantId: 7,
      userId: 3,
      userName: "Admin",
      aktion: "dokument_erstellt",
      modul: "dokumente",
      entitaetTyp: "dokument",
      entitaetId: 11,
      beschreibung: "Dokument wurde erstellt",
      details: { titel: "Leitlinie" },
    });

    expect(entry).not.toBeNull();
    expect(entry?.mandantId).toBe(7);
    expect(entry?.detailsJson).toContain("Leitlinie");
  });

  it("skips entries without mandant binding", () => {
    const entry = buildAuditEntry({
      mandantId: null,
      aktion: "login_erfolgreich",
      modul: "auth",
      beschreibung: "Login erfolgreich",
    });

    expect(entry).toBeNull();
  });
});

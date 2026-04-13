import { describe, expect, it } from "vitest";

function diffObjects(before: Record<string, any> | undefined, after: Record<string, any> | undefined) {
  const previous = before || {};
  const next = after || {};
  const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(next)])).sort();
  const changes: Array<{ field: string; before: unknown; after: unknown }> = [];

  for (const key of keys) {
    const a = previous[key];
    const b = next[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({ field: key, before: a, after: b });
    }
  }

  return changes;
}

describe("diffObjects", () => {
  it("detects changed and added fields", () => {
    const changes = diffObjects(
      { status: "offen", titel: "Alt" },
      { status: "erledigt", titel: "Alt", notiz: "Neu" },
    );

    expect(changes).toEqual([
      { field: "notiz", before: undefined, after: "Neu" },
      { field: "status", before: "offen", after: "erledigt" },
    ]);
  });

  it("returns empty list for identical objects", () => {
    expect(diffObjects({ a: 1 }, { a: 1 })).toEqual([]);
  });
});

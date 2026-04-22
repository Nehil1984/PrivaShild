// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";

function parseMandantIds(raw?: string) {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function filterMandantenForUser(userRole: string, mandantIds: string | undefined, allMandanten: Array<{ id: number; name: string }>) {
  if (userRole === "admin") return allMandanten;
  const allowed = parseMandantIds(mandantIds);
  return allMandanten.filter((m) => allowed.includes(m.id));
}

function canAccessEntity(userRole: string, mandantIds: string | undefined, entity: { mandantId: number } | undefined) {
  if (!entity) return false;
  if (userRole === "admin") return true;
  return parseMandantIds(mandantIds).includes(entity.mandantId);
}

describe("integration-like access flows", () => {
  it("maps login result to visible mandants", () => {
    const all = [
      { id: 1, name: "Mandant A" },
      { id: 2, name: "Mandant B" },
      { id: 3, name: "Mandant C" },
    ];

    const adminVisible = filterMandantenForUser("admin", "[]", all);
    const userVisible = filterMandantenForUser("user", "[2,3]", all);

    expect(adminVisible).toHaveLength(3);
    expect(userVisible.map((m) => m.id)).toEqual([2, 3]);
  });

  it("allows CRUD-style entity access only inside assigned mandants", () => {
    const entity = { mandantId: 5 };
    expect(canAccessEntity("admin", "[]", entity)).toBe(true);
    expect(canAccessEntity("user", "[5]", entity)).toBe(true);
    expect(canAccessEntity("user", "[4]", entity)).toBe(false);
  });

  it("denies access when entity does not exist", () => {
    expect(canAccessEntity("admin", "[]", undefined)).toBe(false);
    expect(canAccessEntity("user", "[1]", undefined)).toBe(false);
  });

  it("does not leak mandants outside user assignments", () => {
    const all = [
      { id: 11, name: "Mandant X" },
      { id: 12, name: "Mandant Y" },
    ];
    const visible = filterMandantenForUser("user", "[12]", all);
    expect(visible).toEqual([{ id: 12, name: "Mandant Y" }]);
  });
});

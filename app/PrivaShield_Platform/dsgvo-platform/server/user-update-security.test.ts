// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";
import { insertUserSchema } from "../shared/schema";
import { z } from "zod";

const updateUserSchema = insertUserSchema.partial().extend({
  unlockUser: z.boolean().optional(),
});

function diffObjects(before: Record<string, any> | undefined, after: Record<string, any> | undefined) {
  const previous = before || {};
  const next = after || {};
  const keys = Array.from(new Set([...Object.keys(previous), ...Object.keys(next)])).sort();
  const diff: Record<string, { before: any; after: any }> = {};

  for (const key of keys) {
    if (JSON.stringify(previous[key]) !== JSON.stringify(next[key])) {
      diff[key] = {
        before: previous[key],
        after: next[key],
      };
    }
  }
  return diff;
}

describe("user update Zod schema validation", () => {
  it("allows valid partial updates", () => {
    const parsed = updateUserSchema.parse({
      name: "Neuer Name",
      aktiv: false,
    });
    expect(parsed.name).toBe("Neuer Name");
    expect(parsed.aktiv).toBe(false);
    expect(parsed.password).toBeUndefined();
  });

  it("enforces strong password rules on update if password is provided", () => {
    // Ungültiges Passwort (zu kurz)
    expect(() => updateUserSchema.parse({
      password: "123",
    })).toThrow();

    // Ungültiges Passwort (keine Sonderzeichen)
    expect(() => updateUserSchema.parse({
      password: "SehrSicher1234",
    })).toThrow();

    // Gültiges Passwort
    const parsed = updateUserSchema.parse({
      password: "SehrSicher123!",
    });
    expect(parsed.password).toBe("SehrSicher123!");
  });

  it("preserves the unlockUser flag on parse", () => {
    const parsed = updateUserSchema.parse({
      unlockUser: true,
    });
    expect(parsed.unlockUser).toBe(true);
  });
});

describe("audit log diff calculations", () => {
  it("calculates exact changes between user objects", () => {
    const before = { id: 1, name: "Daniel", email: "daniel@test.de", role: "admin" };
    const after = { id: 1, name: "Daniel Schuh", email: "daniel@test.de", role: "admin" };

    const diff = diffObjects(before, after);
    expect(diff).toEqual({
      name: {
        before: "Daniel",
        after: "Daniel Schuh",
      },
    });
  });

  it("handles empty or identical inputs gracefully", () => {
    const obj = { id: 1, name: "Daniel" };
    expect(diffObjects(obj, obj)).toEqual({});
    expect(diffObjects(undefined, undefined)).toEqual({});
  });
});

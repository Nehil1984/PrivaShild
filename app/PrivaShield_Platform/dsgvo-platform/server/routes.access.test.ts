// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";

function canAccessMandant(userRole: string, allowedIds: number[], mandantId: number) {
  if (userRole === "admin") return true;
  return allowedIds.includes(mandantId);
}

import { insertUserSchema } from "@shared/schema";

describe("access control policy", () => {
  it("allows admins to access any mandant", () => {
    expect(canAccessMandant("admin", [], 999)).toBe(true);
  });

  it("allows users only for assigned mandants", () => {
    expect(canAccessMandant("user", [2, 3], 2)).toBe(true);
    expect(canAccessMandant("user", [2, 3], 4)).toBe(false);
  });

  it("denies users without assignments", () => {
    expect(canAccessMandant("user", [], 1)).toBe(false);
  });

  it("enforces strong passwords in user schema", () => {
    expect(() => insertUserSchema.parse({
      email: "weak@example.local",
      password: "short",
      name: "Weak User",
      role: "user",
      mandantIds: "[]",
      aktiv: true,
    })).toThrow();

    expect(() => insertUserSchema.parse({
      email: "strong@example.local",
      password: "SehrSicher123!",
      name: "Strong User",
      role: "user",
      mandantIds: "[]",
      aktiv: true,
    })).not.toThrow();
  });
});

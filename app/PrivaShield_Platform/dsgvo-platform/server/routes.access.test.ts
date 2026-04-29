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

function getAccessibleGruppenIds(userRole: string, allowedMandantIds: number[], mandanten: Array<{ id: number; gruppeId?: number | null }>) {
  if (userRole === "admin") {
    return Array.from(new Set(mandanten.map((mandant) => mandant.gruppeId).filter((gruppeId): gruppeId is number => Number.isInteger(gruppeId) && (gruppeId as number) > 0)));
  }
  return Array.from(new Set(
    mandanten
      .filter((mandant) => allowedMandantIds.includes(mandant.id) && Number.isInteger(mandant.gruppeId) && (mandant.gruppeId as number) > 0)
      .map((mandant) => mandant.gruppeId as number),
  ));
}

import { insertUserSchema } from "@shared/schema";

describe("access control policy", () => {
  it("shows non-admin users only the groups of their assigned mandants", () => {
    const mandanten = [
      { id: 1, gruppeId: 10 },
      { id: 2, gruppeId: 20 },
      { id: 3, gruppeId: 10 },
      { id: 4, gruppeId: null },
    ];

    expect(getAccessibleGruppenIds("user", [1, 4], mandanten)).toEqual([10]);
    expect(getAccessibleGruppenIds("user", [2], mandanten)).toEqual([20]);
  });

  it("does not leak unrelated groups to non-admin users", () => {
    const mandanten = [
      { id: 1, gruppeId: 10 },
      { id: 2, gruppeId: 20 },
      { id: 3, gruppeId: 30 },
    ];

    expect(getAccessibleGruppenIds("user", [1], mandanten)).not.toContain(20);
    expect(getAccessibleGruppenIds("user", [1], mandanten)).not.toContain(30);
  });

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

  it("rejects unassigned mandant access consistently", () => {
    expect(canAccessMandant("dsb", [7, 8], 9)).toBe(false);
  });

  it("allows admins to see all known groups", () => {
    const mandanten = [
      { id: 1, gruppeId: 10 },
      { id: 2, gruppeId: 20 },
      { id: 3, gruppeId: 20 },
    ];

    expect(getAccessibleGruppenIds("admin", [], mandanten)).toEqual([10, 20]);
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

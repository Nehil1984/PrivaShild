import { describe, expect, it } from "vitest";

function canAccessMandant(userRole: string, allowedIds: number[], mandantId: number) {
  if (userRole === "admin") return true;
  return allowedIds.includes(mandantId);
}

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
});

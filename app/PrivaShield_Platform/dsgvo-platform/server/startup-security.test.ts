import { describe, expect, it } from "vitest";

function assertProductionSecrets(env: { NODE_ENV?: string; JWT_SECRET?: string }) {
  if (env.NODE_ENV !== "production") return;

  const jwtSecret = String(env.JWT_SECRET || "");
  if (jwtSecret.length < 32 || /bitte-langen-zufaelligen-produktionsschluessel-setzen/i.test(jwtSecret)) {
    throw new Error("Unsichere Produktionskonfiguration: JWT_SECRET fehlt oder ist zu schwach.");
  }
}

function assertInitialAdminPasswordForSeeding(password?: string) {
  const value = String(password || "");
  if (!value) return;
  if (value.length < 12 || /bitte-sicheres-einmalpasswort-setzen/i.test(value)) {
    throw new Error("Unsichere Produktionskonfiguration: INITIAL_ADMIN_PASSWORD ist für das Initial-Seeding zu schwach.");
  }
}

describe("startup security guards", () => {
  it("allows development mode without production secrets", () => {
    expect(() => assertProductionSecrets({ NODE_ENV: "development" })).not.toThrow();
  });

  it("rejects weak production JWT secrets", () => {
    expect(() => assertProductionSecrets({ NODE_ENV: "production", JWT_SECRET: "short" })).toThrow("JWT_SECRET");
  });

  it("rejects placeholder admin passwords only for initial seeding", () => {
    expect(() => assertInitialAdminPasswordForSeeding("bitte-sicheres-einmalpasswort-setzen")).toThrow("INITIAL_ADMIN_PASSWORD");
  });

  it("accepts strong production secrets", () => {
    expect(() => assertProductionSecrets({ NODE_ENV: "production", JWT_SECRET: "12345678901234567890123456789012" })).not.toThrow();
    expect(() => assertInitialAdminPasswordForSeeding("SehrSicheresAdm1n!")).not.toThrow();
  });
});

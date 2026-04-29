import { describe, expect, it } from "vitest";

function assertProductionSecrets(env: { NODE_ENV?: string; JWT_SECRET?: string; INITIAL_ADMIN_PASSWORD?: string }) {
  if (env.NODE_ENV !== "production") return;

  const jwtSecret = String(env.JWT_SECRET || "");
  if (jwtSecret.length < 32 || /bitte-langen-zufaelligen-produktionsschluessel-setzen/i.test(jwtSecret)) {
    throw new Error("Unsichere Produktionskonfiguration: JWT_SECRET fehlt oder ist zu schwach.");
  }

  const adminPassword = String(env.INITIAL_ADMIN_PASSWORD || "");
  if (adminPassword && (/bitte-sicheres-einmalpasswort-setzen/i.test(adminPassword) || adminPassword.length < 12)) {
    throw new Error("Unsichere Produktionskonfiguration: INITIAL_ADMIN_PASSWORD ist zu schwach.");
  }
}

describe("startup security guards", () => {
  it("allows development mode without production secrets", () => {
    expect(() => assertProductionSecrets({ NODE_ENV: "development" })).not.toThrow();
  });

  it("rejects weak production JWT secrets", () => {
    expect(() => assertProductionSecrets({ NODE_ENV: "production", JWT_SECRET: "short" })).toThrow("JWT_SECRET");
  });

  it("rejects placeholder admin passwords in production", () => {
    expect(() => assertProductionSecrets({ NODE_ENV: "production", JWT_SECRET: "12345678901234567890123456789012", INITIAL_ADMIN_PASSWORD: "bitte-sicheres-einmalpasswort-setzen" })).toThrow("INITIAL_ADMIN_PASSWORD");
  });

  it("accepts strong production secrets", () => {
    expect(() => assertProductionSecrets({ NODE_ENV: "production", JWT_SECRET: "12345678901234567890123456789012", INITIAL_ADMIN_PASSWORD: "SehrSicheresAdm1n!" })).not.toThrow();
  });
});

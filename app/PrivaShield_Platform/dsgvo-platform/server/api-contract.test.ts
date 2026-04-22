import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const routesSource = readFileSync(path.resolve(import.meta.dirname, "routes.ts"), "utf8");

const explicitMandantRoutes = [
  "dsfa",
  "interne-notizen",
  "loeschkonzept",
] as const;

const crudModules = [
  "vvt",
  "avv",
  "datenpannen",
  "dsr",
  "tom",
  "audits",
  "aufgaben",
  "dokumente",
] as const;

describe("API contract for mandant-bound modules", () => {
  it("exposes GET list routes for all critical mandant modules used by the frontend", () => {
    for (const moduleName of explicitMandantRoutes) {
      expect(routesSource).toContain(`/api/mandanten/:mid/${moduleName}`);
    }
    for (const moduleName of crudModules) {
      expect(routesSource).toContain(`crudRoutes("${moduleName}"`);
    }
  });

  it("exposes export-context route for print/export flows", () => {
    expect(routesSource).toContain('/api/mandanten/:mid/export-context');
  });

  it("keeps user, mandanten and template management endpoints available", () => {
    expect(routesSource).toContain('/api/users');
    expect(routesSource).toContain('/api/mandanten');
    expect(routesSource).toContain('/api/mandanten-gruppen');
    expect(routesSource).toContain('/api/vorlagenpakete');
  });
});

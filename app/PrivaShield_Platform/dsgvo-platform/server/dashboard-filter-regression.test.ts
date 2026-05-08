import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("dashboard filter route regression guards", () => {
  const appPath = path.resolve(__dirname, "../client/src/App.tsx");
  const source = fs.readFileSync(appPath, "utf8");

  const dashboardLinks = [...source.matchAll(/actionHref: "([^"]+)"/g)].map((match) => match[1]);

  it("keeps all dashboard links on supported module routes", () => {
    expect(dashboardLinks.length).toBeGreaterThan(0);
    for (const href of dashboardLinks) {
      expect(href.startsWith("/aufgaben?") || href.startsWith("/pdca?") || href.startsWith("/datenpannen?") || href.startsWith("/dsfa?") || href.startsWith("/avv?") || href.startsWith("/tom?") || href.startsWith("/vvt?") || href.startsWith("/dsr?") || href.startsWith("/loeschkonzept?") || href.startsWith("/ki-compliance?") || href.startsWith("/audits?") || href.startsWith("/beschaeftigtendatenschutz?")).toBe(true);
    }
  });

  it("keeps critical governance task filters explicitly supported", () => {
    expect(source).toContain('rawTaskFilter === "kritisch-ohne-faelligkeit"');
    expect(source).toContain('rawTaskFilter === "pdca-follow-up-ueberfaellig"');
    expect(source).toContain('actionHref: "/aufgaben?filter=kritisch-ohne-faelligkeit"');
    expect(source).toContain('actionHref: "/aufgaben?filter=pdca-follow-up-ueberfaellig"');
  });

  it("keeps pdca dashboard routes explicitly supported on the pdca page", () => {
    expect(source).toContain('rawPdcaFilter === "priority-high"');
    expect(source).toContain('rawPdcaFilter === "review-missing"');
    expect(source).toContain('rawPdcaFilter === "in-progress-no-task"');
    expect(source).toContain('actionHref: "/pdca?filter=priority-high"');
    expect(source).toContain('actionHref: "/pdca?filter=review-missing"');
    expect(source).toContain('actionHref: "/pdca?filter=in-progress-no-task"');
  });
});

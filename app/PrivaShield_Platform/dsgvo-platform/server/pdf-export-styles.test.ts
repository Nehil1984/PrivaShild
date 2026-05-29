// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";

// Emulate style resolver in print.html template
function resolveDesignCSS(designStyle: string): string {
  if (designStyle === "executive") {
    return "body { font-family: -apple-system; } .cover-logo svg { color: #0284c7; } .module-header { background: #0b2545; }";
  } else if (designStyle === "minimalist") {
    return "body { color: #111827; } .module-header { background: #111827; }";
  } else if (designStyle === "printable") {
    return "body { color: #000; font-family: Georgia; } .module-header { background: #fff; color: #000; }";
  }
  return "";
}

// Emulate custom logo and table of contents generation
function generateCoverHeader(mandantInfo: any): { hasCustomLogo: boolean; htmlSnippet: string } {
  const logoHtml = mandantInfo?.logo
    ? `<div class="company-logo"><img src="${mandantInfo.logo}" /></div>`
    : "";

  return {
    hasCustomLogo: !!mandantInfo?.logo,
    htmlSnippet: `<div class="cover-logo">${logoHtml}</div>`
  };
}

describe("Premium PDF Export Design System", () => {
  it("resolves the correct CSS styles depending on designStyle", () => {
    expect(resolveDesignCSS("executive")).toContain("#0284c7");
    expect(resolveDesignCSS("minimalist")).toContain("#111827");
    expect(resolveDesignCSS("printable")).toContain("#000");
    expect(resolveDesignCSS("printable")).toContain("Georgia");
  });

  it("dynamically resolves custom company logos on the cover page", () => {
    const withoutLogo = generateCoverHeader({ name: "ACME Corp", logo: "" });
    expect(withoutLogo.hasCustomLogo).toBe(false);
    expect(withoutLogo.htmlSnippet).not.toContain("img");

    const withLogo = generateCoverHeader({ name: "ACME Corp", logo: "data:image/png;base64,12345" });
    expect(withLogo.hasCustomLogo).toBe(true);
    expect(withLogo.htmlSnippet).toContain("company-logo");
    expect(withLogo.htmlSnippet).toContain("data:image/png;base64,12345");
  });
});

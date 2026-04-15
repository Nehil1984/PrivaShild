// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validateBody } from "./validation";

function mockRes() {
  return {
    statusCode: 200,
    body: null as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  } as any;
}

describe("validateBody", () => {
  it("passes valid request bodies through", () => {
    const req = { body: { name: "Mandant" } } as any;
    const res = mockRes();
    let nextCalled = 0;

    validateBody(z.object({ name: z.string().min(1) }))(req, res, () => nextCalled++);

    expect(nextCalled).toBe(1);
    expect(req.body.name).toBe("Mandant");
  });

  it("returns 400 with field errors for invalid bodies", () => {
    const req = { body: { name: "" } } as any;
    const res = mockRes();
    let nextCalled = 0;

    validateBody(z.object({ name: z.string().min(1, "Pflichtfeld") }))(req, res, () => nextCalled++);

    expect(nextCalled).toBe(0);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Ungültige Eingabedaten");
    expect(res.body.errors[0].path).toBe("name");
  });
});

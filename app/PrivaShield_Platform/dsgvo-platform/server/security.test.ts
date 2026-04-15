// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";
import { clearLoginFailures, loginRateLimit, registerLoginFailure } from "./security";

function mockReq(ip = "127.0.0.1") {
  return { ip, socket: { remoteAddress: ip } } as any;
}

function mockRes() {
  return {
    headers: {} as Record<string, string>,
    statusCode: 200,
    body: null as any,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
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

describe("security login rate limit", () => {
  it("allows requests initially and blocks after repeated failures", () => {
    const req = mockReq("10.0.0.1");
    const res = mockRes();
    let nextCalled = 0;

    for (let i = 0; i < 5; i++) {
      loginRateLimit(req, res, () => nextCalled++);
      registerLoginFailure(req);
    }

    const blockedRes = mockRes();
    let blockedNext = 0;
    loginRateLimit(req, blockedRes, () => blockedNext++);

    expect(nextCalled).toBe(5);
    expect(blockedNext).toBe(0);
    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.body.message).toContain("Zu viele Login-Versuche");

    clearLoginFailures(req);
    const finalRes = mockRes();
    let finalNext = 0;
    loginRateLimit(req, finalRes, () => finalNext++);
    expect(finalNext).toBe(1);
  });
});

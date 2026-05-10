// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";
import { clearLoginFailures, csrfProtection, loginRateLimit, registerLoginFailure, setCsrfCookie } from "./security";

function mockReq(ip = "127.0.0.1", extra: Record<string, unknown> = {}) {
  return { ip, socket: { remoteAddress: ip }, protocol: "https", headers: {}, method: "GET", ...extra } as any;
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

  it("clears the IP limiter state after reset", () => {
    const req = mockReq("10.0.0.2");
    for (let i = 0; i < 5; i++) registerLoginFailure(req);
    clearLoginFailures(req);
    const res = mockRes();
    let nextCalled = 0;
    loginRateLimit(req, res, () => nextCalled++);
    expect(nextCalled).toBe(1);
  });
});

describe("security cookie policy", () => {
  it("sets secure csrf cookies when forwarded proto contains https", () => {
    const req = mockReq("127.0.0.1", {
      headers: {
        host: "privashield.example.test",
        "x-forwarded-proto": "https, http",
      },
    });
    const res = {
      appendCalls: [] as string[],
      append(_key: string, value: string) {
        this.appendCalls.push(value);
      },
    } as any;

    setCsrfCookie(req, res, "token123");

    expect(res.appendCalls[0]).toContain("Secure");
  });

  it("does not set secure csrf cookies on localhost http", () => {
    const req = mockReq("127.0.0.1", {
      protocol: "http",
      headers: {
        host: "localhost:5000",
      },
    });
    const res = {
      appendCalls: [] as string[],
      append(_key: string, value: string) {
        this.appendCalls.push(value);
      },
    } as any;

    setCsrfCookie(req, res, "token123");

    expect(res.appendCalls[0]).not.toContain("Secure");
  });
});

describe("security csrf protection", () => {
  it("blocks changing requests with mismatched origin even if csrf token matches", () => {
    const req = mockReq("127.0.0.1", {
      method: "POST",
      headers: {
        host: "app.example.test",
        origin: "https://evil.example.test",
        cookie: "privashield_csrf=abc",
        "x-csrf-token": "abc",
      },
    });
    const res = mockRes();
    let nextCalled = 0;

    csrfProtection(req, res, () => nextCalled++);

    expect(nextCalled).toBe(0);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("Origin-Prüfung");
  });

  it("allows changing requests with matching origin and csrf token", () => {
    const req = mockReq("127.0.0.1", {
      method: "POST",
      headers: {
        host: "app.example.test",
        origin: "https://app.example.test",
        cookie: "privashield_csrf=abc",
        "x-csrf-token": "abc",
      },
    });
    const res = mockRes();
    let nextCalled = 0;

    csrfProtection(req, res, () => nextCalled++);

    expect(nextCalled).toBe(1);
    expect(res.statusCode).toBe(200);
  });
});

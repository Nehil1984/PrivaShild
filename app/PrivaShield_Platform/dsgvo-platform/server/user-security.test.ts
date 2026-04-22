// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { describe, expect, it } from "vitest";

function pickAllowedUserUpdateFields(body: Record<string, unknown>) {
  const allowed: Record<string, unknown> = {};
  for (const key of ["name", "email", "password", "role", "mandantIds", "aktiv"]) {
    if (key in body) allowed[key] = body[key];
  }
  return allowed;
}

function applyUnlock(body: Record<string, unknown>) {
  const sanitized = pickAllowedUserUpdateFields(body);
  if (body.unlockUser === true) {
    Object.assign(sanitized, {
      adminLocked: false,
      adminLockedAt: null,
      failedLoginAttempts: 0,
      temporaryLockUntil: null,
      lastFailedLoginAt: null,
    });
  }
  return sanitized;
}

describe("user security update guards", () => {
  it("keeps only explicitly allowed user update fields", () => {
    const payload = pickAllowedUserUpdateFields({
      name: "Max Mustermann",
      email: "max@example.com",
      role: "user",
      mandantIds: "[1]",
      aktiv: true,
      adminLocked: true,
      failedLoginAttempts: 99,
      temporaryLockUntil: "2099-01-01T00:00:00.000Z",
    });

    expect(payload).toEqual({
      name: "Max Mustermann",
      email: "max@example.com",
      role: "user",
      mandantIds: "[1]",
      aktiv: true,
    });
  });

  it("does not allow direct security-field escalation without unlock flag", () => {
    const payload = applyUnlock({
      adminLocked: false,
      failedLoginAttempts: 0,
      temporaryLockUntil: null,
      lastFailedLoginAt: null,
    });

    expect(payload).toEqual({});
  });

  it("resets lock-related fields only through explicit unlock flow", () => {
    const payload = applyUnlock({ unlockUser: true, name: "Freigabe" });

    expect(payload).toEqual({
      name: "Freigabe",
      adminLocked: false,
      adminLockedAt: null,
      failedLoginAttempts: 0,
      temporaryLockUntil: null,
      lastFailedLoginAt: null,
    });
  });
});

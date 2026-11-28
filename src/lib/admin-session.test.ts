import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_SESSION_MS,
  readAdminSecret,
  readAdminSession,
  secretsMatch,
  signAdminSession,
} from "./admin-session.ts";

describe("admin secret", () => {
  it("stays closed when neither env var is set", () => {
    assert.equal(readAdminSecret({} as NodeJS.ProcessEnv), null);
    assert.equal(
      readAdminSecret({ ADMIN_SECRET: "  ", ADMIN_PASSWORD: "" } as NodeJS.ProcessEnv),
      null,
    );
  });

  it("accepts ADMIN_SECRET, then ADMIN_PASSWORD", () => {
    assert.equal(
      readAdminSecret({ ADMIN_SECRET: " desk-secret " } as NodeJS.ProcessEnv),
      "desk-secret",
    );
    assert.equal(readAdminSecret({ ADMIN_PASSWORD: "other" } as NodeJS.ProcessEnv), "other");
    assert.equal(
      readAdminSecret({ ADMIN_SECRET: "primary", ADMIN_PASSWORD: "other" } as NodeJS.ProcessEnv),
      "primary",
    );
  });

  it("compares secrets without caring about length", () => {
    assert.equal(secretsMatch("correct horse", "correct horse"), true);
    assert.equal(secretsMatch("a", "correct horse"), false);
    assert.equal(secretsMatch("", "x"), false);
  });
});

describe("admin session cookie", () => {
  const secret = "test-admin-secret";

  it("accepts a cookie it just signed", () => {
    const now = 1_700_000_000_000;
    const token = signAdminSession(secret, now);
    assert.equal(readAdminSession(token, secret, now + 1000), true);
  });

  it("rejects a missing, expired, or tampered cookie", () => {
    const now = 1_700_000_000_000;
    const token = signAdminSession(secret, now);
    assert.equal(readAdminSession(undefined, secret, now), false);
    assert.equal(readAdminSession(token, "other-secret", now), false);
    assert.equal(readAdminSession(token, secret, now + ADMIN_SESSION_MS), false);
    const [body, sig] = token.split(".");
    const flipped = `${body}.${sig.slice(0, -1)}${sig.endsWith("a") ? "b" : "a"}`;
    assert.equal(readAdminSession(flipped, secret, now), false);
    assert.equal(readAdminSession("not-a-token", secret, now), false);
  });
});

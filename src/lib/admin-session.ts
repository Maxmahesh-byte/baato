import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "baato_admin";
const VERSION = 1;
export const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000;

export function readAdminSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const secret = env.ADMIN_SECRET?.trim() || env.ADMIN_PASSWORD?.trim() || "";
  return secret.length > 0 ? secret : null;
}

/** Compare secrets without leaking length through a raw timingSafeEqual. */
export function secretsMatch(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function encode(bytes: Buffer): string {
  return bytes.toString("base64url");
}

export function signAdminSession(secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ v: VERSION, exp: now + ADMIN_SESSION_MS }));
  const sig = createHmac("sha256", secret).update(payload).digest();
  return `${encode(payload)}.${encode(sig)}`;
}

export function readAdminSession(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): boolean {
  if (!token || !secret) return false;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;
  const payload = Buffer.from(token.slice(0, dot), "base64url");
  const signature = Buffer.from(token.slice(dot + 1), "base64url");
  const expected = createHmac("sha256", secret).update(payload).digest();
  if (expected.length !== signature.length || !timingSafeEqual(expected, signature)) return false;
  try {
    const data = JSON.parse(payload.toString("utf8")) as { v?: unknown; exp?: unknown };
    return data.v === VERSION && typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

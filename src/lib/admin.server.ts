import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MS,
  readAdminSecret,
  readAdminSession,
  secretsMatch,
  signAdminSession,
} from "./admin-session";
import { applyFulfillmentUpdate, listAdminOrders, type AdminOrder } from "./admin-store";
import { getSql, withTransaction } from "./db";
import { isFulfillment } from "./fulfillment";
import {
  inventoryLines,
  parseStockUpdate,
  readStockMap,
  upsertInventory,
  type InventoryLine,
} from "./inventory";
import { invoicePdfForCode, settleCodPayment } from "./orders.server";

function secureCookie(): boolean {
  const configured = process.env.APP_ORIGIN?.trim();
  if (configured) return configured.startsWith("https://");
  try {
    const request = getRequest();
    const proto =
      request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
    return proto === "https";
  } catch {
    return false;
  }
}

function cookieOptions(maxAge: number) {
  return { path: "/", httpOnly: true, sameSite: "lax" as const, secure: secureCookie(), maxAge };
}

export type AdminPage =
  | { configured: false }
  | { configured: true; authed: false }
  | { configured: true; authed: true; orders: AdminOrder[]; inventory: InventoryLine[] };

export async function loadAdminPage(): Promise<AdminPage> {
  const secret = readAdminSecret();
  if (!secret) return { configured: false };
  if (!readAdminSession(getCookie(ADMIN_COOKIE), secret))
    return { configured: true, authed: false };
  const sql = await getSql();
  const [orders, map] = await Promise.all([
    listAdminOrders(sql, { status: "", query: "" }),
    readStockMap(sql),
  ]);
  return { configured: true, authed: true, orders, inventory: inventoryLines(map) };
}

export async function loginAdmin(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = readAdminSecret();
  if (!secret) return { ok: false, error: "Set ADMIN_SECRET before opening the desk." };
  if (!secretsMatch(password ?? "", secret))
    return { ok: false, error: "That password does not match." };
  setCookie(
    ADMIN_COOKIE,
    signAdminSession(secret),
    cookieOptions(Math.floor(ADMIN_SESSION_MS / 1000)),
  );
  return { ok: true };
}

export function logoutAdmin() {
  setCookie(ADMIN_COOKIE, "", cookieOptions(0));
}

function gate(): { ok: false; error: string } | null {
  const secret = readAdminSecret();
  if (!secret) return { ok: false, error: "Set ADMIN_SECRET before opening the desk." };
  if (!readAdminSession(getCookie(ADMIN_COOKIE), secret)) {
    return { ok: false, error: "Sign in to the desk first." };
  }
  return null;
}

export async function updateFulfillment(code: string, next: string) {
  const denied = gate();
  if (denied) return denied;
  if (!isFulfillment(next)) return { ok: false as const, error: "Unknown status." };
  return withTransaction((sql) => applyFulfillmentUpdate(sql, code, next, settleCodPayment));
}

export async function updateStock(input: unknown) {
  const denied = gate();
  if (denied) return denied;
  const parsed = parseStockUpdate(input);
  if (!parsed.ok) return parsed;
  const sql = await getSql();
  await upsertInventory(sql, parsed.slug, parsed.stock, parsed.available);
  return { ok: true as const };
}

export async function adminInvoice(code: string) {
  const denied = gate();
  if (denied) return denied;
  return invoicePdfForCode(code);
}

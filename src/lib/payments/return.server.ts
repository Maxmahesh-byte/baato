import { parseEsewaDataParam } from "./esewa";
import { orderCodeFromCookie, verifyProviderRef, webhookSecretOk } from "../orders.server";

function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { location } });
}

function cookieFrom(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

async function readEsewaData(request: Request): Promise<string | null> {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("data");
  if (fromQuery) return fromQuery;
  if (request.method !== "POST") return null;
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { data?: unknown } | null;
    return typeof body?.data === "string" ? body.data : null;
  }
  const form = await request.formData().catch(() => null);
  const value = form?.get("data");
  return typeof value === "string" ? value : null;
}

export async function handleEsewaReturn(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const data = await readEsewaData(request);
  const fields = data ? parseEsewaDataParam(data) : null;
  const uuid = fields?.transaction_uuid;
  if (!uuid) {
    const code = cookieFrom(request, "baato_order") ?? orderCodeFromCookie();
    const failed = url.searchParams.get("outcome") === "failure";
    if (code && /^BT-\d+$/.test(code)) {
      return redirect(`/orders/${code}?result=${failed ? "failed" : "pending"}`);
    }
    return redirect("/orders/lookup?result=failed");
  }
  const result = await verifyProviderRef("esewa", uuid);
  return redirect(result.location);
}

export async function handleKhaltiReturn(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pidx = url.searchParams.get("pidx");
  if (!pidx) {
    const code = cookieFrom(request, "baato_order") ?? orderCodeFromCookie();
    if (code && /^BT-\d+$/.test(code)) return redirect(`/orders/${code}?result=failed`);
    return redirect("/orders/lookup?result=failed");
  }
  const result = await verifyProviderRef("khalti", pidx);
  return redirect(result.location);
}

export async function handleFonepayWebhook(request: Request): Promise<Response> {
  const expected = process.env.FONEPAY_WEBHOOK_SECRET?.trim() ?? "";
  if (!expected) {
    return Response.json(
      { ok: false, error: "Set FONEPAY_WEBHOOK_SECRET before calling this route." },
      { status: 503 },
    );
  }
  const provided = request.headers.get("x-baato-webhook-secret") ?? "";
  if (!webhookSecretOk(provided, expected)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const prn =
    typeof body?.prn === "string"
      ? body.prn
      : typeof body?.productNumber === "string"
        ? body.productNumber
        : "";
  if (!prn) return Response.json({ ok: false, error: "Missing prn" }, { status: 400 });
  const result = await verifyProviderRef("fonepay", prn);
  return Response.json({ ok: true, location: result.location });
}

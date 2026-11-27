import { fonepayAmountString, parseRupeesToPaisa } from "../money";
import { classifyEsewaStatus } from "./esewa";
import { classifyFonepayStatus, fonepayQrSignature, fonepayStatusSignature } from "./fonepay";
import { classifyKhaltiStatus, khaltiAuthHeader } from "./khalti";
import { esewaEnv, fonepayEnv, khaltiEnv } from "../shop.server";

export type ProviderCheck = {
  outcome: "complete" | "pending" | "failed";
  /** Paisa confirmed by the provider. Null when the provider did not echo an amount. */
  amountPaisa: number | null;
  raw: unknown;
};

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { unparsed: text.slice(0, 180) };
  }
}

function messageOf(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message.slice(0, 180);
  }
  return fallback;
}

export async function checkEsewa(input: {
  transactionUuid: string;
  totalAmount: string;
}): Promise<ProviderCheck> {
  const env = esewaEnv();
  if (!env.enabled) throw new Error("eSewa is not configured.");
  const url = new URL(env.statusUrl);
  url.searchParams.set("product_code", env.productCode);
  url.searchParams.set("total_amount", input.totalAmount);
  url.searchParams.set("transaction_uuid", input.transactionUuid);
  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  const body = await readBody(response);
  if (!response.ok || !body || typeof body !== "object") {
    return { outcome: "pending", amountPaisa: null, raw: body };
  }
  const record = body as Record<string, unknown>;
  const status = typeof record.status === "string" ? record.status : "";
  if (!status) return { outcome: "pending", amountPaisa: null, raw: body };
  const amountPaisa =
    record.total_amount == null ? null : parseRupeesToPaisa(record.total_amount as string | number);
  return { outcome: classifyEsewaStatus(status), amountPaisa, raw: body };
}

export async function initiateKhalti(input: {
  amountPaisa: number;
  purchaseOrderId: string;
  orderCode: string;
  returnUrl: string;
  websiteUrl: string;
  customerName: string;
  customerPhone: string;
}): Promise<{ pidx: string; paymentUrl: string; expiresAt: string | null }> {
  const env = khaltiEnv();
  if (!env.enabled) throw new Error("Khalti is not configured.");
  const response = await fetch(`${env.baseUrl}/epayment/initiate/`, {
    method: "POST",
    headers: {
      Authorization: khaltiAuthHeader(env.secret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      return_url: input.returnUrl,
      website_url: input.websiteUrl,
      amount: input.amountPaisa,
      purchase_order_id: input.purchaseOrderId,
      purchase_order_name: `BAATO ${input.orderCode}`,
      customer_info: { name: input.customerName, phone: input.customerPhone },
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const body = await readBody(response);
  if (!response.ok || !body || typeof body !== "object") {
    throw new Error(messageOf(body, "Khalti could not start the payment."));
  }
  const record = body as Record<string, unknown>;
  if (typeof record.pidx !== "string" || typeof record.payment_url !== "string") {
    throw new Error(messageOf(body, "Khalti did not return a payment link."));
  }
  return {
    pidx: record.pidx,
    paymentUrl: record.payment_url,
    expiresAt: typeof record.expires_at === "string" ? record.expires_at : null,
  };
}

export async function lookupKhalti(pidx: string): Promise<ProviderCheck> {
  const env = khaltiEnv();
  if (!env.enabled) throw new Error("Khalti is not configured.");
  const response = await fetch(`${env.baseUrl}/epayment/lookup/`, {
    method: "POST",
    headers: {
      Authorization: khaltiAuthHeader(env.secret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
    signal: AbortSignal.timeout(12_000),
  });
  const body = await readBody(response);
  if (!body || typeof body !== "object") return { outcome: "pending", amountPaisa: null, raw: body };
  const record = body as Record<string, unknown>;
  const status = typeof record.status === "string" ? record.status : "";
  if (!status) return { outcome: "pending", amountPaisa: null, raw: body };
  const amount =
    typeof record.total_amount === "number"
      ? record.total_amount
      : typeof record.total_amount === "string" && /^\d+$/.test(record.total_amount)
        ? Number(record.total_amount)
        : null;
  return { outcome: classifyKhaltiStatus(status), amountPaisa: amount, raw: body };
}

export async function createFonepayQr(input: {
  amountPaisa: number;
  prn: string;
}): Promise<{ qrMessage: string; websocketUrl: string | null; amount: string }> {
  const env = fonepayEnv();
  if (!env.enabled) throw new Error("Fonepay is not configured.");
  const amount = fonepayAmountString(input.amountPaisa);
  const remarks1 = "BAATO";
  const remarks2 = "Parts";
  const dataValidation = fonepayQrSignature({
    secret: env.secret,
    amount,
    prn: input.prn,
    merchantCode: env.merchantCode,
    remarks1,
    remarks2,
  });
  const response = await fetch(env.qrUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      remarks1,
      remarks2,
      prn: input.prn,
      merchantCode: env.merchantCode,
      dataValidation,
      username: env.username,
      password: env.password,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const body = await readBody(response);
  if (!body || typeof body !== "object") throw new Error("Fonepay did not return a QR.");
  const record = body as Record<string, unknown>;
  if (record.success !== true || typeof record.qrMessage !== "string") {
    throw new Error(messageOf(body, "Fonepay rejected the QR request."));
  }
  return {
    qrMessage: record.qrMessage,
    websocketUrl: typeof record.thirdpartyQrWebSocketUrl === "string" ? record.thirdpartyQrWebSocketUrl : null,
    amount,
  };
}

export async function checkFonepay(input: {
  prn: string;
  storedAmountPaisa: number;
}): Promise<ProviderCheck> {
  const env = fonepayEnv();
  if (!env.enabled) throw new Error("Fonepay is not configured.");
  const response = await fetch(env.statusUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prn: input.prn,
      merchantCode: env.merchantCode,
      username: env.username,
      password: env.password,
      dataValidation: fonepayStatusSignature(env.secret, input.prn, env.merchantCode),
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const body = await readBody(response);
  if (!body || typeof body !== "object") return { outcome: "pending", amountPaisa: null, raw: body };
  const record = body as Record<string, unknown>;
  const status = typeof record.paymentStatus === "string" ? record.paymentStatus : "";
  if (!status) return { outcome: "pending", amountPaisa: null, raw: body };
  const echoedPrn = typeof record.prn === "string" ? record.prn : "";
  if (echoedPrn && echoedPrn !== input.prn) {
    return { outcome: "failed", amountPaisa: null, raw: body };
  }
  const outcome = classifyFonepayStatus(status);
  // GetStatus does not echo the amount. The PRN was HMAC-signed with the
  // amount we requested, so a success for that PRN is that amount.
  const reported =
    record.amount == null ? null : parseRupeesToPaisa(record.amount as string | number);
  const amountPaisa = reported ?? (outcome === "complete" ? input.storedAmountPaisa : null);
  return { outcome, amountPaisa, raw: body };
}

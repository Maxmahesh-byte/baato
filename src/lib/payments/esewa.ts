import { createHmac, timingSafeEqual } from "node:crypto";

export const ESEWA_SIGNED_FIELD_NAMES = "total_amount,transaction_uuid,product_code";

export const ESEWA_FORM_URL = {
  uat: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  prod: "https://epay.esewa.com.np/api/epay/main/v2/form",
} as const;

export const ESEWA_STATUS_URL = {
  uat: "https://rc-epay.esewa.com.np/api/epay/transaction/status/",
  prod: "https://epay.esewa.com.np/api/epay/transaction/status/",
} as const;

/** HMAC-SHA256, base64, over `name=value` pairs in the given order. */
export function esewaSign(fields: Record<string, string>, secret: string, signedFieldNames: string): string {
  const names = signedFieldNames.split(",").map((name) => name.trim()).filter(Boolean);
  const message = names.map((name) => `${name}=${fields[name] ?? ""}`).join(",");
  return createHmac("sha256", secret).update(message).digest("base64");
}

export function esewaVerify(
  fields: Record<string, string>,
  signature: string,
  secret: string,
  signedFieldNames: string,
): boolean {
  const expected = esewaSign(fields, secret, signedFieldNames);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseEsewaDataParam(data: string): Record<string, string> | null {
  try {
    const json = JSON.parse(Buffer.from(data, "base64").toString("utf8")) as unknown;
    if (!json || typeof json !== "object") return null;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(json)) {
      if (typeof value === "string" || typeof value === "number") out[key] = String(value);
    }
    return out;
  } catch {
    return null;
  }
}

export function classifyEsewaStatus(status: string): "complete" | "pending" | "failed" {
  const normalized = status.toUpperCase();
  if (normalized === "COMPLETE") return "complete";
  if (normalized === "PENDING" || normalized === "AMBIGUOUS") return "pending";
  return "failed";
}

export type EsewaForm = { action: string; fields: Record<string, string> };

export function buildEsewaForm(input: {
  productCode: string;
  secret: string;
  formUrl: string;
  transactionUuid: string;
  totalAmount: string;
  amount: string;
  taxAmount: string;
  successUrl: string;
  failureUrl: string;
}): EsewaForm {
  const fields: Record<string, string> = {
    amount: input.amount,
    tax_amount: input.taxAmount,
    total_amount: input.totalAmount,
    transaction_uuid: input.transactionUuid,
    product_code: input.productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: input.successUrl,
    failure_url: input.failureUrl,
    signed_field_names: ESEWA_SIGNED_FIELD_NAMES,
  };
  fields.signature = esewaSign(fields, input.secret, ESEWA_SIGNED_FIELD_NAMES);
  return { action: input.formUrl, fields };
}

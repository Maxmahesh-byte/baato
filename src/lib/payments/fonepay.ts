import { createHmac } from "node:crypto";

export const FONEPAY_API = {
  uat: "https://uat-new-merchant-api.fonepay.com/api/merchant/merchantDetailsForThirdParty",
  prod: "https://merchantapi.fonepay.com/api/merchant/merchantDetailsForThirdParty",
} as const;

/**
 * Fonepay dynamic QR signs comma-joined fields with HMAC-SHA512 and wants the
 * digest as lowercase hex. Do not URL-encode values before signing.
 */
export function fonepaySign(secret: string, parts: string[]): string {
  return createHmac("sha512", secret).update(parts.join(",")).digest("hex");
}

export function fonepayQrSignature(input: {
  secret: string;
  amount: string;
  prn: string;
  merchantCode: string;
  remarks1: string;
  remarks2: string;
}): string {
  return fonepaySign(input.secret, [
    input.amount,
    input.prn,
    input.merchantCode,
    input.remarks1,
    input.remarks2,
  ]);
}

export function fonepayStatusSignature(secret: string, prn: string, merchantCode: string): string {
  return fonepaySign(secret, [prn, merchantCode]);
}

export function classifyFonepayStatus(status: string): "complete" | "pending" | "failed" {
  const normalized = status.toLowerCase();
  if (normalized === "success") return "complete";
  if (normalized === "pending" || normalized === "created") return "pending";
  return "failed";
}

export type OrderPayState = "pending_payment" | "cod_confirmed" | "paid" | "cancelled";
export type ProviderOutcome = "complete" | "pending" | "failed";

export type CaptureDecision =
  | { action: "capture" }
  | { action: "already_paid" }
  | { action: "wait" }
  | { action: "reject"; reason: "amount_mismatch" | "amount_missing" | "not_pending" | "provider_failed" };

/**
 * Pure gate in front of the database write. A provider redirect is not proof.
 * Capture only when the provider says the payment completed and the amount
 * matches the order total. Calling it again after capture is a no-op.
 */
export function decideCapture(input: {
  orderStatus: OrderPayState;
  orderTotalPaisa: number;
  providerOutcome: ProviderOutcome;
  providerAmountPaisa: number | null;
}): CaptureDecision {
  if (input.orderStatus === "paid") return { action: "already_paid" };
  if (input.providerOutcome === "failed") return { action: "reject", reason: "provider_failed" };
  if (input.providerOutcome === "pending") return { action: "wait" };
  if (input.orderStatus !== "pending_payment") return { action: "reject", reason: "not_pending" };
  if (input.providerAmountPaisa == null) return { action: "reject", reason: "amount_missing" };
  if (input.providerAmountPaisa !== input.orderTotalPaisa) {
    return { action: "reject", reason: "amount_mismatch" };
  }
  return { action: "capture" };
}

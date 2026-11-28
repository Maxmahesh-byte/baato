export const FULFILLMENTS = [
  "pending",
  "confirmed",
  "paid",
  "dispatched",
  "delivered",
  "cancelled",
] as const;

export type Fulfillment = (typeof FULFILLMENTS)[number];

const NEXT: Record<Fulfillment, readonly Fulfillment[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["paid", "dispatched", "cancelled"],
  paid: ["dispatched", "cancelled"],
  dispatched: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function isFulfillment(value: unknown): value is Fulfillment {
  return typeof value === "string" && (FULFILLMENTS as readonly string[]).includes(value);
}

export function allowedNext(from: Fulfillment): readonly Fulfillment[] {
  return NEXT[from];
}

export function canTransition(from: Fulfillment, to: Fulfillment): boolean {
  return NEXT[from].includes(to);
}

export function fulfillmentLabel(value: Fulfillment): string {
  switch (value) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "paid":
      return "Paid";
    case "dispatched":
      return "Dispatched";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

/** Desk status for a newly inserted order. Wallet orders stay pending until capture. */
export function fulfillmentForOrderStatus(
  status: "pending_payment" | "cod_confirmed" | "paid" | "cancelled",
): Fulfillment {
  if (status === "cod_confirmed") return "confirmed";
  if (status === "paid") return "paid";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

export function customerStatusLabel(
  status: "pending_payment" | "cod_confirmed" | "paid" | "cancelled",
  fulfillment: Fulfillment,
): string {
  if (fulfillment === "dispatched") return "Dispatched";
  if (fulfillment === "delivered") return "Delivered";
  if (fulfillment === "cancelled" || status === "cancelled") return "Cancelled";
  if (status === "paid" || fulfillment === "paid") return "Paid";
  if (status === "cod_confirmed" || fulfillment === "confirmed") return "Confirmed for delivery";
  return "Waiting for payment";
}

export function orderMatches(
  order: { code: string; phone: string; fulfillment: string },
  status: string,
  query: string,
): boolean {
  if (status && status !== "all" && order.fulfillment !== status) return false;
  const q = query.trim();
  if (!q) return true;
  if (order.code.toLowerCase() === q.toLowerCase()) return true;
  const digits = q.replace(/\D/g, "");
  return digits.length >= 8 && order.phone.includes(digits);
}

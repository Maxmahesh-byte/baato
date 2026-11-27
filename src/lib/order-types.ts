import type { DeliveryZone, OrderLine, PaymentMethod } from "./checkout";

export type PublicOrder = {
  code: string;
  status: "pending_payment" | "cod_confirmed" | "paid" | "cancelled";
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "pending" | "paid" | "failed";
  customerName: string;
  phone: string;
  address: string;
  zone: DeliveryZone;
  buyerPan: string | null;
  subtotalPaisa: number;
  shippingPaisa: number;
  taxablePaisa: number;
  vatPaisa: number;
  totalPaisa: number;
  lines: OrderLine[];
  createdAt: string;
  paidAt: string | null;
  invoice: { number: string; kind: "proforma" | "tax" } | null;
  fonepayQrSvg: string | null;
  fonepaySocketUrl: string | null;
  khaltiUrl: string | null;
  esewa: { action: string; fields: Record<string, string> } | null;
};

export type PlaceOrderResult =
  | { ok: false; error: string }
  | { ok: true; order: PublicOrder; warning?: string };

export type OrderLookupResult = { ok: true; order: PublicOrder } | { ok: false; error: string };

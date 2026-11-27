import type { OrderLine } from "./checkout.ts";
import { canTransition, isFulfillment, orderMatches, type Fulfillment } from "./fulfillment.ts";
import type { TaggedSql } from "./sql-tag.ts";

export type AdminOrder = {
  code: string;
  fulfillment: Fulfillment;
  status: "pending_payment" | "cod_confirmed" | "paid" | "cancelled";
  paymentMethod: "cod" | "esewa" | "khalti" | "fonepay";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed";
  customerName: string;
  phone: string;
  address: string;
  zone: "valley" | "outside";
  buyerPan: string | null;
  subtotalPaisa: number;
  shippingPaisa: number;
  vatPaisa: number;
  totalPaisa: number;
  lines: OrderLine[];
  createdAt: string;
  paidAt: string | null;
  invoice: { number: string; kind: "proforma" | "tax" } | null;
};

type OrderRow = {
  id: string;
  code: string;
  fulfillment: string;
  status: AdminOrder["status"];
  payment_method: AdminOrder["paymentMethod"];
  payment_status: AdminOrder["paymentStatus"];
  customer_name: string;
  phone: string;
  address: string;
  zone: AdminOrder["zone"];
  buyer_pan: string | null;
  subtotal_paisa: unknown;
  shipping_paisa: unknown;
  vat_paisa: unknown;
  total_paisa: unknown;
  lines: unknown;
  created_at: unknown;
  paid_at: unknown;
};

type InvoiceRow = {
  order_id: string;
  invoice_number: string;
  kind: "proforma" | "tax";
};

function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asDate(value: unknown): string {
  const parsed = value instanceof Date ? value : new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function asLines(value: unknown): OrderLine[] {
  const source = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
  return Array.isArray(source) ? (source as OrderLine[]) : [];
}

function toAdmin(order: OrderRow, invoice: InvoiceRow | undefined): AdminOrder | null {
  if (!isFulfillment(order.fulfillment)) return null;
  return {
    code: order.code,
    fulfillment: order.fulfillment,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    customerName: order.customer_name,
    phone: order.phone,
    address: order.address,
    zone: order.zone,
    buyerPan: order.buyer_pan,
    subtotalPaisa: asNumber(order.subtotal_paisa),
    shippingPaisa: asNumber(order.shipping_paisa),
    vatPaisa: asNumber(order.vat_paisa),
    totalPaisa: asNumber(order.total_paisa),
    lines: asLines(order.lines),
    createdAt: asDate(order.created_at),
    paidAt: order.paid_at ? asDate(order.paid_at) : null,
    invoice: invoice ? { number: invoice.invoice_number, kind: invoice.kind } : null,
  };
}

function preferredInvoice(rows: InvoiceRow[]): InvoiceRow | undefined {
  return rows.find((row) => row.kind === "tax") ?? rows.find((row) => row.kind === "proforma");
}

export async function listAdminOrders(
  sql: TaggedSql,
  filter: { status: string; query: string },
): Promise<AdminOrder[]> {
  const rows = await sql<OrderRow>`select * from orders order by created_at desc limit 200`;
  const invoices = await sql<InvoiceRow>`select order_id, invoice_number, kind from invoices`;
  const byOrder = new Map<string, InvoiceRow[]>();
  for (const invoice of invoices) {
    const list = byOrder.get(invoice.order_id) ?? [];
    list.push(invoice);
    byOrder.set(invoice.order_id, list);
  }
  const orders: AdminOrder[] = [];
  for (const row of rows) {
    const order = toAdmin(row, preferredInvoice(byOrder.get(row.id) ?? []));
    if (!order) continue;
    if (!orderMatches(order, filter.status, filter.query)) continue;
    orders.push(order);
  }
  return orders;
}

export async function applyFulfillmentUpdate(
  sql: TaggedSql,
  code: string,
  next: Fulfillment,
  settleCod: (sql: TaggedSql, orderId: string) => Promise<void>,
): Promise<{ ok: true; fulfillment: Fulfillment } | { ok: false; error: string }> {
  if (!/^BT-\d+$/.test(code)) return { ok: false, error: "Unknown order." };
  const rows = await sql<OrderRow>`select * from orders where code = ${code} for update`;
  const order = rows[0];
  if (!order || !isFulfillment(order.fulfillment)) return { ok: false, error: "Unknown order." };
  if (!canTransition(order.fulfillment, next)) {
    return { ok: false, error: `Cannot move ${order.code} from ${order.fulfillment} to ${next}.` };
  }
  if (next === "paid") {
    if (order.payment_method !== "cod" || order.status !== "cod_confirmed") {
      return {
        ok: false,
        error: "Only a cash-on-delivery order can be marked paid from the desk.",
      };
    }
    await settleCod(sql, order.id);
    return { ok: true, fulfillment: "paid" };
  }
  if (next === "cancelled") {
    await sql`
      update orders
      set fulfillment = 'cancelled',
          status = case when status = 'paid' then status else 'cancelled' end,
          payment_status = case
            when payment_status = 'paid' then payment_status
            when payment_status = 'pending' then 'failed'
            else payment_status
          end
      where id = ${order.id}
    `;
    return { ok: true, fulfillment: "cancelled" };
  }
  await sql`update orders set fulfillment = ${next} where id = ${order.id}`;
  return { ok: true, fulfillment: next };
}

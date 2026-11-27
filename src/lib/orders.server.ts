import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import type { Sql } from "./db";
import { getSql, withTransaction } from "./db";
import type { TaggedSql } from "./sql-tag";
import {
  normalizeNepalPhone,
  parseCheckoutInput,
  parseInquiry,
  quoteLines,
  type OrderLine,
  type PaymentMethod,
} from "./checkout";
import { fulfillmentForOrderStatus, isFulfillment, type Fulfillment } from "./fulfillment";
import { quoteAndReserve, StockError } from "./inventory";
import { buildInvoiceView, type InvoiceView } from "./invoice-view";
import { renderInvoicePdf } from "./invoice-pdf.server";
import {
  formatFiscalInvoiceNumber,
  formatOrderCode,
  nepalFiscalYear,
  paisaToDecimal,
} from "./money";
import type { OrderLookupResult, PlaceOrderResult, PublicOrder } from "./order-types";
import { decideCapture } from "./payments/capture";
import { buildEsewaForm } from "./payments/esewa";
import {
  checkEsewa,
  checkFonepay,
  createFonepayQr,
  initiateKhalti,
  lookupKhalti,
  type ProviderCheck,
} from "./payments/gateway.server";
import { KHALTI_MIN_PAISA } from "./payments/khalti";
import { esewaEnv, getPublicShopConfig, khaltiEnv, sellerFromEnv } from "./shop.server";
import { SITE } from "./site";

const PHONE_COOKIE = "baato_phone";
const ORDER_COOKIE = "baato_order";
const NOT_FOUND = "Order not found. Check the code and the mobile number used at checkout.";

type OrderRow = {
  id: string;
  code: string;
  fulfillment: string | null;
  status: PublicOrder["status"];
  payment_method: PaymentMethod;
  payment_status: PublicOrder["paymentStatus"];
  customer_name: string;
  phone: string;
  address: string;
  zone: PublicOrder["zone"];
  buyer_pan: string | null;
  subtotal_paisa: number;
  shipping_paisa: number;
  taxable_paisa: number;
  vat_paisa: number;
  total_paisa: number;
  lines: unknown;
  created_at: unknown;
  paid_at: unknown;
};

type PaymentRow = {
  id: string;
  order_id: string;
  provider: string;
  provider_ref: string;
  amount_paisa: number;
  status: string;
  raw: unknown;
};

type InvoiceRow = {
  id: string;
  order_id: string;
  invoice_number: string;
  fiscal_year: string;
  kind: "proforma" | "tax";
  seller_name: string;
  seller_address: string;
  seller_pan: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_pan: string | null;
  taxable_paisa: number;
  vat_paisa: number;
  shipping_paisa: number;
  total_paisa: number;
  payment_method: string;
  payment_status: string;
  issued_at: unknown;
};

type RawPayment = {
  action?: string;
  fields?: Record<string, string>;
  totalAmount?: string;
  paymentUrl?: string;
  expiresAt?: string | null;
  qrMessage?: string;
  websocketUrl?: string | null;
};

export type OrderPageData =
  { needsPhone: true; code: string } | { needsPhone: false; order: PublicOrder };

function suffix(length = 8): string {
  return randomBytes(8).toString("hex").slice(0, length);
}

function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) throw new Error("Expected a number from the database");
  return n;
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const parsed = new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function asLines(value: unknown): OrderLine[] {
  const source = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
  if (!Array.isArray(source)) return [];
  return source as OrderLine[];
}

function asRaw(value: unknown): RawPayment {
  const source = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
  if (!source || typeof source !== "object") return {};
  return source as RawPayment;
}

function requestOrigin(): string {
  const configured = process.env.APP_ORIGIN?.trim();
  if (configured) return configured.replace(/\/$/, "");
  try {
    const request = getRequest();
    const url = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") ?? url.host;
    const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
    return `${proto}://${host}`;
  } catch {
    return SITE.url;
  }
}

function rememberCustomer(phone: string, code: string) {
  const secure = requestOrigin().startsWith("https://");
  const options = {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax" as const,
    httpOnly: true,
    secure,
  };
  setCookie(PHONE_COOKIE, phone, options);
  setCookie(ORDER_COOKIE, code, options);
}

function phonesMatch(stored: string, given: string): boolean {
  const a = Buffer.from(stored);
  const b = Buffer.from(given);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function qrSvg(message: string): Promise<string | null> {
  const QRCode = await import("qrcode");
  const svg = await QRCode.toString(message, {
    type: "svg",
    margin: 1,
    width: 280,
    errorCorrectionLevel: "M",
  });
  if (!svg.trimStart().startsWith("<svg")) return null;
  return svg;
}

async function toPublic(sql: Sql, order: OrderRow): Promise<PublicOrder> {
  const invoices = await sql<InvoiceRow>`select * from invoices where order_id = ${order.id}`;
  const invoice =
    invoices.find((row) => row.kind === "tax") ??
    invoices.find((row) => row.kind === "proforma") ??
    null;
  const payments = await sql<PaymentRow>`
    select * from payments where order_id = ${order.id} order by created_at desc limit 1
  `;
  const raw = payments[0] ? asRaw(payments[0].raw) : {};
  const qr = raw.qrMessage ? await qrSvg(raw.qrMessage) : null;
  const socket =
    raw.websocketUrl && raw.websocketUrl.startsWith("wss://") ? raw.websocketUrl : null;
  const fulfillment: Fulfillment = isFulfillment(order.fulfillment)
    ? order.fulfillment
    : fulfillmentForOrderStatus(order.status);
  return {
    code: order.code,
    fulfillment,
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
    taxablePaisa: asNumber(order.taxable_paisa),
    vatPaisa: asNumber(order.vat_paisa),
    totalPaisa: asNumber(order.total_paisa),
    lines: asLines(order.lines),
    createdAt: asDate(order.created_at).toISOString(),
    paidAt: order.paid_at ? asDate(order.paid_at).toISOString() : null,
    invoice: invoice ? { number: invoice.invoice_number, kind: invoice.kind } : null,
    fonepayQrSvg: qr,
    fonepaySocketUrl: socket,
    khaltiUrl: raw.paymentUrl ?? null,
    esewa: raw.action && raw.fields ? { action: raw.action, fields: raw.fields } : null,
  };
}

async function orderByCode(sql: Sql, code: string): Promise<OrderRow | null> {
  if (!/^BT-\d+$/.test(code)) return null;
  const rows = await sql<OrderRow>`select * from orders where code = ${code}`;
  return rows[0] ?? null;
}

async function publicIfMatch(code: string, phone: string): Promise<PublicOrder | null> {
  const sql = await getSql();
  const order = await orderByCode(sql, code);
  if (!order || !phonesMatch(order.phone, phone)) return null;
  return toPublic(sql, order);
}

async function nextOrderCode(sql: Sql): Promise<string> {
  const rows = await sql<{ last_number: number }>`
    update order_counter set last_number = last_number + 1 where id = 1 returning last_number
  `;
  const sequence = asNumber(rows[0]?.last_number);
  if (!sequence) throw new Error("Order counter is missing");
  return formatOrderCode(sequence);
}

async function insertOrder(
  sql: Sql,
  input: {
    id: string;
    code: string;
    status: PublicOrder["status"];
    paymentMethod: PaymentMethod;
    paymentStatus: PublicOrder["paymentStatus"];
    name: string;
    phone: string;
    address: string;
    zone: PublicOrder["zone"];
    pan: string | null;
    quote: Extract<ReturnType<typeof quoteLines>, { ok: true }>;
  },
) {
  await sql`
    insert into orders (
      id, code, status, fulfillment, payment_method, payment_status, customer_name, phone, address, zone, buyer_pan,
      subtotal_paisa, shipping_paisa, taxable_paisa, vat_paisa, total_paisa, lines
    ) values (
      ${input.id}, ${input.code}, ${input.status}, ${fulfillmentForOrderStatus(input.status)},
      ${input.paymentMethod}, ${input.paymentStatus},
      ${input.name}, ${input.phone}, ${input.address}, ${input.zone}, ${input.pan},
      ${input.quote.subtotalPaisa}, ${input.quote.shippingPaisa}, ${input.quote.taxablePaisa},
      ${input.quote.vatPaisa}, ${input.quote.totalPaisa}, ${JSON.stringify(input.quote.lines)}::jsonb
    )
  `;
}

async function issueInvoice(sql: Sql, order: OrderRow, kind: "proforma" | "tax"): Promise<void> {
  const existing =
    await sql`select id from invoices where order_id = ${order.id} and kind = ${kind}`;
  if (existing[0]) return;
  const fiscalYear = nepalFiscalYear(new Date());
  let invoiceNumber = `PF-${order.code}`;
  if (kind === "tax") {
    await sql`
      insert into invoice_counters (fiscal_year, last_number) values (${fiscalYear}, 0)
      on conflict (fiscal_year) do nothing
    `;
    const bumped = await sql<{ last_number: number }>`
      update invoice_counters set last_number = last_number + 1
      where fiscal_year = ${fiscalYear}
      returning last_number
    `;
    invoiceNumber = formatFiscalInvoiceNumber(fiscalYear, asNumber(bumped[0]?.last_number));
  }
  const seller = sellerFromEnv();
  await sql`
    insert into invoices (
      id, order_id, invoice_number, fiscal_year, kind,
      seller_name, seller_address, seller_pan,
      buyer_name, buyer_phone, buyer_address, buyer_pan,
      taxable_paisa, vat_paisa, shipping_paisa, total_paisa,
      payment_method, payment_status
    ) values (
      ${randomUUID()}, ${order.id}, ${invoiceNumber}, ${fiscalYear}, ${kind},
      ${seller.legalName}, ${seller.address}, ${seller.pan},
      ${order.customer_name}, ${order.phone}, ${order.address}, ${order.buyer_pan},
      ${asNumber(order.taxable_paisa)}, ${asNumber(order.vat_paisa)}, ${asNumber(order.shipping_paisa)},
      ${asNumber(order.total_paisa)}, ${order.payment_method}, ${kind === "tax" ? "paid" : order.payment_status}
    )
    on conflict (order_id, kind) do nothing
  `;
}

function methodEnabled(method: PaymentMethod): boolean {
  const config = getPublicShopConfig();
  return config.methods[method];
}

export async function placeOrderRecord(input: unknown): Promise<PlaceOrderResult> {
  const parsed = parseCheckoutInput(input);
  if (!parsed.ok) return parsed;
  const value = parsed.value;
  if (!methodEnabled(value.method)) {
    return {
      ok: false,
      error: "That payment method is not switched on yet. Cash on delivery is available.",
    };
  }
  const id = randomUUID();
  const isCod = value.method === "cod";
  let code: string;
  let quote: Extract<ReturnType<typeof quoteLines>, { ok: true }>;
  try {
    const placed = await withTransaction(async (sql) => {
      const reserved = await quoteAndReserve(sql, value.lines, value.zone);
      if (value.method === "khalti" && reserved.totalPaisa < KHALTI_MIN_PAISA) {
        throw new StockError("Khalti requires a total of at least NPR 10.");
      }
      const next = await nextOrderCode(sql);
      await insertOrder(sql, {
        id,
        code: next,
        status: isCod ? "cod_confirmed" : "pending_payment",
        paymentMethod: value.method,
        paymentStatus: isCod ? "unpaid" : "pending",
        name: value.name,
        phone: value.phone,
        address: value.address,
        zone: value.zone,
        pan: value.pan,
        quote: reserved,
      });
      if (isCod) {
        const row = await sql<OrderRow>`select * from orders where id = ${id}`;
        await sql`
          insert into payments (id, order_id, provider, provider_ref, amount_paisa, status)
          values (${randomUUID()}, ${id}, 'cod', ${next}, ${reserved.totalPaisa}, 'initiated')
        `;
        if (row[0]) await issueInvoice(sql, row[0], "proforma");
      }
      return { code: next, quote: reserved };
    });
    code = placed.code;
    quote = placed.quote;
  } catch (err) {
    if (err instanceof StockError) return { ok: false, error: err.message };
    throw err;
  }

  rememberCustomer(value.phone, code);

  if (value.method === "cod") {
    const order = await publicIfMatch(code, value.phone);
    if (!order) return { ok: false, error: "The order was saved but could not be read back." };
    return { ok: true, order };
  }

  try {
    if (value.method === "esewa") await startEsewa(id, code, quote);
    if (value.method === "khalti") await startKhalti(id, code, quote, value.name, value.phone);
    if (value.method === "fonepay") await startFonepay(id, code, quote);
  } catch (err) {
    const order = await publicIfMatch(code, value.phone);
    if (!order) return { ok: false, error: "The order was saved but the payment could not start." };
    return {
      ok: true,
      order,
      warning:
        err instanceof Error
          ? err.message
          : "The payment could not start. You can try again from the order page.",
    };
  }

  const order = await publicIfMatch(code, value.phone);
  if (!order) return { ok: false, error: "The order was saved but could not be read back." };
  return { ok: true, order };
}

async function startEsewa(
  orderId: string,
  code: string,
  quote: Extract<ReturnType<typeof quoteLines>, { ok: true }>,
) {
  const env = esewaEnv();
  if (!env.enabled) throw new Error("eSewa is not configured.");
  const origin = requestOrigin();
  const transactionUuid = `${code}-${suffix(6)}`;
  const form = buildEsewaForm({
    productCode: env.productCode,
    secret: env.secret,
    formUrl: env.formUrl,
    transactionUuid,
    totalAmount: paisaToDecimal(quote.totalPaisa),
    amount: paisaToDecimal(quote.taxablePaisa),
    taxAmount: paisaToDecimal(quote.vatPaisa),
    successUrl: `${origin}/api/payments/esewa`,
    failureUrl: `${origin}/api/payments/esewa?outcome=failure`,
  });
  const sql = await getSql();
  await sql`
    insert into payments (id, order_id, provider, provider_ref, amount_paisa, status, raw)
    values (
      ${randomUUID()}, ${orderId}, 'esewa', ${transactionUuid}, ${quote.totalPaisa}, 'initiated',
      ${JSON.stringify({ action: form.action, fields: form.fields, totalAmount: form.fields.total_amount })}::jsonb
    )
  `;
}

async function startKhalti(
  orderId: string,
  code: string,
  quote: Extract<ReturnType<typeof quoteLines>, { ok: true }>,
  name: string,
  phone: string,
) {
  const origin = requestOrigin();
  const started = await initiateKhalti({
    amountPaisa: quote.totalPaisa,
    purchaseOrderId: `${code}-${suffix(4)}`,
    orderCode: code,
    returnUrl: `${origin}/api/payments/khalti`,
    websiteUrl: origin,
    customerName: name,
    customerPhone: phone.slice(3),
  });
  const sql = await getSql();
  await sql`
    insert into payments (id, order_id, provider, provider_ref, amount_paisa, status, raw)
    values (
      ${randomUUID()}, ${orderId}, 'khalti', ${started.pidx}, ${quote.totalPaisa}, 'initiated',
      ${JSON.stringify({ paymentUrl: started.paymentUrl, expiresAt: started.expiresAt })}::jsonb
    )
  `;
}

async function startFonepay(
  orderId: string,
  code: string,
  quote: Extract<ReturnType<typeof quoteLines>, { ok: true }>,
) {
  const prn = `${code}-${suffix(6)}`.slice(0, 25);
  const qr = await createFonepayQr({ amountPaisa: quote.totalPaisa, prn });
  const sql = await getSql();
  await sql`
    insert into payments (id, order_id, provider, provider_ref, amount_paisa, status, raw)
    values (
      ${randomUUID()}, ${orderId}, 'fonepay', ${prn}, ${quote.totalPaisa}, 'initiated',
      ${JSON.stringify({ qrMessage: qr.qrMessage, websocketUrl: qr.websocketUrl, totalAmount: qr.amount })}::jsonb
    )
  `;
}

export async function loadOrderPage(code: string): Promise<OrderPageData> {
  const phone = getCookie(PHONE_COOKIE);
  if (!phone) return { needsPhone: true, code };
  const order = await publicIfMatch(code, phone);
  if (!order) return { needsPhone: true, code };
  return { needsPhone: false, order };
}

export async function lookupOrderRecord(
  code: string,
  phoneInput: string,
): Promise<OrderLookupResult> {
  const phone = normalizeNepalPhone(phoneInput);
  if (!phone) return { ok: false, error: "Enter the Nepal mobile number used at checkout." };
  const order = await publicIfMatch(code.trim(), phone);
  if (!order) return { ok: false, error: NOT_FOUND };
  rememberCustomer(phone, order.code);
  return { ok: true, order };
}

export async function refreshOrderRecord(
  code: string,
  phoneInput: string,
): Promise<OrderLookupResult> {
  const found = await lookupOrderRecord(code, phoneInput);
  if (!found.ok) return found;
  if (found.order.status !== "pending_payment") return found;
  const sql = await getSql();
  const order = await orderByCode(sql, found.order.code);
  if (!order) return { ok: false, error: NOT_FOUND };
  const payments = await sql<PaymentRow>`
    select * from payments
    where order_id = ${order.id} and provider = ${order.payment_method}
    order by created_at desc
    limit 1
  `;
  const payment = payments[0];
  if (payment && payment.provider !== "cod") {
    await verifyProviderRef(payment.provider as PaymentMethod, payment.provider_ref);
  }
  const fresh = await publicIfMatch(order.code, order.phone);
  if (!fresh) return { ok: false, error: NOT_FOUND };
  return { ok: true, order: fresh };
}

export async function resumeOrderPayment(
  code: string,
  phoneInput: string,
): Promise<OrderLookupResult> {
  const found = await lookupOrderRecord(code, phoneInput);
  if (!found.ok) return found;
  if (found.order.status !== "pending_payment") return found;
  const sql = await getSql();
  const order = await orderByCode(sql, found.order.code);
  if (!order) return { ok: false, error: NOT_FOUND };
  const open = await sql<PaymentRow>`
    select * from payments
    where order_id = ${order.id} and provider = ${order.payment_method} and status = 'initiated'
    order by created_at desc
    limit 1
  `;
  const raw = open[0] ? asRaw(open[0].raw) : {};
  const expired = raw.expiresAt ? Date.parse(raw.expiresAt) < Date.now() : false;
  const reusable = open[0] && !expired && (raw.qrMessage || raw.paymentUrl || raw.fields);
  if (!reusable) {
    const quote = {
      ok: true as const,
      lines: asLines(order.lines),
      subtotalPaisa: asNumber(order.subtotal_paisa),
      shippingPaisa: asNumber(order.shipping_paisa),
      taxablePaisa: asNumber(order.taxable_paisa),
      vatPaisa: asNumber(order.vat_paisa),
      totalPaisa: asNumber(order.total_paisa),
    };
    try {
      if (order.payment_method === "esewa") await startEsewa(order.id, order.code, quote);
      if (order.payment_method === "khalti") {
        await startKhalti(order.id, order.code, quote, order.customer_name, order.phone);
      }
      if (order.payment_method === "fonepay") await startFonepay(order.id, order.code, quote);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "The payment could not be restarted.",
      };
    }
  }
  const fresh = await publicIfMatch(order.code, order.phone);
  if (!fresh) return { ok: false, error: NOT_FOUND };
  return { ok: true, order: fresh };
}

async function providerCheck(payment: PaymentRow, order: OrderRow): Promise<ProviderCheck> {
  const raw = asRaw(payment.raw);
  if (payment.provider === "esewa") {
    return checkEsewa({
      transactionUuid: payment.provider_ref,
      totalAmount: raw.totalAmount || paisaToDecimal(asNumber(order.total_paisa)),
    });
  }
  if (payment.provider === "khalti") return lookupKhalti(payment.provider_ref);
  if (payment.provider === "fonepay") {
    const checked = await checkFonepay({
      prn: payment.provider_ref,
      storedAmountPaisa: asNumber(payment.amount_paisa),
    });
    if (asNumber(payment.amount_paisa) !== asNumber(order.total_paisa)) {
      return { ...checked, amountPaisa: null };
    }
    return checked;
  }
  return { outcome: "failed", amountPaisa: null, raw: null };
}

export async function verifyProviderRef(
  provider: string,
  providerRef: string,
): Promise<{ location: string }> {
  const sql = await getSql();
  const payments = await sql<PaymentRow>`
    select * from payments where provider = ${provider} and provider_ref = ${providerRef}
  `;
  const payment = payments[0];
  if (!payment) return { location: "/orders/lookup?result=failed" };
  const orders = await sql<OrderRow>`select * from orders where id = ${payment.order_id}`;
  const order = orders[0];
  if (!order) return { location: "/orders/lookup?result=failed" };

  let check: ProviderCheck;
  try {
    check = await providerCheck(payment, order);
  } catch {
    return { location: `/orders/${order.code}?result=pending` };
  }

  const decision = decideCapture({
    orderStatus: order.status,
    orderTotalPaisa: asNumber(order.total_paisa),
    providerOutcome: check.outcome,
    providerAmountPaisa: check.amountPaisa,
  });

  if (decision.action === "already_paid") return { location: `/orders/${order.code}?result=paid` };
  if (decision.action === "wait") return { location: `/orders/${order.code}?result=pending` };
  if (decision.action === "reject") {
    await sql`
      update payments set status = 'failed', raw = ${JSON.stringify({ ...asRaw(payment.raw), verify: check.raw })}::jsonb
      where id = ${payment.id} and status <> 'captured'
    `;
    return { location: `/orders/${order.code}?result=failed` };
  }

  await withTransaction(async (tx) => {
    const locked = await tx<OrderRow>`select * from orders where id = ${order.id} for update`;
    const current = locked[0];
    if (!current) throw new Error("Order disappeared during capture");
    const again = decideCapture({
      orderStatus: current.status,
      orderTotalPaisa: asNumber(current.total_paisa),
      providerOutcome: "complete",
      providerAmountPaisa: check.amountPaisa,
    });
    if (again.action === "already_paid") return;
    if (again.action !== "capture" || check.amountPaisa == null) {
      throw new Error("Capture was rejected after the order lock");
    }
    await tx`
      insert into payments (id, order_id, provider, provider_ref, amount_paisa, status, raw)
      values (
        ${payment.id}, ${current.id}, ${provider}, ${providerRef}, ${check.amountPaisa}, 'captured',
        ${JSON.stringify({ ...asRaw(payment.raw), verify: check.raw })}::jsonb
      )
      on conflict (provider, provider_ref) do update
      set status = 'captured', amount_paisa = excluded.amount_paisa, raw = excluded.raw
      where payments.order_id = ${current.id}
    `;
    const owner = await tx<{ order_id: string }>`
      select order_id from payments where provider = ${provider} and provider_ref = ${providerRef}
    `;
    if (owner[0]?.order_id !== current.id)
      throw new Error("Payment reference belongs to another order");
    await tx`
      update orders
      set status = 'paid', payment_status = 'paid', paid_at = now(),
          fulfillment = case
            when fulfillment in ('pending', 'confirmed') then 'paid'
            else fulfillment
          end
      where id = ${current.id} and status = 'pending_payment'
    `;
    const paid = await tx<OrderRow>`select * from orders where id = ${current.id}`;
    if (paid[0]?.status === "paid") await issueInvoice(tx, paid[0], "tax");
  });

  return { location: `/orders/${order.code}?result=paid` };
}

export function orderCodeFromCookie(): string | undefined {
  return getCookie(ORDER_COOKIE);
}

export async function settleCodPayment(sql: TaggedSql, orderId: string): Promise<void> {
  await sql`
    update orders
    set status = 'paid', payment_status = 'paid', fulfillment = 'paid', paid_at = coalesce(paid_at, now())
    where id = ${orderId} and payment_method = 'cod' and status = 'cod_confirmed'
  `;
  await sql`
    update payments set status = 'captured'
    where order_id = ${orderId} and provider = 'cod' and status = 'initiated'
  `;
  const paid = await sql<OrderRow>`select * from orders where id = ${orderId}`;
  if (paid[0]?.status === "paid") await issueInvoice(sql as Sql, paid[0], "tax");
}

export async function invoicePdfForCode(
  code: string,
): Promise<{ ok: true; filename: string; base64: string } | { ok: false; error: string }> {
  const sql = await getSql();
  const order = await orderByCode(sql, code.trim());
  if (!order) return { ok: false, error: NOT_FOUND };
  return renderStoredInvoice(sql, order);
}

export async function invoicePdfRecord(
  code: string,
  phoneInput: string,
): Promise<{ ok: true; filename: string; base64: string } | { ok: false; error: string }> {
  const found = await lookupOrderRecord(code, phoneInput);
  if (!found.ok) return found;
  const sql = await getSql();
  const order = await orderByCode(sql, found.order.code);
  if (!order) return { ok: false, error: NOT_FOUND };
  return renderStoredInvoice(sql, order);
}

async function renderStoredInvoice(
  sql: Sql,
  order: OrderRow,
): Promise<{ ok: true; filename: string; base64: string } | { ok: false; error: string }> {
  const invoices = await sql<InvoiceRow>`select * from invoices where order_id = ${order.id}`;
  const invoice =
    invoices.find((row) => row.kind === "tax") ?? invoices.find((row) => row.kind === "proforma");
  if (!invoice) return { ok: false, error: "The bill is not ready yet." };
  const seller = sellerFromEnv();
  const view: InvoiceView = buildInvoiceView({
    kind: invoice.kind,
    invoiceNumber: invoice.invoice_number,
    fiscalYear: invoice.fiscal_year,
    issuedAt: asDate(invoice.issued_at),
    orderCode: order.code,
    sellerName: invoice.seller_name,
    sellerAddress: invoice.seller_address,
    sellerPan: invoice.seller_pan,
    sellerPhone: seller.phone,
    buyerName: invoice.buyer_name,
    buyerPhone: invoice.buyer_phone,
    buyerAddress: invoice.buyer_address,
    zone: order.zone,
    buyerPan: invoice.buyer_pan,
    lines: asLines(order.lines),
    subtotalPaisa: asNumber(order.subtotal_paisa),
    shippingPaisa: asNumber(invoice.shipping_paisa),
    taxablePaisa: asNumber(invoice.taxable_paisa),
    vatPaisa: asNumber(invoice.vat_paisa),
    totalPaisa: asNumber(invoice.total_paisa),
    paymentMethod: order.payment_method,
    paymentStatus: invoice.kind === "tax" ? "paid" : "unpaid — cash on delivery",
  });
  const bytes = await renderInvoicePdf(view);
  return {
    ok: true,
    filename: `${invoice.invoice_number.replaceAll("/", "-")}.pdf`,
    base64: Buffer.from(bytes).toString("base64"),
  };
}

export async function saveInquiry(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = parseInquiry(input);
  if (!parsed.ok) return parsed;
  const sql = await getSql();
  await sql`
    insert into inquiries (id, name, phone, note)
    values (${randomUUID()}, ${parsed.value.name}, ${parsed.value.phone}, ${parsed.value.note})
  `;
  return { ok: true };
}

export function webhookSecretOk(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

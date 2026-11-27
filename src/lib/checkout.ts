import { partBySlug, parts, vehicleName, type Part } from "./catalog.ts";
import { nprToPaisa, splitInclusiveVat } from "./money.ts";

export type DeliveryZone = "valley" | "outside";
export type PaymentMethod = "cod" | "esewa" | "khalti" | "fonepay";

export type OrderLine = {
  slug: string;
  sku: string;
  name: string;
  qty: number;
  unitPaisa: number;
  fitment: string;
};

/** Kathmandu Valley vs the rest of Nepal. Fees are VAT-inclusive shelf amounts. */
export const SHIPPING = {
  valleyFeePaisa: 150_00,
  valleyFreeOverPaisa: 5_000_00,
  outsideFeePaisa: 350_00,
  outsideFreeOverPaisa: 15_000_00,
} as const;

export function shippingPaisa(zone: DeliveryZone, subtotalPaisa: number): number {
  if (zone === "valley") {
    return subtotalPaisa >= SHIPPING.valleyFreeOverPaisa ? 0 : SHIPPING.valleyFeePaisa;
  }
  return subtotalPaisa >= SHIPPING.outsideFreeOverPaisa ? 0 : SHIPPING.outsideFeePaisa;
}

export function shippingBlurb(zone: DeliveryZone): string {
  if (zone === "valley") {
    return "Kathmandu Valley — NPR 150, free from NPR 5,000. In-stock lines placed before 14:00 leave the same day.";
  }
  return "Outside the Valley — NPR 350, free from NPR 15,000. Pokhara, Butwal, and Biratnagar are typically next day. The rest of Nepal is 48–72 hours.";
}

/** Never let a cart line exceed the cage, and never accept a zero or junk qty. */
export function capQty(requested: number, stock: number): number {
  if (!Number.isFinite(requested) || !Number.isFinite(stock)) return 0;
  const qty = Math.floor(requested);
  const available = Math.floor(stock);
  if (qty <= 0 || available <= 0) return 0;
  return Math.min(qty, available);
}

export type PricedPart = {
  slug: string;
  sku: string;
  name: string;
  priceRupees: number;
  stock: number;
  fitment: string;
};

export type Quote =
  | {
      ok: true;
      lines: OrderLine[];
      subtotalPaisa: number;
      shippingPaisa: number;
      taxablePaisa: number;
      vatPaisa: number;
      totalPaisa: number;
    }
  | { ok: false; error: string };

/**
 * Price a cart from the server catalog. The request may only send slug and qty.
 * Any price field on the payload is ignored.
 */
export function quoteLines(
  requested: { slug: string; qty: number }[],
  lookup: (slug: string) => PricedPart | undefined,
  zone: DeliveryZone,
): Quote {
  if (!Array.isArray(requested) || requested.length === 0) {
    return { ok: false, error: "Your dispatch list is empty." };
  }
  if (requested.length > 30) return { ok: false, error: "Too many lines in one dispatch." };

  const lines: OrderLine[] = [];
  for (const row of requested) {
    if (!row || typeof row.slug !== "string") {
      return { ok: false, error: "A line in the dispatch list is invalid." };
    }
    const part = lookup(row.slug);
    if (!part) return { ok: false, error: "A part in your list is no longer stocked." };
    const asked = Math.floor(Number(row.qty));
    if (!Number.isFinite(asked) || asked <= 0) {
      return { ok: false, error: `Quantity for ${part.name} is invalid.` };
    }
    if (part.stock <= 0) return { ok: false, error: `${part.name} is out of stock.` };
    if (asked > part.stock) {
      return { ok: false, error: `Only ${part.stock} of ${part.name} are in the Valley cage.` };
    }
    lines.push({
      slug: part.slug,
      sku: part.sku,
      name: part.name,
      qty: asked,
      unitPaisa: nprToPaisa(part.priceRupees),
      fitment: part.fitment,
    });
  }

  const subtotalPaisa = lines.reduce((sum, line) => sum + line.unitPaisa * line.qty, 0);
  const shipping = shippingPaisa(zone, subtotalPaisa);
  const totalPaisa = subtotalPaisa + shipping;
  const { taxablePaisa, vatPaisa } = splitInclusiveVat(totalPaisa);
  return { ok: true, lines, subtotalPaisa, shippingPaisa: shipping, taxablePaisa, vatPaisa, totalPaisa };
}

export function pricedFromCatalog(slug: string): PricedPart | undefined {
  const part = partBySlug(slug);
  if (!part) return undefined;
  return {
    slug: part.slug,
    sku: part.sku,
    name: part.name,
    priceRupees: part.price,
    stock: part.stock,
    fitment: part.vehicles.map((id) => vehicleName(id)).join(", "),
  };
}

export function partHaystack(part: Part): string {
  return [
    part.name,
    part.sku,
    part.lead,
    part.body,
    part.quality,
    part.category,
    ...part.specs.flatMap((spec) => [spec.label, spec.value]),
    ...part.vehicles.map((id) => vehicleName(id)),
  ]
    .join(" ")
    .toLowerCase();
}

export function catalogHeading(opts: {
  query?: string;
  vehicleName?: string;
  categoryName?: string;
}): string {
  if (opts.vehicleName && opts.categoryName) return `${opts.categoryName} for ${opts.vehicleName}`;
  if (opts.vehicleName) return `Parts for ${opts.vehicleName}`;
  if (opts.categoryName) return opts.categoryName;
  if (opts.query) return `Search: ${opts.query}`;
  return "Full catalog";
}

const PHONE_RE = /^9\d{9}$/;

/** Store Nepal mobiles as 9779XXXXXXXX. Landlines are rejected. */
export function normalizeNepalPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("977")) local = local.slice(3);
  if (local.startsWith("0")) local = local.slice(1);
  if (!PHONE_RE.test(local)) return null;
  return `977${local}`;
}

export function normalizePan(input: string): string | null | "invalid" {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d{9}$/.test(trimmed)) return "invalid";
  return trimmed;
}

export type CheckoutInput = {
  name: string;
  phone: string;
  address: string;
  zone: DeliveryZone;
  pan: string | null;
  method: PaymentMethod;
  lines: { slug: string; qty: number }[];
};

export function parseCheckoutInput(input: unknown): { ok: true; value: CheckoutInput } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Checkout details are missing." };
  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Enter the name to put on the bill (2–80 characters)." };
  }
  const phone = typeof body.phone === "string" ? normalizeNepalPhone(body.phone) : null;
  if (!phone) return { ok: false, error: "Enter a Nepal mobile number, for example 98XXXXXXXX." };
  const address = typeof body.address === "string" ? body.address.trim() : "";
  if (address.length < 8 || address.length > 240) {
    return { ok: false, error: "Enter a delivery address with a landmark (8–240 characters)." };
  }
  if (body.zone !== "valley" && body.zone !== "outside") {
    return { ok: false, error: "Choose Kathmandu Valley or Outside Valley." };
  }
  const pan = typeof body.pan === "string" ? normalizePan(body.pan) : null;
  if (pan === "invalid") return { ok: false, error: "Buyer PAN must be exactly 9 digits, or left blank." };
  if (body.method !== "cod" && body.method !== "esewa" && body.method !== "khalti" && body.method !== "fonepay") {
    return { ok: false, error: "Choose a payment method." };
  }
  if (!Array.isArray(body.lines)) return { ok: false, error: "Your dispatch list is empty." };
  const lines = body.lines.map((line) => {
    const row = line as { slug?: unknown; qty?: unknown };
    return { slug: typeof row.slug === "string" ? row.slug : "", qty: Number(row.qty) };
  });
  return {
    ok: true,
    value: { name, phone, address, zone: body.zone, pan, method: body.method, lines },
  };
}

export function parseInquiry(input: unknown): { ok: true; value: { name: string; phone: string; note: string } } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "The note is missing." };
  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 80) return { ok: false, error: "Enter your name." };
  const phone = typeof body.phone === "string" ? normalizeNepalPhone(body.phone) : null;
  if (!phone) return { ok: false, error: "Enter a Nepal mobile number." };
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length < 10 || note.length > 2000) {
    return { ok: false, error: "Describe the vehicle and the part (10–2000 characters)." };
  }
  return { ok: true, value: { name, phone, note } };
}

export function whatsappHref(e164: string, text: string): string {
  const digits = e164.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function fitmentMessage(partName: string, sku: string): string {
  return `Namaste, I need a fitment check before I order.\nPart: ${partName}\nSKU: ${sku}\nMy vehicle (make, model, year): `;
}

export function orderMessage(code: string): string {
  return `Namaste, this is BAATO order ${code}. I want to confirm dispatch.`;
}

/** Used by tests and the catalog page. */
export function findPart(slug: string): Part | undefined {
  return parts.find((part) => part.slug === slug);
}

import { partBySlug, parts, type Part } from "./catalog.ts";
import { pricedFromCatalog, quoteLines, type DeliveryZone, type Quote } from "./checkout.ts";
import type { TaggedSql } from "./sql-tag.ts";

export type StockOverlay = { stock: number; available: boolean };
export type StockMap = Record<string, StockOverlay>;

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

export function sellableStock(stock: number, available: boolean): number {
  if (!available || !Number.isFinite(stock)) return 0;
  const whole = Math.floor(stock);
  return whole > 0 ? whole : 0;
}

export function withSellableStock(part: Part, row?: StockOverlay): Part {
  if (!row) return part;
  return { ...part, stock: sellableStock(row.stock, row.available) };
}

export function parseStockUpdate(
  input: unknown,
): { ok: true; slug: string; stock: number; available: boolean } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Stock update is missing." };
  const body = input as Record<string, unknown>;
  const slug = typeof body.slug === "string" ? body.slug : "";
  if (!partBySlug(slug)) return { ok: false, error: "That part is not in the catalog." };
  const stock = typeof body.stock === "number" ? body.stock : Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    return { ok: false, error: "Stock must be a whole number from 0 to 100000." };
  }
  if (typeof body.available !== "boolean")
    return { ok: false, error: "Choose whether the part is available." };
  return { ok: true, slug, stock, available: body.available };
}

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

function asStock(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

export async function readStockMap(sql: TaggedSql): Promise<StockMap> {
  const rows = await sql<{ slug: string; stock: unknown; available: unknown }>`
    select slug, stock, available from inventory
  `;
  const map: StockMap = {};
  for (const row of rows)
    map[row.slug] = { stock: asStock(row.stock), available: asBool(row.available) };
  return map;
}

export async function upsertInventory(
  sql: TaggedSql,
  slug: string,
  stock: number,
  available: boolean,
): Promise<void> {
  await sql`
    insert into inventory (slug, stock, available, updated_at)
    values (${slug}, ${stock}, ${available}, now())
    on conflict (slug) do update
    set stock = excluded.stock, available = excluded.available, updated_at = now()
  `;
}

/**
 * Price the cart from catalog plus inventory overrides, then decrement the cage.
 * Caller must run this inside a transaction so a later failure puts the stock back.
 */
export async function quoteAndReserve(
  sql: TaggedSql,
  requested: { slug: string; qty: number }[],
  zone: DeliveryZone,
): Promise<Extract<Quote, { ok: true }>> {
  const slugs = [
    ...new Set(requested.map((row) => row.slug).filter((slug) => typeof slug === "string")),
  ];
  for (const slug of slugs) {
    const part = partBySlug(slug);
    if (!part) continue;
    await sql`
      insert into inventory (slug, stock, available)
      values (${slug}, ${part.stock}, true)
      on conflict (slug) do nothing
    `;
    await sql`select slug from inventory where slug = ${slug} for update`;
  }
  const map = await readStockMap(sql);
  const quote = quoteLines(
    requested,
    (slug) => {
      const base = pricedFromCatalog(slug);
      if (!base) return undefined;
      const row = map[slug];
      if (!row) return base;
      return { ...base, stock: sellableStock(row.stock, row.available) };
    },
    zone,
  );
  if (!quote.ok) throw new StockError(quote.error);
  for (const line of quote.lines) {
    const updated = await sql<{ stock: unknown }>`
      update inventory
      set stock = stock - ${line.qty}, updated_at = now()
      where slug = ${line.slug} and available = true and stock >= ${line.qty}
      returning stock
    `;
    if (!updated[0]) throw new StockError(`${line.name} is out of stock.`);
  }
  return quote;
}

export type InventoryLine = {
  slug: string;
  sku: string;
  name: string;
  category: string;
  vehicles: string[];
  catalogStock: number;
  stock: number;
  available: boolean;
  sellable: number;
};

export function inventoryLines(map: StockMap): InventoryLine[] {
  return parts.map((part) => {
    const row = map[part.slug];
    const stock = row ? row.stock : part.stock;
    const available = row ? row.available : part.stock > 0;
    return {
      slug: part.slug,
      sku: part.sku,
      name: part.name,
      category: part.category,
      vehicles: part.vehicles,
      catalogStock: part.stock,
      stock,
      available,
      sellable: sellableStock(stock, available),
    };
  });
}

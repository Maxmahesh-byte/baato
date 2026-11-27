import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { applyFulfillmentUpdate, listAdminOrders } from "./admin-store.ts";
import {
  parseStockUpdate,
  quoteAndReserve,
  sellableStock,
  StockError,
  upsertInventory,
} from "./inventory.ts";
import { splitInclusiveVat } from "./money.ts";
import type { TaggedSql } from "./sql-tag.ts";

function wrap(db: {
  query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
}): TaggedSql {
  return (async <T>(strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    const result = await db.query(text, values);
    return result.rows as T[];
  }) as TaggedSql;
}

describe("desk status and stock", () => {
  it("updates fulfillment and makes checkout honor the cage", async () => {
    const pg = new PGlite();
    const orders = readFileSync(
      new URL("../../migrations/0002_orders.sql", import.meta.url),
      "utf8",
    );
    const desk = readFileSync(
      new URL("../../migrations/0003_fulfillment_inventory.sql", import.meta.url),
      "utf8",
    );
    await pg.exec(orders);
    await pg.exec(desk);

    const total = 151000;
    const split = splitInclusiveVat(total);
    await pg.query(
      `insert into orders (
        id, code, status, fulfillment, payment_method, payment_status, customer_name, phone, address, zone,
        subtotal_paisa, shipping_paisa, taxable_paisa, vat_paisa, total_paisa, lines
      ) values ($1,$2,'cod_confirmed','confirmed','cod','unpaid',$3,$4,$5,'valley',$6,$7,$8,$9,$10,'[]'::jsonb)`,
      [
        "ord-1",
        "BT-1001",
        "Sita",
        "9779801234567",
        "Kalimati chowk",
        136000,
        15000,
        split.taxablePaisa,
        split.vatPaisa,
        total,
      ],
    );
    await pg.query(
      `insert into orders (
        id, code, status, fulfillment, payment_method, payment_status, customer_name, phone, address, zone,
        subtotal_paisa, shipping_paisa, taxable_paisa, vat_paisa, total_paisa, lines
      ) values ($1,$2,'pending_payment','pending','esewa','pending',$3,$4,$5,'outside',$6,$7,$8,$9,$10,'[]'::jsonb)`,
      [
        "ord-2",
        "BT-1002",
        "Ram",
        "9779811111111",
        "Pokhara lakeside",
        136000,
        15000,
        split.taxablePaisa,
        split.vatPaisa,
        total,
      ],
    );

    const byPhone = await listAdminOrders(wrap(pg), { status: "", query: "9801234567" });
    assert.deepEqual(
      byPhone.map((order) => order.code),
      ["BT-1001"],
    );
    const byCode = await listAdminOrders(wrap(pg), { status: "pending", query: "BT-1002" });
    assert.equal(byCode.length, 1);
    assert.equal(byCode[0].fulfillment, "pending");

    await pg.transaction(async (tx) => {
      const moved = await applyFulfillmentUpdate(wrap(tx), "BT-1001", "dispatched", async () => {
        throw new Error("dispatch should not settle payment");
      });
      assert.equal(moved.ok, true);
    });
    const dispatched = await pg.query<{ fulfillment: string }>(
      "select fulfillment from orders where code = 'BT-1001'",
    );
    assert.equal(dispatched.rows[0].fulfillment, "dispatched");

    await pg.transaction(async (tx) => {
      const skipped = await applyFulfillmentUpdate(
        wrap(tx),
        "BT-1002",
        "delivered",
        async () => undefined,
      );
      assert.equal(skipped.ok, false);
    });

    await pg.transaction(async (tx) => {
      const cancelled = await applyFulfillmentUpdate(
        wrap(tx),
        "BT-1002",
        "cancelled",
        async () => undefined,
      );
      assert.equal(cancelled.ok, true);
    });
    const cancelled = await pg.query<{
      status: string;
      fulfillment: string;
      payment_status: string;
    }>("select status, fulfillment, payment_status from orders where code = 'BT-1002'");
    assert.equal(cancelled.rows[0].fulfillment, "cancelled");
    assert.equal(cancelled.rows[0].status, "cancelled");
    assert.equal(cancelled.rows[0].payment_status, "failed");

    await pg.transaction(async (tx) => {
      const paid = await applyFulfillmentUpdate(wrap(tx), "BT-1001", "paid", async () => {
        throw new Error("a dispatched order is not marked paid");
      });
      assert.equal(paid.ok, false);
    });

    const parsed = parseStockUpdate({ slug: "pulsar-150-front-pads", stock: 2, available: true });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    await upsertInventory(wrap(pg), parsed.slug, parsed.stock, parsed.available);
    await pg.transaction(async (tx) => {
      const quote = await quoteAndReserve(wrap(tx), [{ slug: parsed.slug, qty: 2 }], "valley");
      assert.equal(quote.lines[0].qty, 2);
    });
    const left = await pg.query<{ stock: number }>(
      "select stock from inventory where slug = 'pulsar-150-front-pads'",
    );
    assert.equal(Number(left.rows[0].stock), 0);

    await upsertInventory(wrap(pg), "pulsar-150-front-pads", 8, false);
    assert.equal(sellableStock(8, false), 0);
    await assert.rejects(
      () =>
        pg.transaction(async (tx) =>
          quoteAndReserve(wrap(tx), [{ slug: "pulsar-150-front-pads", qty: 1 }], "valley"),
        ),
      (err: unknown) => err instanceof StockError && /out of stock/i.test(err.message),
    );
    const held = await pg.query<{ stock: number; available: boolean }>(
      "select stock, available from inventory where slug = 'pulsar-150-front-pads'",
    );
    assert.equal(Number(held.rows[0].stock), 8);
    assert.equal(held.rows[0].available, false);

    await pg.close();
  });
});

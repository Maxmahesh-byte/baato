import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { formatFiscalInvoiceNumber, splitInclusiveVat } from "./money.ts";

describe("orders migration", () => {
  it("allocates order codes and fiscal invoice numbers without gaps in one transaction", async () => {
    const pg = new PGlite();
    const sql = readFileSync(new URL("../../migrations/0002_orders.sql", import.meta.url), "utf8");
    await pg.exec(sql);

    const first = await pg.query<{ last_number: number }>(
      "update order_counter set last_number = last_number + 1 where id = 1 returning last_number",
    );
    const second = await pg.query<{ last_number: number }>(
      "update order_counter set last_number = last_number + 1 where id = 1 returning last_number",
    );
    assert.equal(first.rows[0].last_number, 1001);
    assert.equal(second.rows[0].last_number, 1002);

    const total = 151000;
    const split = splitInclusiveVat(total);
    await pg.query(
      `insert into orders (
        id, code, status, payment_method, payment_status, customer_name, phone, address, zone,
        subtotal_paisa, shipping_paisa, taxable_paisa, vat_paisa, total_paisa, lines
      ) values ($1,$2,'pending_payment','esewa','pending',$3,$4,$5,'valley',$6,$7,$8,$9,$10,'[]'::jsonb)`,
      ["ord-1", "BT-1001", "Sita", "9779801234567", "Kalimati chowk", 136000, 15000, split.taxablePaisa, split.vatPaisa, total],
    );

    await pg.transaction(async (tx) => {
      await tx.exec(
        "insert into invoice_counters (fiscal_year, last_number) values ('83/84', 0) on conflict (fiscal_year) do nothing",
      );
      const bumped = await tx.query<{ last_number: number }>(
        "update invoice_counters set last_number = last_number + 1 where fiscal_year = '83/84' returning last_number",
      );
      const number = formatFiscalInvoiceNumber("83/84", bumped.rows[0].last_number);
      assert.equal(number, "BT-83/84-000001");
      await tx.query(
        `insert into invoices (
          id, order_id, invoice_number, fiscal_year, kind, seller_name, seller_address, seller_pan,
          buyer_name, buyer_phone, buyer_address, taxable_paisa, vat_paisa, shipping_paisa, total_paisa,
          payment_method, payment_status
        ) values ($1,$2,$3,'83/84','tax','BAATO Parts','Kathmandu','123456789',$4,$5,$6,$7,$8,$9,$10,'esewa','paid')`,
        ["inv-1", "ord-1", number, "Sita", "9779801234567", "Kalimati chowk", split.taxablePaisa, split.vatPaisa, 15000, total],
      );
    });

    const dup = await pg.query<{ last_number: number }>(
      "update invoice_counters set last_number = last_number + 1 where fiscal_year = '83/84' returning last_number",
    );
    assert.equal(formatFiscalInvoiceNumber("83/84", dup.rows[0].last_number), "BT-83/84-000002");
    await pg.close();
  });
});

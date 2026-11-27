import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatFiscalInvoiceNumber,
  formatOrderCode,
  fonepayAmountString,
  nepalFiscalYear,
  nprToPaisa,
  paisaToDecimal,
  parseRupeesToPaisa,
  splitInclusiveVat,
} from "./money.ts";

describe("splitInclusiveVat", () => {
  it("backs 13% VAT out of an inclusive total and rounds to the paisa", () => {
    const total = nprToPaisa(2850);
    const split = splitInclusiveVat(total);
    assert.equal(split.vatPaisa, Math.round((total * 13) / 113));
    assert.equal(split.taxablePaisa + split.vatPaisa, total);
    assert.equal(split.vatPaisa, 32788);
    assert.equal(split.taxablePaisa, 252212);
  });

  it("keeps a zero total at zero", () => {
    assert.deepEqual(splitInclusiveVat(0), { taxablePaisa: 0, vatPaisa: 0 });
  });
});

describe("paisa formatting", () => {
  it("renders gateway decimals without floating point", () => {
    assert.equal(paisaToDecimal(15000), "150.00");
    assert.equal(paisaToDecimal(15050), "150.50");
    assert.equal(fonepayAmountString(1400), "14");
    assert.equal(fonepayAmountString(1450), "14.50");
  });

  it("parses rupee strings back to paisa", () => {
    assert.equal(parseRupeesToPaisa("110"), 11000);
    assert.equal(parseRupeesToPaisa("110.5"), 11050);
    assert.equal(parseRupeesToPaisa(1175), 117500);
    assert.equal(parseRupeesToPaisa("nope"), null);
  });
});

describe("Nepal fiscal year", () => {
  it("uses 16 July Kathmandu as the year boundary", () => {
    assert.equal(nepalFiscalYear(new Date("2026-11-27T06:00:00Z")), "83/84");
    assert.equal(nepalFiscalYear(new Date("2026-01-15T06:00:00Z")), "82/83");
    assert.equal(nepalFiscalYear(new Date("2026-07-15T18:14:00Z")), "82/83");
    assert.equal(nepalFiscalYear(new Date("2026-07-15T18:15:00Z")), "83/84");
  });

  it("formats order codes and invoice numbers", () => {
    assert.equal(formatOrderCode(1001), "BT-1001");
    assert.equal(formatFiscalInvoiceNumber("83/84", 1), "BT-83/84-000001");
  });
});

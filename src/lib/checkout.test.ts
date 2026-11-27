import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  capQty,
  catalogHeading,
  findPart,
  normalizeNepalPhone,
  normalizePan,
  partHaystack,
  quoteLines,
  shippingPaisa,
  type PricedPart,
} from "./checkout.ts";

const pad: PricedPart = {
  slug: "pads",
  sku: "BT-BR-1",
  name: "Front pads",
  priceRupees: 680,
  stock: 4,
  fitment: "Bajaj Pulsar 150",
};

describe("capQty", () => {
  it("caps at stock and rejects empty or junk quantities", () => {
    assert.equal(capQty(5, 4), 4);
    assert.equal(capQty(2, 4), 2);
    assert.equal(capQty(99, 0), 0);
    assert.equal(capQty(0, 10), 0);
    assert.equal(capQty(1.9, 10), 1);
    assert.equal(capQty(Number.NaN, 10), 0);
  });
});

describe("quoteLines", () => {
  it("prices from the catalog snapshot and ignores any client price", () => {
    const quote = quoteLines([{ slug: "pads", qty: 2 }], () => pad, "valley");
    assert.equal(quote.ok, true);
    if (!quote.ok) return;
    assert.equal(quote.lines[0].unitPaisa, 68000);
    assert.equal(quote.subtotalPaisa, 136000);
    assert.equal(quote.shippingPaisa, 15000);
    assert.equal(quote.totalPaisa, quote.taxablePaisa + quote.vatPaisa);
    assert.equal(quote.totalPaisa, 151000);
  });

  it("refuses a quantity above the cage", () => {
    const quote = quoteLines([{ slug: "pads", qty: 5 }], () => pad, "valley");
    assert.deepEqual(quote, { ok: false, error: "Only 4 of Front pads are in the Valley cage." });
  });

  it("drops the Valley fee at NPR 5,000 and the outside fee at NPR 15,000", () => {
    assert.equal(shippingPaisa("valley", 499_900), 15_000);
    assert.equal(shippingPaisa("valley", 500_000), 0);
    assert.equal(shippingPaisa("outside", 1_499_900), 35_000);
    assert.equal(shippingPaisa("outside", 1_500_000), 0);
  });
});

describe("catalog search and headings", () => {
  it("matches spec text that is not in the product title", () => {
    const part = findPart("alto-oil-filter");
    assert.ok(part);
    const haystack = partHaystack(part);
    assert.equal(haystack.includes("3/4-16 unf"), true);
    assert.equal(part.name.toLowerCase().includes("3/4-16"), false);
  });

  it("keeps both the vehicle and the category in the heading", () => {
    assert.equal(
      catalogHeading({ vehicleName: "Bajaj Pulsar 150", categoryName: "Brakes" }),
      "Brakes for Bajaj Pulsar 150",
    );
    assert.equal(catalogHeading({ vehicleName: "Honda Shine" }), "Parts for Honda Shine");
    assert.equal(catalogHeading({}), "Full catalog");
  });
});

describe("Nepal phone and PAN", () => {
  it("normalizes mobiles and rejects landlines", () => {
    assert.equal(normalizeNepalPhone("9801234567"), "9779801234567");
    assert.equal(normalizeNepalPhone("+977 980-123-4567"), "9779801234567");
    assert.equal(normalizeNepalPhone("01-5900000"), null);
  });

  it("accepts a 9-digit PAN and allows it to be blank", () => {
    assert.equal(normalizePan(""), null);
    assert.equal(normalizePan("123456789"), "123456789");
    assert.equal(normalizePan("12345678"), "invalid");
  });
});

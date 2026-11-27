import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canTransition,
  customerStatusLabel,
  fulfillmentForOrderStatus,
  orderMatches,
} from "./fulfillment.ts";

describe("fulfillment transitions", () => {
  it("walks an order forward and allows cancel", () => {
    assert.equal(canTransition("pending", "confirmed"), true);
    assert.equal(canTransition("confirmed", "paid"), true);
    assert.equal(canTransition("confirmed", "dispatched"), true);
    assert.equal(canTransition("paid", "dispatched"), true);
    assert.equal(canTransition("dispatched", "delivered"), true);
    assert.equal(canTransition("confirmed", "cancelled"), true);
  });

  it("refuses skips and moves off a finished order", () => {
    assert.equal(canTransition("pending", "dispatched"), false);
    assert.equal(canTransition("confirmed", "delivered"), false);
    assert.equal(canTransition("delivered", "dispatched"), false);
    assert.equal(canTransition("cancelled", "confirmed"), false);
    assert.equal(canTransition("paid", "confirmed"), false);
  });

  it("maps new orders and customer labels", () => {
    assert.equal(fulfillmentForOrderStatus("cod_confirmed"), "confirmed");
    assert.equal(fulfillmentForOrderStatus("pending_payment"), "pending");
    assert.equal(customerStatusLabel("cod_confirmed", "dispatched"), "Dispatched");
    assert.equal(customerStatusLabel("paid", "delivered"), "Delivered");
    assert.equal(customerStatusLabel("pending_payment", "pending"), "Waiting for payment");
  });
});

describe("order search", () => {
  const order = { code: "BT-1001", phone: "9779801234567", fulfillment: "confirmed" };

  it("matches the order code or the customer mobile", () => {
    assert.equal(orderMatches(order, "all", ""), true);
    assert.equal(orderMatches(order, "confirmed", "bt-1001"), true);
    assert.equal(orderMatches(order, "paid", "BT-1001"), false);
    assert.equal(orderMatches(order, "", "9801234567"), true);
    assert.equal(orderMatches(order, "", "9779801234567"), true);
    assert.equal(orderMatches(order, "", "9811111111"), false);
  });
});

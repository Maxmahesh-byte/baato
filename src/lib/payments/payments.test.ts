import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideCapture } from "./capture.ts";
import { ESEWA_SIGNED_FIELD_NAMES, classifyEsewaStatus, esewaSign, esewaVerify, parseEsewaDataParam } from "./esewa.ts";
import { classifyFonepayStatus, fonepayQrSignature, fonepayStatusSignature } from "./fonepay.ts";
import { classifyKhaltiStatus } from "./khalti.ts";

const ESEWA_SECRET = "8gBm/:&EnhH.1/q";

describe("eSewa signature", () => {
  it("signs the documented message with HMAC-SHA256 base64", () => {
    // eSewa's HTML sample prints a different digest for this same message.
    // Node's HMAC of `total_amount=100,transaction_uuid=11-201-13,product_code=EPAYTEST`
    // with the published UAT secret is the value pinned here.
    const fields = {
      total_amount: "100",
      transaction_uuid: "11-201-13",
      product_code: "EPAYTEST",
    };
    assert.equal(
      esewaSign(fields, ESEWA_SECRET, ESEWA_SIGNED_FIELD_NAMES),
      "5DZywcrTKD0gia/rsSMcrRHmJl+4Tbol6S+lWgdJ94E=",
    );
  });

  it("verifies a callback signature and rejects a tampered amount", () => {
    const fields = {
      transaction_code: "000AWEO",
      status: "COMPLETE",
      total_amount: "110",
      transaction_uuid: "11-201-13",
      product_code: "EPAYTEST",
      signed_field_names: "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
    };
    const signature = esewaSign(fields, ESEWA_SECRET, fields.signed_field_names);
    assert.equal(esewaVerify(fields, signature, ESEWA_SECRET, fields.signed_field_names), true);
    assert.equal(
      esewaVerify({ ...fields, total_amount: "10" }, signature, ESEWA_SECRET, fields.signed_field_names),
      false,
    );
  });

  it("decodes the base64 data parameter", () => {
    const payload = Buffer.from(JSON.stringify({ transaction_uuid: "BT-1001-ab12", status: "COMPLETE" })).toString(
      "base64",
    );
    assert.equal(parseEsewaDataParam(payload)?.transaction_uuid, "BT-1001-ab12");
    assert.equal(parseEsewaDataParam("%%%"), null);
  });

  it("treats only COMPLETE as paid", () => {
    assert.equal(classifyEsewaStatus("COMPLETE"), "complete");
    assert.equal(classifyEsewaStatus("PENDING"), "pending");
    assert.equal(classifyEsewaStatus("AMBIGUOUS"), "pending");
    assert.equal(classifyEsewaStatus("CANCELED"), "failed");
  });
});

describe("Khalti and Fonepay status", () => {
  it("captures Khalti only on Completed", () => {
    assert.equal(classifyKhaltiStatus("Completed"), "complete");
    assert.equal(classifyKhaltiStatus("Pending"), "pending");
    assert.equal(classifyKhaltiStatus("User canceled"), "failed");
  });

  it("matches the Fonepay HMAC-SHA512 QR example", () => {
    const secret = "a7e3512f5032480a83137793cb2021dc";
    assert.equal(
      fonepayQrSignature({
        secret,
        amount: "14",
        prn: "5d76d323-d1f6",
        merchantCode: "NBQM",
        remarks1: "test1",
        remarks2: "test2",
      }),
      "5ae718032328ae5615fa4694dfbf3ecd13432bd49031e7285a3f8bc122ecbb8e833e83c7a11f895d30f3e8fd1906317aece113675166ae0d804ecf32a8bbdbaf",
    );
    // Same HMAC as the QR example. The PDF's printed status digest does not match this message.
    assert.equal(
      fonepayStatusSignature(secret, "5d76d323-d1f6-4a388", "NBQM"),
      "09c2f988d3299074af2d576bfeaf629e36fb4413d2a6ce8af0d9a26da06eec795d7444e19bf60bd53707b53439aa825d25b6e65a39fb9687fec88da15f218a8c",
    );
  });

  it("maps Fonepay paymentStatus", () => {
    assert.equal(classifyFonepayStatus("success"), "complete");
    assert.equal(classifyFonepayStatus("pending"), "pending");
    assert.equal(classifyFonepayStatus("failed"), "failed");
  });
});

describe("decideCapture", () => {
  const base = { orderStatus: "pending_payment" as const, orderTotalPaisa: 151000 };

  it("captures once when the provider amount matches", () => {
    assert.deepEqual(
      decideCapture({ ...base, providerOutcome: "complete", providerAmountPaisa: 151000 }),
      { action: "capture" },
    );
  });

  it("is idempotent after the order is paid", () => {
    assert.deepEqual(
      decideCapture({ ...base, orderStatus: "paid", providerOutcome: "complete", providerAmountPaisa: 151000 }),
      { action: "already_paid" },
    );
  });

  it("refuses a mismatched or missing amount and a failed provider", () => {
    assert.equal(
      decideCapture({ ...base, providerOutcome: "complete", providerAmountPaisa: 100 }).action,
      "reject",
    );
    assert.deepEqual(
      decideCapture({ ...base, providerOutcome: "complete", providerAmountPaisa: null }),
      { action: "reject", reason: "amount_missing" },
    );
    assert.deepEqual(
      decideCapture({ ...base, providerOutcome: "failed", providerAmountPaisa: 151000 }),
      { action: "reject", reason: "provider_failed" },
    );
    assert.equal(
      decideCapture({ ...base, providerOutcome: "pending", providerAmountPaisa: 151000 }).action,
      "wait",
    );
    const blocked = decideCapture({
      ...base,
      orderStatus: "cod_confirmed",
      providerOutcome: "complete",
      providerAmountPaisa: 151000,
    });
    assert.equal(blocked.action, "reject");
    if (blocked.action === "reject") assert.equal(blocked.reason, "not_pending");
  });
});

import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  pricedFromCatalog,
  quoteLines,
  shippingBlurb,
  shippingPaisa,
  type DeliveryZone,
  type PaymentMethod,
} from "@/lib/checkout";
import { formatNprFromPaisa } from "@/lib/money";
import { placeOrder } from "@/lib/orders.functions";
import type { PublicShopConfig } from "@/lib/shop-config";
import { submitEsewa } from "./order-panel";

const METHODS: { id: PaymentMethod; label: string; detail: string }[] = [
  { id: "cod", label: "Cash on delivery", detail: "Default in Kathmandu Valley. A proforma bill is ready immediately." },
  { id: "esewa", label: "eSewa", detail: "You return here after paying. The desk checks eSewa before the bill is issued." },
  { id: "khalti", label: "Khalti", detail: "Wallet checkout. The order is paid only after Khalti lookup says Completed." },
  { id: "fonepay", label: "Fonepay QR", detail: "A dynamic QR for this exact amount. Scan it from any Fonepay app." },
];

export function CheckoutForm({
  config,
  lines,
  onPlaced,
}: {
  config: PublicShopConfig;
  lines: { slug: string; qty: number }[];
  onPlaced: () => void;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pan, setPan] = useState("");
  const [zone, setZone] = useState<DeliveryZone>("valley");
  const [method, setMethod] = useState<PaymentMethod>("cod");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => quoteLines(lines, pricedFromCatalog, zone), [lines, zone]);
  const subtotal = preview.ok ? preview.subtotalPaisa : 0;
  const shipping = shippingPaisa(zone, subtotal);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await placeOrder({
      data: { name, phone, address, zone, pan, method, lines },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onPlaced();
    if (result.warning) sessionStorage.setItem("baato-pay-warning", result.warning);
    if (result.order.esewa && !result.warning) {
      submitEsewa(result.order.esewa);
      return;
    }
    if (result.order.khaltiUrl && result.order.paymentMethod === "khalti" && !result.warning) {
      window.location.href = result.order.khaltiUrl;
      return;
    }
    void navigate({ to: "/orders/$code", params: { code: result.order.code }, search: { result: undefined } });
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={(e) => void onSubmit(e)}>
      <label className="grid gap-1 text-sm">
        Name on the bill
        <input required value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl border border-line bg-surface px-3 outline-none focus:border-copper" />
      </label>
      <label className="grid gap-1 text-sm">
        Mobile
        <input required type="tel" inputMode="tel" placeholder="98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl border border-line bg-surface px-3 outline-none focus:border-copper" />
      </label>
      <label className="grid gap-1 text-sm">
        Delivery address and landmark
        <textarea required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-3 outline-none focus:border-copper" />
      </label>
      <fieldset className="grid gap-2">
        <legend className="text-sm">Delivery zone</legend>
        {(["valley", "outside"] as const).map((id) => (
          <label key={id} className={`rounded-2xl border px-4 py-3 text-sm ${zone === id ? "border-copper" : "border-line"}`}>
            <input type="radio" name="zone" className="mr-2" checked={zone === id} onChange={() => setZone(id)} />
            {shippingBlurb(id)}
          </label>
        ))}
      </fieldset>
      <label className="grid gap-1 text-sm">
        Buyer PAN (optional, 9 digits)
        <input inputMode="numeric" value={pan} onChange={(e) => setPan(e.target.value)} className="h-12 rounded-xl border border-line bg-surface px-3 outline-none focus:border-copper" />
      </label>
      <fieldset className="grid gap-2">
        <legend className="text-sm">Payment</legend>
        {METHODS.map((item) => {
          const enabled = config.methods[item.id];
          return (
            <label key={item.id} className={`rounded-2xl border px-4 py-3 text-sm ${!enabled ? "opacity-60" : ""} ${method === item.id ? "border-copper" : "border-line"}`}>
              <input
                type="radio"
                name="method"
                className="mr-2"
                disabled={!enabled}
                checked={method === item.id}
                onChange={() => setMethod(item.id)}
              />
              <span className="font-medium">{item.label}</span>
              <span className="mt-1 block text-muted">
                {enabled ? item.detail : "Not enabled — add the merchant keys and this method will appear."}
              </span>
            </label>
          );
        })}
      </fieldset>
      {preview.ok ? (
        <p className="flex items-center justify-between font-display text-3xl">
          <span>Total</span>
          <span className="tabular-nums">{formatNprFromPaisa(preview.totalPaisa)}</span>
        </p>
      ) : (
        <p className="text-sm text-muted">{preview.error}</p>
      )}
      {!preview.ok ? null : (
        <p className="text-sm text-muted">
          Parts {formatNprFromPaisa(subtotal)} · delivery {formatNprFromPaisa(shipping)}. VAT is included and split on the bill.
          {!config.sellerReady ? " Set SELLER_PAN before you treat these bills as tax invoices." : ""}
        </p>
      )}
      {error ? <p className="text-sm text-copper">{error}</p> : null}
      <button type="submit" disabled={busy || !preview.ok} className="h-12 rounded-full bg-copper text-sm font-medium text-bg disabled:opacity-60">
        {busy ? "Saving the dispatch…" : method === "cod" ? "Place for dispatch" : `Continue with ${METHODS.find((m) => m.id === method)?.label}`}
      </button>
    </form>
  );
}

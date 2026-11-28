import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { orderMessage, shippingBlurb, whatsappHref } from "@/lib/checkout";
import { customerStatusLabel } from "@/lib/fulfillment";
import { downloadInvoice, refreshOrder, resumePayment } from "@/lib/orders.functions";
import type { PublicOrder } from "@/lib/order-types";
import { paymentMethodLabel } from "@/lib/invoice-view";
import { formatNprFromPaisa } from "@/lib/money";

function savePdf(filename: string, base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function OrderPanel({
  order,
  whatsappE164,
  notice,
}: {
  order: PublicOrder;
  whatsappE164: string | null;
  notice?: string;
}) {
  const [current, setCurrent] = useState(order);
  const [error, setError] = useState(notice ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCurrent(order);
  }, [order]);

  useEffect(() => {
    if (current.status !== "pending_payment" || current.paymentMethod !== "fonepay") return;
    const pull = () => {
      void refreshOrder({ data: { code: current.code, phone: current.phone } }).then((next) => {
        if (next.ok) setCurrent(next.order);
      });
    };
    const timer = window.setInterval(pull, 4000);
    let socket: WebSocket | null = null;
    if (current.fonepaySocketUrl) {
      socket = new WebSocket(current.fonepaySocketUrl);
      socket.onmessage = () => pull();
    }
    return () => {
      window.clearInterval(timer);
      socket?.close();
    };
  }, [
    current.code,
    current.phone,
    current.status,
    current.paymentMethod,
    current.fonepaySocketUrl,
  ]);

  async function refresh() {
    setBusy(true);
    setError("");
    const result = await refreshOrder({ data: { code: current.code, phone: current.phone } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrent(result.order);
  }

  async function restart() {
    setBusy(true);
    setError("");
    const result = await resumePayment({ data: { code: current.code, phone: current.phone } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrent(result.order);
    if (result.order.esewa) submitEsewa(result.order.esewa);
    else if (result.order.khaltiUrl) window.location.href = result.order.khaltiUrl;
  }

  async function download() {
    setBusy(true);
    setError("");
    const result = await downloadInvoice({ data: { code: current.code, phone: current.phone } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    savePdf(result.filename, result.base64);
  }

  const statusLabel = customerStatusLabel(current.status, current.fulfillment);

  return (
    <div className="mt-8 grid gap-6">
      {error ? (
        <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm">{error}</p>
      ) : null}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-copper">{current.code}</p>
        <h2 className="mt-2 font-display text-4xl tracking-wide">{statusLabel}</h2>
        <p className="mt-2 text-sm text-muted">
          {paymentMethodLabel(current.paymentMethod)} · {current.customerName} · {current.phone}
        </p>
        <p className="mt-1 text-sm text-muted">{current.address}</p>
        <p className="mt-2 text-sm text-muted">{shippingBlurb(current.zone)}</p>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {current.lines.map((line) => (
          <li key={line.slug} className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="min-w-0">
              <p className="font-medium">{line.name}</p>
              <p className="text-sm text-muted">
                SKU {line.sku} · {line.fitment}
              </p>
              <p className="text-sm text-muted">
                {line.qty} × {formatNprFromPaisa(line.unitPaisa)}
              </p>
            </div>
            <p className="tabular-nums sm:text-right">
              {formatNprFromPaisa(line.unitPaisa * line.qty)}
            </p>
          </li>
        ))}
      </ul>
      <dl className="grid gap-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Parts</dt>
          <dd className="tabular-nums">{formatNprFromPaisa(current.subtotalPaisa)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Delivery</dt>
          <dd className="tabular-nums">{formatNprFromPaisa(current.shippingPaisa)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Taxable value</dt>
          <dd className="tabular-nums">{formatNprFromPaisa(current.taxablePaisa)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">VAT 13%</dt>
          <dd className="tabular-nums">{formatNprFromPaisa(current.vatPaisa)}</dd>
        </div>
        <div className="mt-2 flex justify-between gap-4 font-display text-3xl">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatNprFromPaisa(current.totalPaisa)}</dd>
        </div>
      </dl>
      {current.fonepayQrSvg && current.status === "pending_payment" ? (
        <div className="rounded-2xl border border-line bg-white p-4 text-neutral-900">
          <p className="text-sm font-medium">Scan with any Fonepay app</p>
          <div
            className="mt-3 max-w-[280px]"
            dangerouslySetInnerHTML={{ __html: current.fonepayQrSvg }}
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {current.invoice ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void download()}
            className="h-12 rounded-full bg-copper px-5 text-sm font-medium text-bg"
          >
            {current.invoice.kind === "tax" ? "Download tax invoice" : "Download proforma"}
          </button>
        ) : null}
        {current.status === "pending_payment" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void refresh()}
              className="h-12 rounded-full border border-line px-5 text-sm"
            >
              {busy ? "Checking…" : "I've paid — check status"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void restart()}
              className="h-12 rounded-full border border-line px-5 text-sm"
            >
              Restart payment
            </button>
          </>
        ) : null}
        {whatsappE164 ? (
          <a
            href={whatsappHref(whatsappE164, orderMessage(current.code))}
            className="inline-flex h-12 items-center justify-center rounded-full border border-line px-5 text-sm"
          >
            Order on WhatsApp
          </a>
        ) : null}
        <Link to="/parts" search={{}} className="inline-flex h-12 items-center text-sm text-copper">
          Back to catalog
        </Link>
      </div>
    </div>
  );
}

export function submitEsewa(form: { action: string; fields: Record<string, string> }) {
  const element = document.createElement("form");
  element.method = "POST";
  element.action = form.action;
  for (const [name, value] of Object.entries(form.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    element.appendChild(input);
  }
  document.body.appendChild(element);
  element.submit();
}

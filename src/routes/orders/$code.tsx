import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OrderPanel } from "@/components/order-panel";
import { getShopConfig, loadOrderPageFn, lookupOrder } from "@/lib/orders.functions";
import { abs } from "@/lib/site";

export const Route = createFileRoute("/orders/$code")({
  loader: async ({ params }) => {
    const page = await loadOrderPageFn({ data: { code: params.code } });
    const config = await getShopConfig();
    return { page, config };
  },
  validateSearch: (search: Record<string, unknown>) => ({
    result: search.result === "paid" || search.result === "failed" || search.result === "pending" ? search.result : undefined,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.code} — BAATO` },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: abs(`/orders/${params.code}`) }],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { page, config } = Route.useLoaderData();
  const { result } = Route.useSearch();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(page.needsPhone ? null : page.order);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("baato-pay-warning") ?? "";
    if (!stored) return;
    sessionStorage.removeItem("baato-pay-warning");
    setNotice(stored);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const found = await lookupOrder({ data: { code: page.needsPhone ? page.code : order?.code ?? "", phone } });
    setBusy(false);
    if (!found.ok) {
      setError(found.error);
      return;
    }
    setOrder(found.order);
  }

  const banner =
    notice ||
    (result === "paid"
      ? "Payment confirmed. The tax invoice is ready."
      : result === "failed"
        ? "The payment was not confirmed. You can try again below."
        : result === "pending"
          ? "Still waiting on the provider. Check again in a moment."
          : "");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Dispatch</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">{order ? order.code : page.needsPhone ? page.code : "Order"}</h1>
      {order ? (
        <OrderPanel order={order} whatsappE164={config.whatsappE164} notice={banner} />
      ) : (
        <form className="mt-8 grid max-w-xl gap-4" onSubmit={(e) => void onSubmit(e)}>
          <p className="text-sm text-muted">Enter the mobile number used at checkout to open this dispatch.</p>
          <label className="grid gap-1 text-sm">
            Mobile
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl border border-line bg-surface px-3 outline-none focus:border-copper" />
          </label>
          {error ? <p className="text-sm text-copper">{error}</p> : null}
          {banner ? <p className="text-sm text-muted">{banner}</p> : null}
          <button type="submit" disabled={busy} className="h-12 rounded-full bg-copper text-sm font-medium text-bg">
            {busy ? "Opening…" : "Open order"}
          </button>
        </form>
      )}
    </main>
  );
}

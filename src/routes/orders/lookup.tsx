import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { lookupOrder } from "@/lib/orders.functions";
import { abs } from "@/lib/site";

export const Route = createFileRoute("/orders/lookup")({
  validateSearch: (search: Record<string, unknown>) => ({
    result: search.result === "failed" ? "failed" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Find an order — BAATO" },
      { name: "description", content: "Look up a BAATO dispatch with the order code and the mobile number used at checkout." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: abs("/orders/lookup") }],
  }),
  component: LookupPage,
});

function LookupPage() {
  const { result } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState("BT-");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(result === "failed" ? "That payment was not confirmed." : "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const found = await lookupOrder({ data: { code: code.trim(), phone } });
    setBusy(false);
    if (!found.ok) {
      setError(found.error);
      return;
    }
    void navigate({ to: "/orders/$code", params: { code: found.order.code }, search: { result: undefined } });
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Orders</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">Find a dispatch</h1>
      <p className="mt-3 text-sm text-muted">No account. Use the order code and the mobile number from checkout.</p>
      <form className="mt-8 grid gap-4" onSubmit={(e) => void onSubmit(e)}>
        <label className="grid gap-1 text-sm">
          Order code
          <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="h-12 rounded-xl border border-line bg-surface px-3 outline-none focus:border-copper" />
        </label>
        <label className="grid gap-1 text-sm">
          Mobile
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl border border-line bg-surface px-3 outline-none focus:border-copper" />
        </label>
        {error ? <p className="text-sm text-copper">{error}</p> : null}
        <button type="submit" disabled={busy} className="h-12 rounded-full bg-copper text-sm font-medium text-bg disabled:opacity-60">
          {busy ? "Looking…" : "Show the order"}
        </button>
      </form>
    </main>
  );
}

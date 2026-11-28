import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  adminDownloadInvoice,
  adminLogin,
  adminLogout,
  adminSetFulfillment,
  adminSetStock,
} from "@/lib/admin.functions";
import type { AdminOrder } from "@/lib/admin-store";
import {
  allowedNext,
  FULFILLMENTS,
  fulfillmentLabel,
  orderMatches,
  type Fulfillment,
} from "@/lib/fulfillment";
import type { InventoryLine } from "@/lib/inventory";
import { formatNprFromPaisa } from "@/lib/money";
import { vehicleName } from "@/lib/catalog";

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

function zoneLabel(zone: AdminOrder["zone"]) {
  return zone === "valley" ? "Kathmandu Valley" : "Outside Valley";
}

export function AdminSetup() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Desk</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">Admin is closed</h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Set <code className="text-fg">ADMIN_SECRET</code> or{" "}
        <code className="text-fg">ADMIN_PASSWORD</code> in the server environment, then restart. The
        desk stays closed until one of those is set — orders and stock are not shown without it.
      </p>
      <p className="mt-3 text-sm text-muted">
        Use a long random value. The session cookie is HTTP-only and signed with that secret. It is
        not a <code className="text-fg">VITE_</code> variable, so the browser bundle never receives
        it.
      </p>
    </main>
  );
}

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await adminLogin({ data: { password } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPassword("");
    await router.invalidate();
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Desk</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">Sign in</h1>
      <p className="mt-3 text-sm text-muted">
        Orders, invoices, and the Valley cage. This page is not indexed.
      </p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm">
          Desk password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 rounded-full border border-line bg-surface px-4 text-fg outline-none focus:border-copper"
          />
        </label>
        {error ? <p className="text-sm text-copper">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="h-12 rounded-full bg-copper text-sm font-medium text-bg disabled:opacity-60"
        >
          {busy ? "Checking…" : "Open the desk"}
        </button>
      </form>
    </main>
  );
}

export function AdminDesk({
  orders,
  inventory,
}: {
  orders: AdminOrder[];
  inventory: InventoryLine[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(orders[0]?.code ?? null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const visible = useMemo(
    () => orders.filter((order) => orderMatches(order, status, query)),
    [orders, status, query],
  );

  async function logout() {
    await adminLogout();
    await router.invalidate();
  }

  async function setFulfillment(code: string, fulfillment: Fulfillment) {
    setBusy(true);
    setError("");
    const result = await adminSetFulfillment({ data: { code, fulfillment } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await router.invalidate();
  }

  async function download(code: string) {
    setBusy(true);
    setError("");
    const result = await adminDownloadInvoice({ data: { code } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    savePdf(result.filename, result.base64);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-copper">Desk</p>
          <h1 className="mt-2 font-display text-5xl tracking-wide">Orders and stock</h1>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="h-11 rounded-full border border-line px-4 text-sm"
        >
          Sign out
        </button>
      </div>
      {error ? (
        <p className="mt-4 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">{error}</p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-3xl tracking-wide">Orders</h2>
        <form className="mt-4" onSubmit={(event) => event.preventDefault()}>
          <label className="grid gap-1 text-sm">
            Search by order code or mobile
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="BT-1001 or 98XXXXXXXX"
              className="h-12 max-w-md rounded-full border border-line bg-surface px-4 outline-none focus:border-copper"
            />
          </label>
        </form>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
            All
          </FilterChip>
          {FULFILLMENTS.map((value) => (
            <FilterChip key={value} active={status === value} onClick={() => setStatus(value)}>
              {fulfillmentLabel(value)}
            </FilterChip>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          {visible.length} of {orders.length} loaded. Newest first, up to 200.
        </p>
        <div className="mt-4 grid gap-3">
          {visible.length === 0 ? <p className="text-muted">No orders match.</p> : null}
          {visible.map((order) => (
            <article key={order.code} className="rounded-2xl border border-line bg-surface p-4">
              <button
                type="button"
                className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left"
                onClick={() => setOpen(open === order.code ? null : order.code)}
              >
                <span>
                  <span className="font-display text-2xl tracking-wide">{order.code}</span>
                  <span className="ml-3 text-sm text-muted">{order.customerName}</span>
                </span>
                <span className="text-sm">
                  <span className="rounded-full border border-copper px-2 py-1 text-copper">
                    {fulfillmentLabel(order.fulfillment)}
                  </span>
                  <span className="ml-3 tabular-nums">{formatNprFromPaisa(order.totalPaisa)}</span>
                </span>
              </button>
              {open === order.code ? (
                <div className="mt-4 grid gap-4 border-t border-line pt-4 text-sm">
                  <p className="text-muted">
                    {order.phone} · {zoneLabel(order.zone)} · {order.paymentMethod} · payment{" "}
                    {order.paymentStatus}
                  </p>
                  <p>{order.address}</p>
                  <ul className="divide-y divide-line border-y border-line">
                    {order.lines.map((line) => (
                      <li key={line.slug} className="flex justify-between gap-3 py-2">
                        <span>
                          {line.name}
                          <span className="block text-muted">
                            {line.sku} · {line.qty} × {formatNprFromPaisa(line.unitPaisa)}
                          </span>
                        </span>
                        <span className="tabular-nums">
                          {formatNprFromPaisa(line.unitPaisa * line.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-muted">
                    VAT {formatNprFromPaisa(order.vatPaisa)} included in the total.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.invoice ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void download(order.code)}
                        className="h-11 rounded-full bg-copper px-4 text-sm font-medium text-bg disabled:opacity-60"
                      >
                        {order.invoice.kind === "tax" ? "VAT invoice" : "Proforma"}{" "}
                        {order.invoice.number}
                      </button>
                    ) : (
                      <p className="text-muted">No invoice yet.</p>
                    )}
                    {allowedNext(order.fulfillment).map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={busy}
                        onClick={() => void setFulfillment(order.code, next)}
                        className="h-11 rounded-full border border-line px-4 text-sm disabled:opacity-60"
                      >
                        Mark {fulfillmentLabel(next).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl tracking-wide">Cage</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Stock here is what checkout will sell. Turning a part off keeps the quantity and blocks
          new orders.
        </p>
        <div className="mt-4 grid gap-3">
          {inventory.map((row) => (
            <StockRow key={row.slug} row={row} onError={setError} />
          ))}
        </div>
      </section>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-2 text-sm ${active ? "border-copper text-copper" : "border-line text-muted"}`}
    >
      {children}
    </button>
  );
}

function StockRow({ row, onError }: { row: InventoryLine; onError: (message: string) => void }) {
  const router = useRouter();
  const [stock, setStock] = useState(String(row.stock));
  const [available, setAvailable] = useState(row.available);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStock(String(row.stock));
    setAvailable(row.available);
  }, [row.stock, row.available]);

  async function save() {
    setBusy(true);
    onError("");
    const result = await adminSetStock({
      data: { slug: row.slug, stock: Number(stock), available },
    });
    setBusy(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    await router.invalidate();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
    >
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-xs text-muted">
          {row.sku} · catalog {row.catalogStock} · sellable {row.sellable} ·{" "}
          {row.vehicles.map(vehicleName).join(", ")}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={available}
          onChange={(event) => setAvailable(event.target.checked)}
        />
        Available
      </label>
      <label className="text-sm">
        <span className="sr-only">Stock for {row.name}</span>
        <input
          inputMode="numeric"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          className="h-11 w-24 rounded-full border border-line bg-bg px-3 outline-none focus:border-copper"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="h-11 rounded-full border border-line px-4 text-sm disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

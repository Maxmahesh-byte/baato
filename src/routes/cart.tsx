import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { capQty } from "@/lib/checkout";
import { partBySlug } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { sellableStock, withSellableStock } from "@/lib/inventory";
import { formatNprFromPaisa } from "@/lib/money";
import { getPublicStock, getShopConfig } from "@/lib/orders.functions";
import { abs } from "@/lib/site";

export const Route = createFileRoute("/cart")({
  loader: async () => ({ config: await getShopConfig(), stock: await getPublicStock() }),
  head: () => ({
    meta: [
      { title: "Dispatch list — BAATO" },
      {
        name: "description",
        content: "Review parts, delivery zone, and payment before dispatch across Nepal.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: abs("/cart") }],
  }),
  component: CartPage,
});

function CartPage() {
  const { config, stock } = Route.useLoaderData();
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    for (const line of lines) {
      const row = stock[line.slug];
      const available = row
        ? sellableStock(row.stock, row.available)
        : (partBySlug(line.slug)?.stock ?? 0);
      if (line.qty > available) setQty(line.slug, capQty(line.qty, available), available);
    }
  }, [lines, setQty, stock]);

  const rows = lines
    .map((line) => {
      const part = partBySlug(line.slug);
      return part ? { part: withSellableStock(part, stock[part.slug]), qty: line.qty } : null;
    })
    .filter((row): row is NonNullable<typeof row> => !!row);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl tracking-wide">Dispatch list</h1>
      <p className="mt-2 text-sm text-muted">
        Cash on delivery is ready now. eSewa, Khalti, and Fonepay show up when their keys are set.
        The desk prices the order — the browser total is only a preview.
      </p>
      {rows.length === 0 ? (
        <p className="mt-8 text-muted">
          Empty.{" "}
          <Link to="/parts" search={{}} className="text-copper">
            Open the catalog
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {rows.map(({ part, qty }) => (
              <li
                key={part.slug}
                className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3 gap-y-2 py-4"
              >
                <img src={part.image} alt="" className="size-20 rounded-xl object-cover" />
                <div className="min-w-0">
                  <Link
                    to="/parts/$slug"
                    params={{ slug: part.slug }}
                    className="font-medium hover:text-copper"
                  >
                    {part.name}
                  </Link>
                  <p className="text-sm text-muted">{formatNprFromPaisa(part.price * 100)}</p>
                  <p className="text-xs text-muted">{part.stock} in the Valley cage</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="size-11 rounded-full border border-line"
                      onClick={() => setQty(part.slug, qty - 1, part.stock)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-6 text-center tabular-nums">{qty}</span>
                    <button
                      type="button"
                      className="size-11 rounded-full border border-line"
                      onClick={() => setQty(part.slug, qty + 1, part.stock)}
                      aria-label="Increase quantity"
                      disabled={qty >= part.stock}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-1 text-sm text-muted"
                      onClick={() => remove(part.slug)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="col-start-2 text-right tabular-nums">
                  {formatNprFromPaisa(part.price * qty * 100)}
                </p>
              </li>
            ))}
          </ul>
          <CheckoutForm
            config={config}
            lines={rows.map((row) => ({ slug: row.part.slug, qty: row.qty }))}
            onPlaced={clear}
          />
        </>
      )}
    </main>
  );
}

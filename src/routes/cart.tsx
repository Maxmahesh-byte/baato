import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { partBySlug } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { abs } from "@/lib/site";
import { npr } from "@/lib/utils";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Dispatch list — BAATO" },
      { name: "description", content: "Review parts before you send them for dispatch across Nepal." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: abs("/cart") }],
  }),
  component: CartPage,
});

function CartPage() {
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const [placed, setPlaced] = useState(false);

  const rows = lines
    .map((l) => {
      const part = partBySlug(l.slug);
      return part ? { part, qty: l.qty } : null;
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  const total = rows.reduce((n, r) => n + r.part.price * r.qty, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-5xl tracking-wide">Dispatch list</h1>
      <p className="mt-2 text-sm text-muted">Cash on delivery in the Valley. This preview confirms the list — it does not charge a card.</p>
      {placed ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
          <p className="font-display text-3xl">List received.</p>
          <p className="mt-2 text-sm text-muted">
            A live desk would assign a rider for in-stock Valley lines and quote the corridor for the rest. Your list was cleared on this device.
          </p>
          <Link to="/parts" search={{}} className="mt-4 inline-block text-copper">
            Back to catalog
          </Link>
        </div>
      ) : rows.length === 0 ? (
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
              <li key={part.slug} className="flex gap-4 py-4">
                <img src={part.image} alt="" className="size-20 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to="/parts/$slug" params={{ slug: part.slug }} className="font-medium hover:text-copper">
                    {part.name}
                  </Link>
                  <p className="text-sm text-muted">{npr(part.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="size-11 rounded-full border border-line"
                      onClick={() => setQty(part.slug, qty - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-6 text-center tabular-nums">{qty}</span>
                    <button
                      type="button"
                      className="size-11 rounded-full border border-line"
                      onClick={() => setQty(part.slug, qty + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button type="button" className="ml-2 text-sm text-muted" onClick={() => remove(part.slug)}>
                      Remove
                    </button>
                  </div>
                </div>
                <p className="tabular-nums">{npr(part.price * qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between">
            <p className="font-display text-3xl">{npr(total)}</p>
            <button
              type="button"
              className="h-12 rounded-full bg-copper px-6 text-sm font-medium text-bg"
              onClick={() => {
                clear();
                setPlaced(true);
              }}
            >
              Place for dispatch
            </button>
          </div>
        </>
      )}
    </main>
  );
}

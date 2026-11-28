import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { PartCard } from "@/components/part-card";
import { partBySlug, parts, vehicleName } from "@/lib/catalog";
import { fitmentMessage, whatsappHref } from "@/lib/checkout";
import { useCart } from "@/lib/cart";
import { withSellableStock } from "@/lib/inventory";
import { getPublicStock, getShopConfig } from "@/lib/orders.functions";
import { productPageJsonLd } from "@/lib/seo";
import { PartTypePage } from "@/components/part-type-page";
import { partsOfType, partTypeBySlug, priceRange } from "@/lib/part-types";
import { abs } from "@/lib/site";
import { npr } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/parts/$slug")({
  loader: async ({ params }) => {
    const type = partTypeBySlug(params.slug);
    if (type) {
      const [config, stock] = await Promise.all([getShopConfig(), getPublicStock()]);
      const items = partsOfType(type).map((p) => withSellableStock(p, stock[p.slug]));
      return { view: "type" as const, typeSlug: type.slug, items, config, part: undefined };
    }
    const found = partBySlug(params.slug);
    if (!found) throw notFound();
    const [config, stock] = await Promise.all([getShopConfig(), getPublicStock()]);
    return {
      view: "part" as const,
      part: withSellableStock(found, stock[found.slug]),
      config,
      items: [],
    };
  },
  head: ({ loaderData }) => {
    if (loaderData?.view === "type") {
      const type = partTypeBySlug(loaderData.typeSlug);
      if (!type) return { meta: [{ title: "BAATO" }] };
      const range = priceRange(loaderData.items);
      const priceText = range
        ? range.low === range.high
          ? ` — ${npr(range.low)}`
          : ` — ${npr(range.low)} to ${npr(range.high)}`
        : "";
      return {
        meta: [
          { title: `${type.name} price in Nepal${priceText} | BAATO` },
          { name: "description", content: type.intro },
          // Guide-only pages (no SKUs yet) stay out of the index until stock exists.
          { name: "robots", content: loaderData.items.length ? "index,follow" : "noindex,follow" },
        ],
        links: [{ rel: "canonical", href: abs(`/parts/${type.slug}`) }],
      };
    }
    const part = loaderData?.part;
    if (!part) return { meta: [{ title: "Part not found — BAATO" }] };
    return {
      meta: [
        { title: `${part.name} — ${npr(part.price)} | BAATO` },
        { name: "description", content: part.lead },
        { name: "robots", content: "index,follow" },
      ],
      links: [{ rel: "canonical", href: abs(`/parts/${part.slug}`) }],
    };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl">Part not listed</h1>
      <Link to="/parts" search={{}} className="mt-4 inline-block text-copper">
        Back to catalog
      </Link>
    </main>
  ),
  component: PartsSlugPage,
});

function PartsSlugPage() {
  const data = Route.useLoaderData();
  if (data.view === "type") {
    return (
      <PartTypePage
        typeSlug={data.typeSlug}
        items={data.items}
        whatsappE164={data.config.whatsappE164}
      />
    );
  }
  return <Product />;
}

function Product() {
  const data = Route.useLoaderData();
  const { config } = data;
  const part = data.part!;
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.lines.find((line) => line.slug === part.slug)?.qty ?? 0);
  const [added, setAdded] = useState(false);
  const related = parts
    .filter((p) => p.slug !== part.slug && p.category === part.category)
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={productPageJsonLd(part)} />
      <nav className="text-sm text-muted">
        <Link to="/" className="hover:text-fg">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link to="/parts" search={{}} className="hover:text-fg">
          Catalog
        </Link>
        <span className="px-2">/</span>
        <span className="text-fg">{part.name}</span>
      </nav>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <img
          src={part.image}
          alt={part.name}
          width={800}
          height={600}
          className="w-full rounded-2xl border border-line object-cover"
        />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-copper">{part.quality}</p>
          <h1 className="mt-2 font-display text-5xl leading-none tracking-wide">{part.name}</h1>
          <p className="mt-3 text-muted">{part.lead}</p>
          <p className="mt-4 font-display text-4xl">{npr(part.price)}</p>
          <p className="mt-1 text-sm text-muted">
            SKU {part.sku} · {part.stock} in the Valley cage · {part.eta}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={part.stock <= 0 || inCart >= part.stock}
              className="h-12 rounded-full bg-copper px-8 text-sm font-medium text-bg disabled:opacity-60"
              onClick={() => {
                add(part.slug, 1, part.stock);
                setAdded(true);
              }}
            >
              {part.stock <= 0
                ? "Out of stock"
                : inCart >= part.stock
                  ? "Cage limit reached"
                  : added
                    ? "Added — add another"
                    : "Add to dispatch list"}
            </button>
            {config.whatsappE164 ? (
              <a
                href={whatsappHref(config.whatsappE164, fitmentMessage(part.name, part.sku))}
                className="inline-flex h-12 items-center justify-center rounded-full border border-line px-5 text-sm"
              >
                Ask about fitment on WhatsApp
              </a>
            ) : null}
          </div>
          <h2 className="mt-8 font-display text-2xl tracking-wide">Fits</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {part.vehicles.map((v) => (
              <li key={v}>
                <Link
                  to="/vehicles/$slug"
                  params={{ slug: v }}
                  className="inline-flex rounded-full border border-line px-3 py-2 text-sm hover:border-copper"
                >
                  {vehicleName(v)}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-2xl tracking-wide">Spec</h2>
          <dl className="mt-2 divide-y divide-line border-y border-line">
            {part.specs.map((s) => (
              <div key={s.label} className="flex justify-between gap-4 py-2 text-sm">
                <dt className="text-muted">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <article className="mt-10 max-w-3xl">
        <h2 className="font-display text-3xl tracking-wide">Why this SKU exists</h2>
        <p className="mt-3 text-base leading-relaxed text-muted">{part.body}</p>
      </article>
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-3xl tracking-wide">Same system</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <PartCard key={p.slug} part={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

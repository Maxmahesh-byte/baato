import { createFileRoute, Link } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { PartCard } from "@/components/part-card";
import { categories, parts, vehicleName, vehicles } from "@/lib/catalog";
import { catalogHeading, partHaystack } from "@/lib/checkout";
import { withSellableStock } from "@/lib/inventory";
import { getPublicStock } from "@/lib/orders.functions";
import { breadcrumbNode } from "@/lib/seo";
import { indexablePartTypes } from "@/lib/part-types";
import { abs } from "@/lib/site";

type PartSearch = { q?: string; vehicle?: string; cat?: string };

export const Route = createFileRoute("/parts/")({
  validateSearch: (search: Record<string, unknown>): PartSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    vehicle: typeof search.vehicle === "string" && search.vehicle ? search.vehicle : undefined,
    cat: typeof search.cat === "string" && search.cat ? search.cat : undefined,
  }),
  loader: async () => ({ stock: await getPublicStock() }),
  head: () => ({
    meta: [
      { title: "Vehicle parts catalog — BAATO Nepal" },
      {
        name: "description",
        content:
          "Browse in-stock motorcycle and car parts for Nepal: chains, brakes, filters, and batteries with exact model fitment and NPR prices.",
      },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: abs("/parts") }],
  }),
  component: Catalog,
});

function Catalog() {
  const { q, vehicle, cat } = Route.useSearch();
  const { stock } = Route.useLoaderData();
  const query = (q ?? "").trim().toLowerCase();
  const categoryName = cat ? categories.find((c) => c.slug === cat)?.name : undefined;
  const priced = parts.map((part) => withSellableStock(part, stock[part.slug]));
  const list = priced.filter((p) => {
    if (vehicle && !p.vehicles.includes(vehicle)) return false;
    if (cat && p.category !== cat) return false;
    if (!query) return true;
    return partHaystack(p).includes(query);
  });

  const title = catalogHeading({
    query: q,
    vehicleName: vehicle ? vehicleName(vehicle) : undefined,
    categoryName,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Catalog", path: "/parts" },
            ]),
            {
              "@type": "ItemList",
              name: title,
              itemListElement: list.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: abs(`/parts/${p.slug}`),
                name: p.name,
              })),
            },
          ],
        }}
      />
      <nav className="text-sm text-muted">
        <Link to="/" className="hover:text-fg">
          Home
        </Link>
        <span className="px-2">/</span>
        <span className="text-fg">Catalog</span>
      </nav>
      <p className="mt-6 text-xs uppercase tracking-[0.18em] text-copper">Catalog</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        {list.length} parts. Filter by the vehicle you actually own — badges are not enough when
        engines changed mid-generation.
      </p>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        <Link
          to="/parts"
          search={{ q, vehicle: undefined, cat }}
          className={`rounded-full border px-3 py-2 text-sm ${!vehicle ? "border-copper text-copper" : "border-line text-muted"}`}
        >
          All vehicles
        </Link>
        {vehicles.map((v) => (
          <Link
            key={v.slug}
            to="/parts"
            search={{ q, cat, vehicle: v.slug }}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-sm ${vehicle === v.slug ? "border-copper text-copper" : "border-line text-muted"}`}
          >
            {v.name}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/parts"
          search={{ q, vehicle, cat: undefined }}
          className={`rounded-full border px-3 py-2 text-sm ${!cat ? "border-copper text-copper" : "border-line text-muted"}`}
        >
          All systems
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            to="/parts"
            search={{ q, vehicle, cat: c.slug }}
            className={`rounded-full border px-3 py-2 text-sm ${cat === c.slug ? "border-copper text-copper" : "border-line text-muted"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="mt-10 text-muted">
          Nothing matches. Try the model name or clear the vehicle filter.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PartCard key={p.slug} part={p} />
          ))}
        </div>
      )}
      <section className="mt-14">
        <h2 className="font-display text-3xl tracking-wide">Part prices in Nepal</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {indexablePartTypes().map((t) => (
            <li key={t.slug}>
              <Link
                to="/parts/$slug"
                params={{ slug: t.slug }}
                className="inline-flex rounded-full border border-line px-3 py-2 text-sm hover:border-copper"
              >
                {t.name} price in Nepal
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

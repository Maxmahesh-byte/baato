import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { PartCard } from "@/components/part-card";
import {
  kindPlural,
  MIN_PARTS_FOR_INDEX,
  partsForVehicle,
  vehicleBySlug,
  vehicles,
} from "@/lib/catalog";
import { withSellableStock } from "@/lib/inventory";
import { getPublicStock } from "@/lib/orders.functions";
import { breadcrumbNode } from "@/lib/seo";
import { indexablePartTypes } from "@/lib/part-types";
import { abs } from "@/lib/site";

export const Route = createFileRoute("/vehicles/$slug")({
  loader: async ({ params }) => {
    const vehicle = vehicleBySlug(params.slug);
    if (!vehicle) throw notFound();
    const stock = await getPublicStock();
    const items = partsForVehicle(params.slug).map((part) =>
      withSellableStock(part, stock[part.slug]),
    );
    const related = vehicles
      .filter((item) => item.kind === vehicle.kind && item.slug !== vehicle.slug)
      .slice(0, 6);
    return { vehicle, items, related };
  },
  head: ({ loaderData }) => {
    const v = loaderData?.vehicle;
    if (!v) return { meta: [{ title: "Vehicle — BAATO" }] };
    return {
      meta: [
        { title: `${v.name} spare parts in Nepal — BAATO` },
        { name: "description", content: v.intro },
        // Fitment-only pages (fewer than 2 SKUs) stay out of the index until stock arrives.
        {
          name: "robots",
          content:
            (loaderData?.items.length ?? 0) >= MIN_PARTS_FOR_INDEX
              ? "index,follow"
              : "noindex,follow",
        },
      ],
      links: [{ rel: "canonical", href: abs(`/vehicles/${v.slug}`) }],
    };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl">Vehicle not listed yet</h1>
      <p className="mt-3 text-muted">
        We start with the models that generate the most downtime, then add depth.
      </p>
    </main>
  ),
  component: VehiclePage,
});

function VehiclePage() {
  const { vehicle, items, related } = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            breadcrumbNode([
              { name: "Home", path: "/" },
              { name: "Catalog", path: "/parts" },
              { name: vehicle.name, path: `/vehicles/${vehicle.slug}` },
            ]),
            {
              "@type": "CollectionPage",
              name: `${vehicle.name} parts in Nepal`,
              description: vehicle.intro,
              url: abs(`/vehicles/${vehicle.slug}`),
            },
            {
              "@type": "ItemList",
              name: `${vehicle.name} parts`,
              itemListElement: items.map((part, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: part.name,
                url: abs(`/parts/${part.slug}`),
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
        <Link to="/parts" search={{}} className="hover:text-fg">
          Catalog
        </Link>
        <span className="px-2">/</span>
        <span className="text-fg">{vehicle.name}</span>
      </nav>
      <p className="mt-6 text-xs uppercase tracking-[0.18em] text-copper">
        {vehicle.ev ? `Electric ${vehicle.kind.toLowerCase()}` : vehicle.kind}
      </p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">{vehicle.name} parts</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-muted">{vehicle.intro}</p>
      <h2 className="mt-8 font-display text-2xl tracking-wide">Fitment notes</h2>
      <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-sm text-muted">
        {vehicle.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <h2 className="mt-8 font-display text-3xl tracking-wide">Parts that fit</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-muted">
          No SKUs for this model yet. Use the fitment notes above and ask us on WhatsApp — we add
          stock for the models customers ask about most.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PartCard key={p.slug} part={p} />
          ))}
        </div>
      )}
      {(() => {
        const types = indexablePartTypes().filter((t) => items.some((p) => t.match(p)));
        return types.length ? (
          <p className="mt-6 text-sm text-muted">
            Compare prices:{" "}
            {types.map((t, i) => (
              <span key={t.slug}>
                <Link to="/parts/$slug" params={{ slug: t.slug }} className="text-copper">
                  {t.name.toLowerCase()} price in Nepal
                </Link>
                {i < types.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        ) : null;
      })()}
      <p className="mt-8">
        <Link to="/parts" search={{ vehicle: vehicle.slug }} className="text-sm text-copper">
          Filter the whole catalog to {vehicle.name}
        </Link>
      </p>
      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-wide">
            Other {kindPlural(vehicle.kind)} we stock
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link
                  to="/vehicles/$slug"
                  params={{ slug: item.slug }}
                  className="inline-flex rounded-full border border-line px-3 py-2 text-sm hover:border-copper"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

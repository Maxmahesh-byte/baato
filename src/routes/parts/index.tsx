import { createFileRoute, Link } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { PartCard } from "@/components/part-card";
import { categories, parts, vehicleName, vehicles } from "@/lib/catalog";
import { abs } from "@/lib/site";

type PartSearch = { q?: string; vehicle?: string; cat?: string };

export const Route = createFileRoute("/parts/")({
  validateSearch: (search: Record<string, unknown>): PartSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    vehicle: typeof search.vehicle === "string" && search.vehicle ? search.vehicle : undefined,
    cat: typeof search.cat === "string" && search.cat ? search.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Vehicle parts catalog — BAATO Nepal" },
      {
        name: "description",
        content:
          "Browse in-stock motorcycle and car parts for Nepal: chains, brakes, filters, and batteries with exact model fitment and NPR prices.",
      },
    ],
    links: [{ rel: "canonical", href: abs("/parts") }],
  }),
  component: Catalog,
});

function Catalog() {
  const { q, vehicle, cat } = Route.useSearch();
  const query = (q ?? "").toLowerCase();
  const list = parts.filter((p) => {
    if (vehicle && !p.vehicles.includes(vehicle)) return false;
    if (cat && p.category !== cat) return false;
    if (!query) return true;
    const blob = `${p.name} ${p.sku} ${p.lead} ${p.vehicles.map(vehicleName).join(" ")}`.toLowerCase();
    return blob.includes(query);
  });

  const title = vehicle
    ? `Parts for ${vehicleName(vehicle)}`
    : cat
      ? categories.find((c) => c.slug === cat)?.name ?? "Catalog"
      : q
        ? `Search: ${q}`
        : "Full catalog";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          itemListElement: list.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: abs(`/parts/${p.slug}`),
            name: p.name,
          })),
        }}
      />
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Catalog</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        {list.length} parts. Filter by the vehicle you actually own — badges are not enough when engines changed mid-generation.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/parts"
          search={{ q, vehicle: undefined, cat: undefined }}
          className={`rounded-full border px-3 py-2 text-sm ${!vehicle ? "border-copper text-copper" : "border-line text-muted"}`}
        >
          All vehicles
        </Link>
        {vehicles.map((v) => (
          <Link
            key={v.slug}
            to="/parts"
            search={{ q, cat, vehicle: v.slug }}
            className={`rounded-full border px-3 py-2 text-sm ${vehicle === v.slug ? "border-copper text-copper" : "border-line text-muted"}`}
          >
            {v.name}
          </Link>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="mt-10 text-muted">Nothing matches. Try the model name or clear the vehicle filter.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PartCard key={p.slug} part={p} />
          ))}
        </div>
      )}
    </main>
  );
}

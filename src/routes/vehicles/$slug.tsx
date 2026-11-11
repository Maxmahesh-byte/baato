import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { PartCard } from "@/components/part-card";
import { partsForVehicle, vehicleBySlug } from "@/lib/catalog";
import { abs } from "@/lib/site";

export const Route = createFileRoute("/vehicles/$slug")({
  loader: ({ params }) => {
    const vehicle = vehicleBySlug(params.slug);
    if (!vehicle) throw notFound();
    return { vehicle, items: partsForVehicle(params.slug) };
  },
  head: ({ loaderData }) => {
    const v = loaderData?.vehicle;
    if (!v) return { meta: [{ title: "Vehicle — BAATO" }] };
    return {
      meta: [
        { title: `${v.name} spare parts in Nepal — BAATO` },
        { name: "description", content: v.intro },
      ],
      links: [{ rel: "canonical", href: abs(`/vehicles/${v.slug}`) }],
    };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl">Vehicle not listed yet</h1>
      <p className="mt-3 text-muted">We start with the models that generate the most downtime, then add depth.</p>
    </main>
  ),
  component: VehiclePage,
});

function VehiclePage() {
  const { vehicle, items } = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${vehicle.name} parts`,
          description: vehicle.intro,
          url: abs(`/vehicles/${vehicle.slug}`),
        }}
      />
      <p className="text-xs uppercase tracking-[0.18em] text-copper">{vehicle.kind}</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">{vehicle.name} parts</h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-muted">{vehicle.intro}</p>
      <ul className="mt-6 max-w-3xl list-disc space-y-2 pl-5 text-sm text-muted">
        {vehicle.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <PartCard key={p.slug} part={p} />
        ))}
      </div>
      <p className="mt-8">
        <Link to="/parts" search={{ vehicle: vehicle.slug }} className="text-sm text-copper">
          Filter the whole catalog to {vehicle.name}
        </Link>
      </p>
    </main>
  );
}

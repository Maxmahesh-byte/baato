import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { PartCard } from "@/components/part-card";
import { categoryBySlug, partsInCategory } from "@/lib/catalog";
import { abs } from "@/lib/site";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = categoryBySlug(params.slug);
    if (!category) throw notFound();
    return { category, items: partsInCategory(params.slug) };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.category;
    if (!c) return { meta: [{ title: "Category — BAATO" }] };
    return {
      meta: [
        { title: `${c.name} in Nepal — BAATO` },
        { name: "description", content: c.blurb + " " + c.copy.slice(0, 120) },
      ],
      links: [{ rel: "canonical", href: abs(`/category/${c.slug}`) }],
    };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-display text-4xl">Unknown category</h1>
    </main>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category, items } = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.name,
          description: category.copy,
          url: abs(`/category/${category.slug}`),
        }}
      />
      <p className="text-xs uppercase tracking-[0.18em] text-copper">System</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">{category.name}</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">{category.copy}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <PartCard key={p.slug} part={p} />
        ))}
      </div>
      <p className="mt-8 text-sm">
        <Link to="/parts" search={{ cat: category.slug }} className="text-copper">
          Open this system in the full catalog
        </Link>
      </p>
    </main>
  );
}

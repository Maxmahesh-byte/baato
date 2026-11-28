import { Link } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { PartCard } from "@/components/part-card";
import type { Part } from "@/lib/catalog";
import { vehicleName, vehicles } from "@/lib/catalog";
import { whatsappHref } from "@/lib/checkout";
import { partTypeBySlug, partTypes, priceRange } from "@/lib/part-types";
import { partTypeJsonLd } from "@/lib/seo";
import { npr } from "@/lib/utils";

export function PartTypePage({
  typeSlug,
  items,
  whatsappE164,
}: {
  typeSlug: string;
  items: Part[];
  whatsappE164?: string | null;
}) {
  const type = partTypeBySlug(typeSlug);
  if (!type) return null;
  const range = priceRange(items);
  const fitted = new Set(items.flatMap((p) => p.vehicles));
  const fitVehicles = vehicles.filter((v) => fitted.has(v.slug));
  const others = partTypes.filter((t) => t.slug !== type.slug);
  const askText = `Namaste, I'm looking for ${type.noun}.\nMy vehicle (make, model, year): `;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={partTypeJsonLd(type, items)} />
      <nav className="text-sm text-muted">
        <Link to="/" className="hover:text-fg">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link to="/parts" search={{}} className="hover:text-fg">
          Catalog
        </Link>
        <span className="px-2">/</span>
        <span className="text-fg">{type.name} price in Nepal</span>
      </nav>
      <h1 className="mt-6 font-display text-5xl leading-none tracking-wide">
        {type.name} price in Nepal
      </h1>
      <p className="mt-4 max-w-3xl leading-relaxed text-muted">{type.intro}</p>
      {range ? (
        <p className="mt-4 text-lg">
          {items.length} {items.length === 1 ? "listing" : "listings"} in our catalog:{" "}
          <strong className="tabular-nums">
            {range.low === range.high ? npr(range.low) : `${npr(range.low)} – ${npr(range.high)}`}
          </strong>
          <span className="text-sm text-muted"> (NPR, VAT included)</span>
        </p>
      ) : (
        <p className="mt-4 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
          We don't have {type.noun} in the online catalog yet, so we don't show a price here. Tell
          us your vehicle and we'll check what we can supply.
        </p>
      )}

      {items.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl tracking-wide">{type.name} we stock</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <PartCard key={p.slug} part={p} />
            ))}
          </div>
        </section>
      ) : null}

      {fitVehicles.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-wide">Find {type.noun} by vehicle</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {fitVehicles.map((v) => (
              <li key={v.slug}>
                <Link
                  to="/vehicles/$slug"
                  params={{ slug: v.slug }}
                  className="inline-flex rounded-full border border-line px-3 py-2 text-sm hover:border-copper"
                >
                  {vehicleName(v.slug)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-3xl tracking-wide">Before you order</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          {type.guide.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        {whatsappE164 ? (
          <a
            href={whatsappHref(whatsappE164, askText)}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-copper px-6 text-sm font-medium text-bg"
          >
            Ask about fitment on WhatsApp
          </a>
        ) : null}
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-3xl tracking-wide">Questions</h2>
        <div className="mt-4 space-y-3">
          {type.faq.map((f) => (
            <details key={f.q} className="rounded-2xl border border-line bg-surface p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-wide">Other part prices in Nepal</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {others.map((t) => (
            <li key={t.slug}>
              <Link
                to="/parts/$slug"
                params={{ slug: t.slug }}
                className="inline-flex rounded-full border border-line px-3 py-2 text-sm hover:border-copper"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

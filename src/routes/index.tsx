import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock3, ShieldCheck, Wrench } from "lucide-react";
import { useState } from "react";
import { JsonLd } from "@/components/json-ld";
import { PartCard } from "@/components/part-card";
import { categories, parts, vehicles } from "@/lib/catalog";
import { abs, SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BAATO — motorcycle & car parts in Nepal" },
      {
        name: "description",
        content:
          "Order exact-fit motorcycle and car parts in Nepal. Pulsar, Shine, Alto, i10. Same-day delivery in Kathmandu Valley from BAATO.",
      },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: abs("/") }],
  }),
  component: Home,
});

const faqs = [
  {
    q: "Do you deliver the same day?",
    a: "In-stock parts dispatch the same day inside Kathmandu Valley before 14:00. Pokhara, Butwal, and Biratnagar are typically next day. The rest of Nepal is 48–72 hours.",
  },
  {
    q: "How do I know the part fits?",
    a: "Every SKU names the model and the spec that actually differs — pitch, thread, pad backing, engine family. If two generations do not share a part, they are different pages.",
  },
  {
    q: "Are these genuine OEM parts?",
    a: "Road Spec is a durable aftermarket compound. Workshop Spec is the tighter-tolerance line garages reorder. We do not relabel unknown cartons as genuine.",
  },
];

function Home() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(vehicles[0].slug);
  const featured = parts.slice(0, 4);

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "AutoPartsStore",
              name: SITE.legal,
              url: SITE.url,
              description: SITE.description,
              telephone: SITE.phone,
              email: SITE.email,
              address: {
                "@type": "PostalAddress",
                addressLocality: "Kathmandu",
                addressCountry: "NP",
              },
              areaServed: "Nepal",
            },
            {
              "@type": "WebSite",
              name: SITE.name,
              url: SITE.url,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE.url}/parts?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ],
        }}
      />
      <section className="relative">
        <img
          src="/media/hero.jpg"
          alt="Motorcycles on a Kathmandu road at dusk"
          width={1792}
          height={1008}
          className="h-[70vh] min-h-[480px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/20" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-12">
          <p className="text-xs uppercase tracking-[0.22em] text-copper">Nepal aftermarket</p>
          <h1 className="mt-3 max-w-xl font-display text-5xl leading-[0.95] tracking-wide sm:text-7xl">
            The part that gets the vehicle moving today.
          </h1>
          <p className="mt-4 max-w-lg text-base text-fg/90">
            BAATO lists only high-failure motorcycle and car parts, matched to the models that actually fill Nepali roads. Downtime is the cost. Speed and fitment are the product.
          </p>
          <form
            className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({ to: "/parts", search: { vehicle, q: undefined, cat: undefined } });
            }}
          >
            <label className="sr-only" htmlFor="fit">
              Choose your vehicle
            </label>
            <select
              id="fit"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="h-12 flex-1 rounded-full border border-line bg-surface px-4 text-sm"
            >
              {vehicles.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-copper px-6 text-sm font-medium text-bg"
            >
              Show parts <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-px bg-line px-4 py-px sm:grid-cols-3">
        {[
          { icon: Clock3, t: "Same-day Valley", d: "In-stock orders placed before 14:00 leave the desk the same afternoon." },
          { icon: ShieldCheck, t: "Named fitment", d: "Pitch, thread, pad plate, and engine family are on the page — not in a chat." },
          { icon: Wrench, t: "Workshop reorder", d: "Garages buy the same SKU twice. That is how we decide what to keep deep." },
        ].map((item) => (
          <div key={item.t} className="bg-bg px-2 py-8 sm:px-6">
            <item.icon className="size-5 text-copper" />
            <h2 className="mt-3 font-display text-2xl tracking-wide">{item.t}</h2>
            <p className="mt-2 text-sm text-muted">{item.d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl tracking-wide">Shop by system</h2>
          <Link to="/parts" search={{}} className="text-sm text-copper">
            All parts
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="group overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <img src={c.image} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="p-4">
                <h3 className="font-display text-2xl tracking-wide">{c.name}</h3>
                <p className="mt-1 text-sm text-muted">{c.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-4xl tracking-wide">Moving this week</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          These SKUs cover the failures we see first: chains, front brakes, filters, and batteries on Pulsar, Shine, Alto, and i10.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <PartCard key={p.slug} part={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-4xl tracking-wide">Parts by vehicle</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <li key={v.slug}>
              <Link
                to="/vehicles/$slug"
                params={{ slug: v.slug }}
                className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-4 hover:border-copper"
              >
                <span>
                  <span className="block text-xs uppercase tracking-[0.16em] text-muted">{v.kind}</span>
                  <span className="font-display text-2xl tracking-wide">{v.name}</span>
                </span>
                <ArrowRight className="size-4 text-copper" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <h2 className="font-display text-4xl tracking-wide">Questions the desk actually gets</h2>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <div key={f.q} className="grid gap-2 py-5 md:grid-cols-3">
              <dt className="font-medium">{f.q}</dt>
              <dd className="text-sm text-muted md:col-span-2">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}

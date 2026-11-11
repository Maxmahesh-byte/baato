import { createFileRoute, Link } from "@tanstack/react-router";
import { abs, SITE } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BAATO — Nepal vehicle parts" },
      {
        name: "description",
        content:
          "BAATO exists to cut vehicle downtime in Nepal. A narrow catalog, named fitment, and a Valley fulfillment desk — not a endless marketplace.",
      },
    ],
    links: [{ rel: "canonical", href: abs("/about") }],
  }),
  component: About,
});

function About() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">About</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">Downtime is the enemy.</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
        <p>
          Nepal keeps vehicles longer than the markets those vehicles were designed for. Dust, monsoon, and hill grades wear chains, pads, filters, and batteries on a schedule no owner’s manual describes. The local counter still wins because a rider can leave with a part in their hand. An online catalog only matters if it is faster or more certain than that ride.
        </p>
        <p>
          {SITE.legal} is built around that constraint. The catalog stays narrow on purpose. A Pulsar 150 chain kit and an NS200 chain kit are different products with different pitches. An Alto K10 oil filter is not an 800 filter. Pages say the difference in the first paragraph, because a wrong part is worse than no part.
        </p>
        <p>
          Stock sits in Kathmandu so Valley orders can move the same day. Corridor cities follow. We do not pretend a container from the coast is “express.” Quality is two named tiers — Road Spec and Workshop Spec — and we do not print another brand’s logo on the box.
        </p>
        <p>
          Garages are the real customer. When a mechanic reorders the same SKU, that part earns more depth. When it comes back, it leaves the cage. The website is the interface. The desk, the cage, and the rider are the company.
        </p>
      </div>
      <p className="mt-8">
        <Link to="/contact" className="text-copper">
          Talk to the desk
        </Link>
      </p>
    </main>
  );
}

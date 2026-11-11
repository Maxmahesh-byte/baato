import { createFileRoute } from "@tanstack/react-router";
import { JsonLd } from "@/components/json-ld";
import { abs } from "@/lib/site";

const faqs = [
  {
    q: "Which vehicles do you cover first?",
    a: "Bajaj Pulsar 150 and NS200, Honda Shine, Suzuki Alto K10, and Hyundai i10. Those models create most of the urgent aftermarket demand we can fulfill from a Valley cage. Other models are added only when we can name the exact spec, not when a supplier catalog lists a photo.",
  },
  {
    q: "What does same-day mean?",
    a: "An in-stock line placed before 14:00 Nepal time is handed to a rider inside Kathmandu Valley the same day. After 14:00 it leaves the next morning. Pokhara, Butwal, and Biratnagar are next-day on the main corridors. Remote districts are 48–72 hours and we say so on the SKU.",
  },
  {
    q: "Road Spec versus Workshop Spec?",
    a: "Road Spec is a honest aftermarket part with the correct dimensions. Workshop Spec is the tighter compound or seal that garages reorder because it survives dust and heat longer. Neither is sold as a fake OEM box.",
  },
  {
    q: "What if the part does not fit?",
    a: "If our page named your model and the part does not fit, we replace it. If you ignored an engine-family warning — K10 versus 800, NS200 versus Pulsar 150 — the return is on you. Fitment notes are the product.",
  },
  {
    q: "Do you take cash on delivery?",
    a: "Yes inside the Valley, and on the corridors where our rider or partner collects. Prepaid eSewa, Khalti, and bank transfer are available everywhere. Card checkout is not the default because it is not how most garages pay.",
  },
  {
    q: "Can a garage open an account?",
    a: "This desk starts as a public catalog with a dispatch list. Workshop terms — weekly billing, standing stock — are arranged by phone once you have ordered twice and we know the parts you actually turn.",
  },
  {
    q: "Where does stock come from?",
    a: "India first, for speed and known compounds, and China for volume lines we have already tested on Nepali roads. Every inbound lot is checked for thread, pitch, or pad shape before it is marked in stock.",
  },
  {
    q: "Do you sell body panels and accessories?",
    a: "Not yet. Bumpers and cosmetic kits sit. Brake shoes and chains do not. We stock what creates downtime.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Fitment, delivery, and quality FAQ — BAATO" },
      {
        name: "description",
        content:
          "How BAATO delivers vehicle parts in Nepal: same-day Kathmandu, model-specific fitment, Road Spec vs Workshop Spec, and returns.",
      },
    ],
    links: [{ rel: "canonical", href: abs("/faq") }],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <p className="text-xs uppercase tracking-[0.18em] text-copper">FAQ</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">Straight answers</h1>
      <p className="mt-3 text-muted">
        Written for owners and for the person at the parts counter. If your question is a specific VIN-level exception, call the desk.
      </p>
      <dl className="mt-8 divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <div key={f.q} className="py-6">
            <dt className="font-display text-2xl tracking-wide">{f.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted">{f.a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}

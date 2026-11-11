import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { abs, SITE } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact the parts desk — BAATO Kathmandu" },
      {
        name: "description",
        content:
          "Reach the BAATO parts desk in Kathmandu for fitment questions, workshop reorders, and delivery across Nepal.",
      },
    ],
    links: [{ rel: "canonical", href: abs("/contact") }],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Desk</p>
      <h1 className="mt-2 font-display text-5xl tracking-wide">Ask before you order the wrong pitch.</h1>
      <p className="mt-3 text-muted">
        {SITE.phone} · {SITE.email} · {SITE.city}. For a fitment question, send the model year and a photo of the old part.
      </p>
      {sent ? (
        <p className="mt-8 rounded-2xl border border-line bg-surface p-6">
          Noted. On a live desk this would land with a parts lead. For now it stays on this device — call if the bike is already apart.
        </p>
      ) : (
        <form
          className="mt-8 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label className="grid gap-1 text-sm">
            Name
            <input required name="name" className="h-12 rounded-xl border border-line bg-surface px-3" />
          </label>
          <label className="grid gap-1 text-sm">
            Phone
            <input required name="phone" type="tel" className="h-12 rounded-xl border border-line bg-surface px-3" />
          </label>
          <label className="grid gap-1 text-sm">
            Vehicle and the part you need
            <textarea required name="note" rows={5} className="rounded-xl border border-line bg-surface px-3 py-3" />
          </label>
          <button type="submit" className="h-12 rounded-full bg-copper text-sm font-medium text-bg">
            Send to the desk
          </button>
        </form>
      )}
    </main>
  );
}

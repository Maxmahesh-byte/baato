import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { categories } from "@/lib/catalog";
import { cartCount, useCart } from "@/lib/cart";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  const lines = useCart((s) => s.lines);
  const count = cartCount(lines);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    void navigate({ to: "/parts", search: { q: q.trim() || undefined, vehicle: undefined, cat: undefined } });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-[0.14em] text-fg">BAATO</span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-muted sm:inline">Parts</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-5 text-sm text-muted md:flex">
          <Link to="/parts" search={{}} className="hover:text-fg" activeProps={{ className: "text-fg" }}>
            Catalog
          </Link>
          {categories.slice(0, 3).map((c) => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} className="hover:text-fg">
              {c.name.split(" ")[0]}
            </Link>
          ))}
          <Link to="/faq" className="hover:text-fg">
            FAQ
          </Link>
        </nav>
        <form onSubmit={submit} className="ml-auto hidden min-w-0 flex-1 max-w-xs md:block">
          <label className="relative block">
            <span className="sr-only">Search parts</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Part, model, SKU"
              className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-3 text-sm text-fg outline-none placeholder:text-muted focus:border-copper"
            />
          </label>
        </form>
        <Link
          to="/cart"
          className="relative ml-auto inline-flex h-11 items-center gap-2 rounded-full border border-line px-3 text-sm text-fg md:ml-0"
          aria-label={`Cart, ${count} items`}
        >
          <ShoppingBag className="size-4" />
          <span className="tabular-nums">{count}</span>
        </Link>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full border border-line md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-bg px-4 py-4 md:hidden">
          <form onSubmit={submit} className="mb-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search parts"
              className="h-11 w-full rounded-full border border-line bg-surface px-4 text-sm outline-none focus:border-copper"
            />
          </form>
          <div className="grid gap-2 text-base">
            <Link to="/parts" search={{}} onClick={() => setOpen(false)} className="py-2">
              Full catalog
            </Link>
            {categories.map((c) => (
              <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} onClick={() => setOpen(false)} className="py-2">
                {c.name}
              </Link>
            ))}
            <Link to="/about" onClick={() => setOpen(false)} className="py-2">
              About
            </Link>
            <Link to="/faq" onClick={() => setOpen(false)} className="py-2">
              FAQ
            </Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="py-2">
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-xl tracking-[0.16em]">BAATO</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{SITE.tagline}</p>
        </div>
        <div className="text-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Desk</p>
          <p className="mt-3">{SITE.city}, Nepal</p>
          <p className="mt-1">{SITE.phone}</p>
          <p className="mt-1">{SITE.email}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/about" className="hover:text-copper">
            Why BAATO
          </Link>
          <Link to="/faq" className="hover:text-copper">
            Fitment & delivery FAQ
          </Link>
          <Link to="/contact" className="hover:text-copper">
            Talk to the desk
          </Link>
          <Link to="/parts" search={{}} className="hover:text-copper">
            All parts
          </Link>
        </div>
      </div>
      <p className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {SITE.legal}. Prices in NPR. Fitment is model-specific — read the SKU notes.
      </p>
    </footer>
  );
}

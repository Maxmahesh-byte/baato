import { create } from "zustand";
import { persist } from "zustand/middleware";
import { capQty } from "./checkout";
import { partBySlug } from "./catalog";

export type CartLine = { slug: string; qty: number };

type CartState = {
  lines: CartLine[];
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (slug, qty = 1) =>
        set((s) => {
          const stock = partBySlug(slug)?.stock ?? 0;
          const adding = capQty(qty, stock);
          if (adding <= 0) return s;
          const hit = s.lines.find((l) => l.slug === slug);
          if (hit) {
            return {
              lines: s.lines.map((l) =>
                l.slug === slug ? { ...l, qty: capQty(l.qty + qty, stock) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { slug, qty: adding }] };
        }),
      setQty: (slug, qty) =>
        set((s) => {
          const capped = capQty(qty, partBySlug(slug)?.stock ?? 0);
          return {
            lines:
              capped <= 0
                ? s.lines.filter((l) => l.slug !== slug)
                : s.lines.map((l) => (l.slug === slug ? { ...l, qty: capped } : l)),
          };
        }),
      remove: (slug) => set((s) => ({ lines: s.lines.filter((l) => l.slug !== slug) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "baato-cart" },
  ),
);

export function cartCount(lines: CartLine[]) {
  return lines.reduce((n, l) => n + l.qty, 0);
}

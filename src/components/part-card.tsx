import { Link } from "@tanstack/react-router";
import type { Part } from "@/lib/catalog";
import { vehicleName } from "@/lib/catalog";
import { npr } from "@/lib/utils";

export function PartCard({ part }: { part: Part }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <Link to="/parts/$slug" params={{ slug: part.slug }} className="block">
        <img
          src={part.image}
          alt={part.name}
          width={800}
          height={600}
          className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-copper">{part.quality}</p>
        <h3 className="font-display text-xl leading-tight tracking-wide">
          <Link to="/parts/$slug" params={{ slug: part.slug }} className="hover:text-copper">
            {part.name}
          </Link>
        </h3>
        <p className="text-sm leading-relaxed text-muted">{part.lead}</p>
        <p className="text-xs text-muted">{part.vehicles.map(vehicleName).join(" · ")}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <p className="text-lg tabular-nums">{npr(part.price)}</p>
          <p className="text-xs text-muted">{part.stock > 0 ? `${part.stock} in stock` : "Enquire"}</p>
        </div>
      </div>
    </article>
  );
}

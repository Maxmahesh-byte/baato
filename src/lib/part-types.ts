import { parts, vehicles, type Part } from "./catalog.ts";

// "<part type> price in Nepal" landing pages (/parts/<slug>).
// Prices shown come ONLY from catalog SKUs. Part types with no SKU yet still
// get a guide page, but it is noindex and kept out of the sitemap until stock
// exists, so we never publish thin or price-less "price" pages to search.

export type PartType = {
  slug: string;
  name: string;
  /** Lowercase noun for sentences, e.g. "brake pads". */
  noun: string;
  intro: string;
  match: (part: Part) => boolean;
  guide: string[];
  faq: { q: string; a: string }[];
};

const n = (p: Part) => p.name.toLowerCase();

export const partTypes: PartType[] = [
  {
    slug: "brake-pads-price-in-nepal",
    name: "Brake pads",
    noun: "brake pads",
    intro:
      "Disc brake pads for Nepal's common bikes, cars and jeeps, listed by exact model so the pad matches the caliper. Kathmandu stop-start traffic and long hill descents wear pads faster than flat-road riding.",
    match: (p) => p.category === "brakes" && n(p).includes("pad"),
    guide: [
      "Match the pad to the caliper, not the badge: two versions of the same model can use different pads.",
      "Car pads are sold as axle sets (both wheels on one axle). Replace both sides together.",
      "Replace pads before the backing plate touches the disc; metal-on-metal damages the disc.",
      "After fitting new pads, bed them in with a few gentle stops before hard braking.",
    ],
    faq: [
      {
        q: "How often should brake pads be changed in Nepal?",
        a: "It depends on riding style and terrain. Hill descents and heavy city traffic wear pads faster. Check pad thickness at every service and replace before the friction material is nearly gone.",
      },
      {
        q: "Are front and rear pads the same?",
        a: "Usually not. Front and rear calipers often take different pads, and many bikes have a drum rear brake that uses shoes instead.",
      },
      {
        q: "Do you deliver brake pads outside Kathmandu?",
        a: "Delivery time is shown on each part page. Ask on WhatsApp for delivery outside the Valley.",
      },
    ],
  },
  {
    slug: "chain-sprocket-kit-price-in-nepal",
    name: "Chain sprocket kits",
    noun: "chain sprocket kits",
    intro:
      "Chain and sprocket kits for Nepal's commuter and sport bikes, listed by chain pitch and model. Dust, monsoon rain and hill starts stretch chains quickly, so replace the chain and both sprockets together.",
    match: (p) => p.category === "chains" && /(chain|drive kit)/.test(n(p)),
    guide: [
      "Check the chain pitch (for example 428 or 520) — kits are not interchangeable between pitches.",
      "Count the sprocket teeth before ordering; the listing shows the counts we stock.",
      "Replace chain and sprockets as a set. A new chain on worn sprockets wears out quickly.",
      "Scooters with a CVT belt (NTorq, Dio, RayZR, Access) do not use a chain kit.",
    ],
    faq: [
      {
        q: "When should I replace my chain sprocket kit?",
        a: "When the chain has stretched beyond its adjustment range, has tight spots, or the sprocket teeth look hooked. Replace the chain and sprockets together.",
      },
      {
        q: "Do scooters need a chain kit?",
        a: "No. Most scooters in Nepal use a CVT belt instead of a chain.",
      },
      {
        q: "Is an O-ring chain worth it?",
        a: "Sealed (O-ring) chains generally last longer in dust and rain than standard chains, at a higher price.",
      },
    ],
  },
  {
    slug: "air-filter-price-in-nepal",
    name: "Air filters",
    noun: "air filters",
    intro:
      "Air filters for bikes, scooters and cars in Nepal, listed by engine. Valley dust and unpaved roads clog filters early, which costs power and fuel economy.",
    match: (p) => p.category === "filters" && n(p).includes("air filter"),
    guide: [
      "Match the filter to the airbox for your exact model and engine.",
      "Check the air filter more often in the dry season and after dusty trips.",
      "Electric vehicles have no engine air filter, but most EV cars have a cabin filter.",
    ],
    faq: [
      {
        q: "How often should I change my air filter?",
        a: "Check it at every service. In dusty conditions it may need replacing sooner than the manual's interval.",
      },
      {
        q: "Can I clean a paper air filter?",
        a: "Light dust can be tapped out, but a clogged paper filter should be replaced.",
      },
      {
        q: "Do EVs need air filters?",
        a: "There is no engine air filter on a battery EV, but electric cars usually have a cabin filter.",
      },
    ],
  },
  {
    slug: "oil-filter-price-in-nepal",
    name: "Oil filters",
    noun: "oil filters",
    intro:
      "Engine oil filters for Nepal's bikes, cars and jeeps, listed by engine family. Change the oil filter with every oil change so fresh oil isn't contaminated by an old filter.",
    match: (p) => p.category === "filters" && n(p).includes("oil filter"),
    guide: [
      "Filters are engine-specific: the same badge can use different filters on different engines.",
      "Spin-on canisters and cartridge filters are not interchangeable.",
      "Battery EVs have no engine oil and no oil filter.",
    ],
    faq: [
      {
        q: "Do you sell engine oil?",
        a: "Engine oil is not in the online catalog yet. Ask on WhatsApp and we'll tell you what we can supply.",
      },
      {
        q: "Should I change the oil filter at every oil change?",
        a: "Yes, it's standard practice to replace the oil filter with each oil change.",
      },
      {
        q: "How do I know which oil filter fits?",
        a: "Check your engine (not just the model name). Each listing names the engine families it fits.",
      },
    ],
  },
  {
    slug: "battery-price-in-nepal",
    name: "Batteries",
    noun: "batteries",
    intro:
      "12 V batteries for bikes and cars in Nepal, listed by voltage, capacity and terminal layout. Cold mornings in the hills and short city trips are hard on weak batteries.",
    match: (p) => p.category === "electrical" && n(p).includes("battery"),
    guide: [
      "Match voltage, capacity (Ah) and terminal layout — the three facts that decide whether it fits and starts.",
      "Check the battery's physical size against the tray before ordering.",
      "EVs still have a 12 V auxiliary battery. We do not sell high-voltage traction batteries.",
    ],
    faq: [
      {
        q: "Do you sell EV traction batteries?",
        a: "No. High-voltage traction battery work goes through the vehicle's authorised dealer.",
      },
      {
        q: "How long does a bike battery last?",
        a: "It varies with use and climate. Short trips and long periods without riding shorten battery life.",
      },
      {
        q: "Do batteries come charged?",
        a: "Ask on WhatsApp before ordering and we'll confirm the battery's condition and fitting.",
      },
    ],
  },
  {
    slug: "clutch-plates-price-in-nepal",
    name: "Clutch plates",
    noun: "clutch plates",
    intro:
      "Clutch plate sets for manual bikes in Nepal. Slipping under load on hill climbs is the usual sign the plates are worn.",
    match: (p) => n(p).includes("clutch"),
    guide: [
      "Clutch plates are model-specific; count the plates and check thickness against your service manual.",
      "Scooters with automatic CVT and EVs do not use clutch plates in the same way.",
      "Replace friction plates as a full set.",
    ],
    faq: [
      {
        q: "What are the signs of worn clutch plates?",
        a: "Engine revs rise without the bike speeding up, especially uphill or under load.",
      },
      {
        q: "Do you stock clutch plates?",
        a: "Clutch plates aren't in the online catalog yet. Send your model on WhatsApp and we'll check availability.",
      },
    ],
  },
  {
    slug: "tyres-price-in-nepal",
    name: "Tyres",
    noun: "tyres",
    intro:
      "Tyres for bikes, scooters and cars in Nepal. Size, load index and tube or tubeless type must match your wheel.",
    match: (p) => /\btyres?\b|\btires?\b/.test(n(p)),
    guide: [
      "Read the size on the sidewall of your current tyre (for example 100/80-17) and match it exactly.",
      "Check whether your wheel is tubeless or uses a tube.",
      "Replace tyres before the tread reaches the wear indicators, especially before monsoon.",
    ],
    faq: [
      {
        q: "Do you sell tyres?",
        a: "Tyres aren't in the online catalog yet. Send the size from your tyre's sidewall on WhatsApp and we'll check.",
      },
      {
        q: "When should I replace tyres before monsoon?",
        a: "If the tread is close to the wear indicators, replace them before the rains — worn tyres lose grip quickly on wet roads.",
      },
    ],
  },
  {
    slug: "headlight-price-in-nepal",
    name: "Headlights",
    noun: "headlights and bulbs",
    intro:
      "Headlight bulbs and assemblies for Nepal's bikes and cars. Night riding on unlit highways makes a working headlight essential.",
    match: (p) => /headlight|head lamp|headlamp|bulb/.test(n(p)),
    guide: [
      "Check the bulb type printed on the old bulb's base before ordering.",
      "Facelift and pre-facelift models often use different headlight assemblies.",
      "Make sure any replacement keeps the headlight aimed correctly so it doesn't dazzle oncoming traffic.",
    ],
    faq: [
      {
        q: "Do you sell complete headlight assemblies?",
        a: "The headlight parts in our online catalog are listed above with NPR prices. For a complete assembly, send your model and a photo on WhatsApp and we'll check.",
      },
      {
        q: "Can I fit a brighter bulb?",
        a: "Use the bulb type your headlight was designed for; a mismatched bulb can overheat the housing or dazzle other road users.",
      },
    ],
  },
];

export function partTypeBySlug(slug: string) {
  return partTypes.find((t) => t.slug === slug);
}

export function partsOfType(type: PartType) {
  return parts.filter(type.match);
}

/** Vehicles that have at least one SKU of this part type. */
export function vehiclesForType(type: PartType) {
  const slugs = new Set(partsOfType(type).flatMap((p) => p.vehicles));
  return vehicles.filter((v) => slugs.has(v.slug));
}

export function priceRange(items: Part[]) {
  if (items.length === 0) return null;
  const prices = items.map((p) => p.price);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

/** Part types that have catalog SKUs (indexable, in the sitemap). */
export function indexablePartTypes() {
  return partTypes.filter((t) => partsOfType(t).length > 0);
}

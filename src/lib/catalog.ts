export type Quality = "Road Spec" | "Workshop Spec";

export type Part = {
  slug: string;
  sku: string;
  name: string;
  category: string;
  vehicles: string[];
  price: number;
  stock: number;
  quality: Quality;
  image: string;
  lead: string;
  body: string;
  specs: { label: string; value: string }[];
  eta: string;
};

export type Category = {
  slug: string;
  name: string;
  image: string;
  blurb: string;
  copy: string;
};

export type Vehicle = {
  slug: string;
  name: string;
  kind: "Motorcycle" | "Car";
  image: string;
  intro: string;
  notes: string[];
};

export const categories: Category[] = [
  {
    slug: "chains",
    name: "Chains & drive",
    image: "/media/chain.jpg",
    blurb: "Kits sized for Nepal’s daily two-wheelers.",
    copy: "Drive kits fail early on dust, rain, and hill starts. BAATO stocks sealed O-ring and standard chains matched to the sprocket counts that actually ship on Pulsar, Discover, Shine, and FZ fleets — not generic “universal” lengths that stretch by the first monsoon.",
  },
  {
    slug: "brakes",
    name: "Brakes",
    image: "/media/brake.jpg",
    blurb: "Pads, shoes, and discs that stop in wet traffic.",
    copy: "Kathmandu traffic and Terai highways punish soft compounds. We list brake parts by exact model year so a mechanic is not guessing pad thickness or disc diameter at the counter.",
  },
  {
    slug: "filters",
    name: "Filters",
    image: "/media/filter.jpg",
    blurb: "Air, oil, and fuel filters for dusty seasons.",
    copy: "Nepal’s dust load clogs cheap paper early. Filter pages name the engine family, thread, and height so a workshop can reorder without opening the old canister first.",
  },
  {
    slug: "electrical",
    name: "Electrical",
    image: "/media/filter.jpg",
    blurb: "Batteries, bulbs, and charging parts.",
    copy: "Cold starts in the hills and short city trips kill weak batteries. Electrical SKUs carry CCA, voltage, and terminal layout — the three facts that decide whether a bike starts tomorrow.",
  },
];

export const vehicles: Vehicle[] = [
  {
    slug: "bajaj-pulsar-150",
    name: "Bajaj Pulsar 150",
    kind: "Motorcycle",
    image: "/media/chain.jpg",
    intro:
      "The Pulsar 150 is one of the highest-mileage commuter bikes on Nepali roads. Chain kits, front pads, and clutch plates are the parts that actually stop the bike from sitting.",
    notes: [
      "Most units in service are carbureted or early FI — confirm before ordering jets or sensors.",
      "Front disc diameter is commonly 240 mm on later discs; we label each pad set.",
      "Same-day in Kathmandu Valley when the SKU shows in stock.",
    ],
  },
  {
    slug: "bajaj-pulsar-ns200",
    name: "Bajaj Pulsar NS200",
    kind: "Motorcycle",
    image: "/media/brake.jpg",
    intro:
      "NS200 owners ride harder and wear pads and chains faster than the 150. Fitment here is liquid-cooled single only — do not mix with the air-cooled 180/220.",
    notes: [
      "Chain is 520 pitch on most years. Count links before you cut a spare.",
      "Front pads are a different backing plate from the Pulsar 150.",
    ],
  },
  {
    slug: "honda-shine",
    name: "Honda Shine",
    kind: "Motorcycle",
    image: "/media/filter.jpg",
    intro:
      "Shine and similar 125 cc Hondas are workshop staples. Filters and brake shoes turn weekly; we keep those depths higher than rare body panels.",
    notes: [
      "Drum-brake shoes are side-specific on some years. The listing says left, right, or pair.",
      "Oil filter thread is not shared with Hero Splendor.",
    ],
  },
  {
    slug: "suzuki-alto",
    name: "Suzuki Alto",
    kind: "Car",
    image: "/media/brake.jpg",
    intro:
      "Alto and Wagon R cousins dominate small-car traffic. Brake pads, filters, and bulbs are the aftermarket that keeps these cars earning.",
    notes: [
      "K10 and older 800 engines do not share oil filters. Pick the engine, not just the badge.",
      "Front pad sets are axle sets, not single wheels.",
    ],
  },
  {
    slug: "hyundai-i10",
    name: "Hyundai i10",
    kind: "Car",
    image: "/media/filter.jpg",
    intro:
      "First- and second-generation i10s are common used cars. We stock the wear items garages ask for after a pre-purchase inspection, not trim clips nobody can identify.",
    notes: [
      "Kappa and older Epsilon engines use different filters.",
      "Rear shoes and front pads are separate SKUs.",
    ],
  },
];

export const parts: Part[] = [
  {
    slug: "pulsar-150-chain-kit",
    sku: "BT-CH-150-428",
    name: "Pulsar 150 sealed chain kit",
    category: "chains",
    vehicles: ["bajaj-pulsar-150"],
    price: 2850,
    stock: 42,
    quality: "Workshop Spec",
    image: "/media/chain.jpg",
    lead: "428 pitch kit with front and rear sprockets for the air-cooled Pulsar 150.",
    body: "A sealed chain lasts longer in monsoon slurry than an open chain, if the sprockets are replaced with it. This kit matches the tooth counts used on the majority of Pulsar 150s registered in Nepal. Stretch is the failure mode we design against: a worn rear sprocket will eat a new chain in a week, so the kit ships as a set. Workshops in Kalimati and Koteshwor reorder this SKU more than any body part we list.",
    specs: [
      { label: "Pitch", value: "428" },
      { label: "Links", value: "128" },
      { label: "Front / rear", value: "14T / 42T" },
      { label: "Seal", value: "O-ring" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "ns200-chain-kit",
    sku: "BT-CH-NS-520",
    name: "NS200 drive kit 520",
    category: "chains",
    vehicles: ["bajaj-pulsar-ns200"],
    price: 4650,
    stock: 18,
    quality: "Workshop Spec",
    image: "/media/chain.jpg",
    lead: "520 pitch chain and sprockets for the liquid-cooled NS200 only.",
    body: "NS200 drive parts are not interchangeable with the Pulsar 150. Riders who buy a 428 kit online waste a day and a return. This kit is cut for the NS200’s final drive and includes the lock and the rear sprocket bolts most boxes forget. Inspect the cush rubber when you open the hub — a collapsed damper will sound like a bad chain.",
    specs: [
      { label: "Pitch", value: "520" },
      { label: "Front / rear", value: "13T / 43T" },
      { label: "Fitment", value: "NS200 liquid-cooled" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "pulsar-150-front-pads",
    sku: "BT-BR-150-F",
    name: "Pulsar 150 front brake pads",
    category: "brakes",
    vehicles: ["bajaj-pulsar-150"],
    price: 680,
    stock: 80,
    quality: "Road Spec",
    image: "/media/brake.jpg",
    lead: "Sintered front pads for the Pulsar 150 disc, sold as an axle pair.",
    body: "Organic pads glaze in downhill traffic between Thankot and Naubise. These sintered pads hold friction when wet and when the disc is already hot. They are louder than soft organic pads for the first 50 km — that is the compound, not a defect. Bed them in with ten firm stops from 40 km/h before a long ride.",
    specs: [
      { label: "Axle", value: "Front" },
      { label: "Compound", value: "Sintered" },
      { label: "In the box", value: "2 pads" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "ns200-front-pads",
    sku: "BT-BR-NS-F",
    name: "NS200 front brake pads",
    category: "brakes",
    vehicles: ["bajaj-pulsar-ns200"],
    price: 920,
    stock: 36,
    quality: "Workshop Spec",
    image: "/media/brake.jpg",
    lead: "Radial-caliper front pads for NS200. Will not fit the Pulsar 150.",
    body: "The backing plate and wear-sensor slot differ from the 150. We photograph the plate, not a generic pad, because wrong pads are the most common online return in this category. Compound is workshop spec: more bite, slightly faster disc wear. Replace the disc if the lip is deep enough to catch a fingernail.",
    specs: [
      { label: "Axle", value: "Front" },
      { label: "Caliper", value: "NS radial" },
      { label: "Compound", value: "Sintered" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "shine-brake-shoes",
    sku: "BT-BR-SH-R",
    name: "Honda Shine rear brake shoes",
    category: "brakes",
    vehicles: ["honda-shine"],
    price: 540,
    stock: 55,
    quality: "Road Spec",
    image: "/media/brake.jpg",
    lead: "Matched rear drum shoes for Honda Shine 125.",
    body: "Drum shoes sold as loose singles often differ in arc and leave a soft pedal. This pair is ground as a set. If the drum is scored, shoes alone will not restore bite — measure the drum before you promise the customer a same-day fix. Hardware springs are included.",
    specs: [
      { label: "Position", value: "Rear drum" },
      { label: "Set", value: "Pair" },
      { label: "Model", value: "Shine 125" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "alto-front-pads",
    sku: "BT-BR-AL-F",
    name: "Suzuki Alto front pad set",
    category: "brakes",
    vehicles: ["suzuki-alto"],
    price: 1450,
    stock: 24,
    quality: "Workshop Spec",
    image: "/media/brake.jpg",
    lead: "Front axle pad set for Alto K10. Not for the older 800.",
    body: "Alto K10 pads are a high-turn item because these cars live in city traffic with a full load. The set covers both front wheels. Wear sensors on some years are molded into the pad; if your car has a separate sensor, reuse it. We do not list the 800 cc pad under this SKU.",
    specs: [
      { label: "Engine", value: "K10" },
      { label: "Axle", value: "Front, both wheels" },
      { label: "Sensor", value: "Molded" },
    ],
    eta: "Next morning, Valley",
  },
  {
    slug: "i10-front-pads",
    sku: "BT-BR-I10-F",
    name: "Hyundai i10 front pad set",
    category: "brakes",
    vehicles: ["hyundai-i10"],
    price: 1680,
    stock: 16,
    quality: "Workshop Spec",
    image: "/media/brake.jpg",
    lead: "Front pads for first- and second-generation i10 with the common sliding caliper.",
    body: "Confirm caliper type if the car has been in a front-end repair. Aftermarket calipers sometimes change the pad ear. This set fits the factory sliding caliper used on the majority of Nepali i10s. Anti-rattle clips are in the box. Torque the guide pins; loose pins are why new pads squeal.",
    specs: [
      { label: "Generations", value: "PA / IA common caliper" },
      { label: "Axle", value: "Front" },
    ],
    eta: "Next morning, Valley",
  },
  {
    slug: "pulsar-150-oil-filter",
    sku: "BT-FL-150-O",
    name: "Pulsar 150 oil filter",
    category: "filters",
    vehicles: ["bajaj-pulsar-150"],
    price: 280,
    stock: 120,
    quality: "Road Spec",
    image: "/media/filter.jpg",
    lead: "Spin-on oil filter for the Pulsar 150. Change with the oil, not on a calendar rumor.",
    body: "Short city trips never get the oil hot enough to boil off fuel dilution, so filters load faster than the manual interval suggests. This canister uses the correct bypass pressure for the Bajaj pump. A cheaper filter that opens early sends unfiltered oil to the journals. Thread and gasket diameter are printed on the listing so a parts counter can match a dirty filter without the bike present.",
    specs: [
      { label: "Type", value: "Spin-on" },
      { label: "Thread", value: "20×1.5" },
      { label: "Height", value: "65 mm" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "shine-air-filter",
    sku: "BT-FL-SH-A",
    name: "Honda Shine air filter",
    category: "filters",
    vehicles: ["honda-shine"],
    price: 320,
    stock: 90,
    quality: "Road Spec",
    image: "/media/filter.jpg",
    lead: "Foam-and-paper element for the Shine airbox.",
    body: "Dust from unpaved approaches packs the Shine airbox faster than owners expect. A clogged filter leans the mixture out and cooks the exhaust valve on long hills. This element drops into the stock box without trimming. Oil the foam lightly if you ride the Terai in dry months; do not soak it.",
    specs: [
      { label: "Type", value: "Panel, stock box" },
      { label: "Media", value: "Paper with foam wrap" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "alto-oil-filter",
    sku: "BT-FL-AL-O",
    name: "Alto K10 oil filter",
    category: "filters",
    vehicles: ["suzuki-alto"],
    price: 390,
    stock: 40,
    quality: "Road Spec",
    image: "/media/filter.jpg",
    lead: "Cartridge-style spin-on for the Alto K10. Do not fit to the 800.",
    body: "The K10 filter is shorter than several Maruti filters that share a similar thread. Installing the tall filter can contact the splash shield. Height is specified below. Replace the crush washer on the drain plug at the same time — most leaks blamed on the filter are the washer.",
    specs: [
      { label: "Engine", value: "K10" },
      { label: "Height", value: "75 mm" },
      { label: "Thread", value: "3/4-16 UNF" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "i10-air-filter",
    sku: "BT-FL-I10-A",
    name: "Hyundai i10 air filter",
    category: "filters",
    vehicles: ["hyundai-i10"],
    price: 740,
    stock: 22,
    quality: "Road Spec",
    image: "/media/filter.jpg",
    lead: "Panel filter for the i10 airbox on Kappa and late Epsilon cars we list.",
    body: "The i10 panel is a rectangle with a specific seal bead. Universal panels that “almost fit” leak dust around the bead and sand the throttle body. This one matches the box lid used on the cars we see in Valley workshops. If your lid has been replaced with a cone kit, this part will not fit — the listing is for the stock box only.",
    specs: [
      { label: "Shape", value: "Panel" },
      { label: "Box", value: "Stock only" },
    ],
    eta: "Next morning, Valley",
  },
  {
    slug: "pulsar-150-battery",
    sku: "BT-EL-150-B",
    name: "Pulsar 150 battery 12V 5Ah",
    category: "electrical",
    vehicles: ["bajaj-pulsar-150"],
    price: 2450,
    stock: 28,
    quality: "Workshop Spec",
    image: "/media/filter.jpg",
    lead: "Maintenance-free 12V battery with the Pulsar terminal orientation.",
    body: "Terminals that face the wrong way force a stretched lead and a future short. This battery matches the tray and the cable reach on the Pulsar 150. CCA is enough for cold hill starts if the charging system is healthy. If the bike needs a jump every morning, test the regulator before you blame a second battery.",
    specs: [
      { label: "Voltage", value: "12 V" },
      { label: "Capacity", value: "5 Ah" },
      { label: "Type", value: "MF, upright" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "shine-battery",
    sku: "BT-EL-SH-B",
    name: "Honda Shine battery 12V 4Ah",
    category: "electrical",
    vehicles: ["honda-shine"],
    price: 1980,
    stock: 30,
    quality: "Road Spec",
    image: "/media/filter.jpg",
    lead: "Compact MF battery for the Shine tray.",
    body: "Shine electrical faults are often a tired battery plus a dirty ground at the coil, not a failed stator. This unit fits the stock strap. Charge it fully before install if it has sat on a shelf — we ship it at storage voltage, not at a marketing “ready to ride” claim we cannot guarantee after customs delays.",
    specs: [
      { label: "Voltage", value: "12 V" },
      { label: "Capacity", value: "4 Ah" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "h4-led-pair",
    sku: "BT-EL-H4",
    name: "H4 LED headlamp pair",
    category: "electrical",
    vehicles: ["bajaj-pulsar-150", "bajaj-pulsar-ns200", "honda-shine"],
    price: 1890,
    stock: 48,
    quality: "Road Spec",
    image: "/media/chain.jpg",
    lead: "Fanless H4 LED pair with a cutoff that does not blind oncoming traffic.",
    body: "Most cheap LEDs throw light into the trees and leave the road dark. This pair keeps a usable low-beam cutoff in the stock reflector used on common Nepali bikes. They draw less than a halogen, which matters on bikes with marginal stators. They are not legal in every jurisdiction as a headlamp replacement — in Nepal they are widely used; we still tell you to aim them.",
    specs: [
      { label: "Base", value: "H4 / HS1" },
      { label: "Cooling", value: "Passive" },
      { label: "Pair", value: "Yes" },
    ],
    eta: "Same day in Kathmandu Valley",
  },
  {
    slug: "alto-battery",
    sku: "BT-EL-AL-B",
    name: "Alto DIN battery 35Ah",
    category: "electrical",
    vehicles: ["suzuki-alto", "hyundai-i10"],
    price: 6200,
    stock: 12,
    quality: "Workshop Spec",
    image: "/media/brake.jpg",
    lead: "35 Ah DIN battery that fits Alto and many i10 trays.",
    body: "Small-car batteries fail after short trips and long sits during bandh days or monsoon weeks. This 35 Ah unit fits the common DIN tray. Check hold-down height before you close the hood. We warranty manufacturing defects for six months; a battery killed by a shorted alternator diode is not a defect.",
    specs: [
      { label: "Capacity", value: "35 Ah" },
      { label: "Layout", value: "DIN, right positive" },
      { label: "Warranty", value: "6 months manufacturing" },
    ],
    eta: "Same day, Valley — heavy item, rider dispatch",
  },
];

export function categoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function vehicleBySlug(slug: string) {
  return vehicles.find((v) => v.slug === slug);
}

export function partBySlug(slug: string) {
  return parts.find((p) => p.slug === slug);
}

export function partsInCategory(slug: string) {
  return parts.filter((p) => p.category === slug);
}

export function partsForVehicle(slug: string) {
  return parts.filter((p) => p.vehicles.includes(slug));
}

export function vehicleName(slug: string) {
  return vehicles.find((v) => v.slug === slug)?.name ?? slug;
}

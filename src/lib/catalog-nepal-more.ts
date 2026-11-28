import type { Vehicle } from "./catalog.ts";

// More of Nepal's common fleet: bikes, scooters, jeeps, cars and EVs.
// These are fitment pages first; SKUs are added as stock arrives. Notes stay
// generic where a model has several variants on Nepali roads — the rule is
// always "confirm on the vehicle before ordering", never a guessed spec.
export const moreNepalVehicles: Vehicle[] = [
  // Motorcycles
  {
    slug: "honda-cb-hornet-160r",
    name: "Honda CB Hornet 160R",
    kind: "Motorcycle",
    image: "/media/chain.jpg",
    intro:
      "The Hornet 160R is a popular step up from 125 cc commuters in the Valley. Chain, pads and air filter are the wear items owners ask for first.",
    notes: [
      "Single-disc and CBS versions use different rear brake parts. Check the rear wheel before ordering.",
      "Do not assume the Unicorn 160 chain or pads fit — confirm on the part listing.",
      "Ask on WhatsApp with a photo of the old part if no SKU is listed yet.",
    ],
  },
  {
    slug: "hero-xpulse-200",
    name: "Hero XPulse 200",
    kind: "Motorcycle",
    image: "/media/chain.jpg",
    intro:
      "XPulse 200 riders take the dual-sport seriously — Mustang, Rara and rural tracks eat chains, pads and air filters faster than city riding.",
    notes: [
      "Carburetted, FI and 4V versions exist. Note the version on the side panel or registration book before ordering engine parts.",
      "Off-road use wears the chain and sprocket as a set. Replace both, not the chain alone.",
      "Clean or replace the air filter after dusty trail rides.",
    ],
  },
  {
    slug: "yamaha-mt-15",
    name: "Yamaha MT-15",
    kind: "Motorcycle",
    image: "/media/brake.jpg",
    intro:
      "The MT-15 shares its liquid-cooled 155 cc platform with the R15. It is a different bike from the FZ — do not order FZ parts for it.",
    notes: [
      "Liquid-cooled 155 cc. Not the air-cooled FZ chain, pads or filter.",
      "Version 1 and version 2 differ in brakes and suspension. Check which one you ride.",
      "Bring the old pad or a photo of the caliper if you are unsure.",
    ],
  },
  {
    slug: "ktm-duke-200",
    name: "KTM 200 Duke",
    kind: "Motorcycle",
    image: "/media/brake.jpg",
    intro:
      "The 200 Duke is one of Nepal's most common performance bikes. Riders replace pads, chain kits and oil filters often, so fitment matters.",
    notes: [
      "Shares its platform with the Pulsar NS200 in parts of the engine, but do not assume brake or chain parts interchange.",
      "Older and newer generations use different bodywork and lights.",
      "Confirm the model year on the registration book before ordering.",
    ],
  },
  {
    slug: "suzuki-gixxer",
    name: "Suzuki Gixxer",
    kind: "Motorcycle",
    image: "/media/chain.jpg",
    intro:
      "Gixxer 155 and Gixxer SF are common city-and-highway bikes. Pads, chain kits and air filters are the usual workshop orders.",
    notes: [
      "Gixxer 155 and Gixxer 250 are different bikes with different parts.",
      "Naked and SF (faired) versions share many engine parts but not the headlight.",
      "Confirm carb or FI before ordering intake parts.",
    ],
  },
  // Scooters
  {
    slug: "suzuki-access-125",
    name: "Suzuki Access 125",
    kind: "Scooter",
    image: "/media/filter.jpg",
    intro:
      "The Access 125 is a family scooter that does short city trips every day. Air filters, CVT belts and brake shoes are what it needs most.",
    notes: [
      "CVT belt drive — there is no chain kit for this scooter.",
      "Drum and disc front-brake versions use different front brake parts.",
      "Do not substitute a belt from another brand's 125 cc scooter.",
    ],
  },
  {
    slug: "yamaha-fascino-125",
    name: "Yamaha Fascino 125",
    kind: "Scooter",
    image: "/media/filter.jpg",
    intro:
      "Fascino 125 scooters are common in Kathmandu traffic. Belt and air filter condition decide how well it pulls on Valley hills.",
    notes: [
      "Related to the RayZR 125 platform, but confirm the belt code on the listing before ordering.",
      "Hybrid and non-hybrid versions differ in electrical parts.",
      "Drum and disc versions use different front brake parts.",
    ],
  },
  {
    slug: "tvs-jupiter",
    name: "TVS Jupiter",
    kind: "Scooter",
    image: "/media/filter.jpg",
    intro:
      "Jupiter 110 and Jupiter 125 are popular family scooters. They are different engines, so most service parts are not shared.",
    notes: [
      "Jupiter 110 and Jupiter 125 use different belts and filters.",
      "CVT belt drive — no chain kit.",
      "Check drum or disc on the front wheel before ordering brake parts.",
    ],
  },
  {
    slug: "niu-electric-scooter",
    name: "NIU electric scooters",
    kind: "Scooter",
    ev: true,
    image: "/media/brake.jpg",
    intro:
      "NIU electric scooters (NQi, MQi, UQi and others) are now common in the Valley. With a hub motor and no engine, the wear items are brakes, tyres and lights.",
    notes: [
      "Electric hub motor: no engine oil, oil filter, air filter, chain or CVT belt.",
      "NIU sells several models. Confirm the model name on the frame or registration before ordering.",
      "Traction battery service goes through the authorised dealer; we do not sell traction batteries.",
    ],
  },
  {
    slug: "yadea-electric-scooter",
    name: "Yadea electric scooters",
    kind: "Scooter",
    ev: true,
    image: "/media/brake.jpg",
    intro:
      "Yadea electric scooters are a common EV choice in Nepal. Most models use a hub motor, so brakes, tyres and lights are the parts that wear.",
    notes: [
      "No engine oil, oil filter, air filter or CVT belt on hub-motor models.",
      "Yadea sells several models; confirm the model name before ordering brake parts.",
      "Traction battery service goes through the authorised dealer.",
    ],
  },
  // Jeeps
  {
    slug: "mahindra-thar",
    name: "Mahindra Thar",
    kind: "Jeep",
    image: "/media/brake.jpg",
    intro:
      "The Thar is a go-to 4x4 for hill districts and trail weekends. Dust and steep descents wear air filters and front pads quickly.",
    notes: [
      "Older Thar (CRDe) and the newer generation use different engines and filters.",
      "Petrol and diesel new-generation Thars use different oil filters.",
      "Check the air filter after every dusty trip.",
    ],
  },
  {
    slug: "suzuki-jimny",
    name: "Suzuki Jimny",
    kind: "Jeep",
    image: "/media/filter.jpg",
    intro:
      "The Jimny is a compact 4x4 suited to narrow hill roads. Filters and brake pads are the routine service parts.",
    notes: [
      "3-door and 5-door Jimny generations differ in some parts. Confirm before ordering.",
      "Petrol engine: oil filter, air filter and cabin filter are routine service items.",
      "Front pads are sold as axle sets.",
    ],
  },
  // Cars
  {
    slug: "suzuki-wagon-r",
    name: "Suzuki Wagon R",
    kind: "Car",
    image: "/media/filter.jpg",
    intro:
      "The Wagon R is a practical city car and a common taxi and family car. Filters, pads and bulbs keep it on the road.",
    notes: [
      "K10 and K12 engines are not the same. Check the engine before ordering filters.",
      "Front pads are axle sets.",
      "Older generations use different headlight units.",
    ],
  },
  {
    slug: "kia-seltos",
    name: "Kia Seltos",
    kind: "Car",
    image: "/media/brake.jpg",
    intro:
      "The Seltos is one of the popular compact SUVs on Nepali roads. Cabin filters, air filters and pads are the usual service items.",
    notes: [
      "Petrol and diesel versions use different oil and fuel filters.",
      "Cabin filter is the stock pollen filter.",
      "Confirm the model year — facelift models may use different lights.",
    ],
  },
  // Electric cars
  {
    slug: "byd-atto-3",
    name: "BYD Atto 3",
    kind: "Car",
    ev: true,
    image: "/media/brake.jpg",
    intro:
      "The BYD Atto 3 is one of the electric SUVs that made EVs mainstream in Nepal. Without an engine, service is mostly brakes, cabin filter, tyres and wipers.",
    notes: [
      "Battery electric: no engine oil, oil filter, spark plugs or clutch.",
      "Regenerative braking reduces pad wear, but discs can rust if the car sits for weeks — check them at service.",
      "High-voltage battery work goes through the authorised dealer; we do not sell traction batteries.",
    ],
  },
  {
    slug: "tata-nexon-ev",
    name: "Tata Nexon EV",
    kind: "Car",
    ev: true,
    image: "/media/filter.jpg",
    intro:
      "The Nexon EV is a common electric compact SUV in Nepal. Its routine parts are brake pads, the cabin filter, tyres and the 12 V auxiliary battery.",
    notes: [
      "Battery electric: no engine oil, oil filter or clutch.",
      "Several Nexon EV versions exist (Prime, Max and later updates). Confirm your version before ordering.",
      "Do not use a petrol or diesel Nexon part list for the EV.",
    ],
  },
  {
    slug: "mg-zs-ev",
    name: "MG ZS EV",
    kind: "Car",
    ev: true,
    image: "/media/brake.jpg",
    intro:
      "The MG ZS EV is a common electric SUV in Kathmandu. Like other EVs, its service list is short: brakes, cabin filter, tyres and wipers.",
    notes: [
      "Battery electric: no engine oil, oil filter or spark plugs.",
      "Pre-facelift and facelift models may use different lights.",
      "High-voltage work goes through the authorised dealer.",
    ],
  },
  {
    slug: "hyundai-kona-electric",
    name: "Hyundai Kona Electric",
    kind: "Car",
    ev: true,
    image: "/media/filter.jpg",
    intro:
      "The Kona Electric was one of the first widely sold EVs in Nepal. Brakes, the cabin filter and the 12 V battery are its routine parts.",
    notes: [
      "Battery electric: no engine oil, oil filter or clutch.",
      "Do not use the petrol Kona parts list.",
      "High-voltage work goes through the authorised dealer.",
    ],
  },
];

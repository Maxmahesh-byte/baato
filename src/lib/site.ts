export const SITE = {
  name: "BAATO",
  legal: "BAATO Parts",
  url: "https://baato.parts",
  tagline: "Correct part. Same day. Back on the road.",
  description:
    "BAATO is Nepal’s vehicle-parts desk for motorcycles and cars. Exact fitment, road-tested stock, and same-day delivery across Kathmandu Valley.",
  phone: "+977-1-5900000",
  email: "desk@baato.parts",
  city: "Kathmandu",
  country: "NP",
} as const;

export function abs(path: string) {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

import { categories, parts, vehicles, type Part } from "./catalog.ts";
import { abs, SITE } from "./site.ts";

export type Crumb = { name: string; path: string };

export function breadcrumbNode(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: abs(crumb.path),
    })),
  };
}

export function organizationNode() {
  return {
    "@type": ["Organization", "AutoPartsStore"],
    name: SITE.legal,
    url: SITE.url,
    description: SITE.description,
    telephone: SITE.phone,
    email: SITE.email,
    currenciesAccepted: "NPR",
    paymentAccepted: "Cash, eSewa, Khalti, Fonepay",
    areaServed: { "@type": "Country", name: "Nepal" },
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressCountry: SITE.country,
    },
  };
}

export function productNode(part: Part) {
  return {
    "@type": "Product",
    name: part.name,
    sku: part.sku,
    image: abs(part.image),
    description: part.lead,
    brand: { "@type": "Brand", name: SITE.name },
    category: part.category,
    offers: {
      "@type": "Offer",
      url: abs(`/parts/${part.slug}`),
      priceCurrency: "NPR",
      price: part.price,
      availability: part.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE.legal },
    },
  };
}

export function productPageJsonLd(part: Part) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "Catalog", path: "/parts" },
        { name: part.name, path: `/parts/${part.slug}` },
      ]),
      productNode(part),
    ],
  };
}

export function homeJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      {
        "@type": "WebSite",
        name: SITE.name,
        url: SITE.url,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE.url}/parts?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };
}

export function indexablePaths(): string[] {
  return [
    "/",
    "/parts",
    "/faq",
    "/about",
    "/contact",
    "/orders/lookup",
    ...categories.map((category) => `/category/${category.slug}`),
    ...vehicles.map((vehicle) => `/vehicles/${vehicle.slug}`),
    ...parts.map((part) => `/parts/${part.slug}`),
  ];
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sitemapXml(paths: string[] = indexablePaths()): string {
  const urls = paths.map((path) => `  <url><loc>${xmlEscape(abs(path))}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${SITE.url}/sitemap.xml
`;

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

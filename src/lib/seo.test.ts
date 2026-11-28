import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { indexableVehicles, partBySlug, parts, vehicles } from "./catalog.ts";
import {
  organizationNode,
  partTypeJsonLd,
  productPageJsonLd,
  ROBOTS_TXT,
  sitemapXml,
} from "./seo.ts";
import { indexablePartTypes, partsOfType, partTypeBySlug, partTypes } from "./part-types.ts";

describe("JSON-LD", () => {
  it("describes BAATO as an organization and an auto parts store", () => {
    const node = organizationNode();
    assert.ok(Array.isArray(node["@type"]));
    assert.ok(node["@type"].includes("Organization"));
    assert.ok(node["@type"].includes("AutoPartsStore"));
    assert.equal(node.currenciesAccepted, "NPR");
    assert.equal(node.address.addressCountry, "NP");
  });

  it("puts NPR price, SKU, and availability on a product", () => {
    const part = partBySlug("pulsar-150-front-pads");
    assert.ok(part);
    const data = productPageJsonLd({ ...part, stock: 4 });
    const product = data["@graph"].find((node) => node["@type"] === "Product");
    assert.ok(product && "offers" in product);
    const offer = product.offers as {
      priceCurrency: string;
      price: number;
      availability: string;
      sku?: string;
    };
    assert.equal(product.sku, "BT-BR-150-F");
    assert.equal(offer.priceCurrency, "NPR");
    assert.equal(offer.price, part.price);
    assert.equal(offer.availability, "https://schema.org/InStock");

    const hidden = productPageJsonLd({ ...part, stock: 0 });
    const hiddenProduct = hidden["@graph"].find((node) => node["@type"] === "Product");
    assert.equal(
      (hiddenProduct as { offers: { availability: string } }).offers.availability,
      "https://schema.org/OutOfStock",
    );

    const crumbs = data["@graph"].find((node) => node["@type"] === "BreadcrumbList");
    assert.ok(crumbs && "itemListElement" in crumbs);
    const items = crumbs.itemListElement as { position: number; name: string; item: string }[];
    assert.deepEqual(
      items.map((item) => item.position),
      [1, 2, 3],
    );
    assert.equal(items[2].name, part.name);
    assert.ok(items[2].item.endsWith(`/parts/${part.slug}`));
  });
});

describe("sitemap and robots", () => {
  it("lists every stocked vehicle and product and leaves the desk and API out", () => {
    const xml = sitemapXml();
    assert.equal(readFileSync(new URL("../../public/sitemap.xml", import.meta.url), "utf8"), xml);
    for (const vehicle of indexableVehicles())
      assert.match(xml, new RegExp(`/vehicles/${vehicle.slug}<`));
    // Fitment-only vehicles (no stock yet) are not advertised to crawlers.
    for (const vehicle of vehicles.filter((v) => !indexableVehicles().includes(v)))
      assert.equal(xml.includes(`/vehicles/${vehicle.slug}<`), false, vehicle.slug);
    for (const part of parts) assert.match(xml, new RegExp(`/parts/${part.slug}<`));
    assert.equal(xml.includes("/admin"), false);
    assert.equal(xml.includes("/api"), false);
    assert.ok(partsForEveryVehicle());
  });

  it("tells crawlers to skip /admin and /api", () => {
    const robots = readFileSync(new URL("../../public/robots.txt", import.meta.url), "utf8");
    assert.equal(robots, ROBOTS_TXT);
    assert.match(robots, /Disallow: \/admin/);
    assert.match(robots, /Disallow: \/api/);
    assert.match(robots, /Sitemap: https:\/\/baato\.parts\/sitemap\.xml/);
  });
});

function partsForEveryVehicle(): boolean {
  return indexableVehicles().every(
    (vehicle) => parts.filter((part) => part.vehicles.includes(vehicle.slug)).length >= 2,
  );
}

describe("part-type price pages", () => {
  it("never collide with a part slug", () => {
    for (const type of partTypes) assert.equal(partBySlug(type.slug), undefined, type.slug);
  });

  it("show NPR Product offers only for catalog SKUs, plus FAQ and breadcrumbs", () => {
    const type = partTypeBySlug("brake-pads-price-in-nepal");
    assert.ok(type);
    const items = partsOfType(type);
    assert.ok(items.length > 0);
    const data = partTypeJsonLd(type, items);
    const list = data["@graph"].find((node) => node["@type"] === "ItemList") as
      | { itemListElement: { item: { offers: { priceCurrency: string; price: number } } }[] }
      | undefined;
    assert.ok(list);
    assert.equal(list.itemListElement.length, items.length);
    for (const entry of list.itemListElement) assert.equal(entry.item.offers.priceCurrency, "NPR");
    assert.ok(data["@graph"].some((node) => node["@type"] === "FAQPage"));
    assert.ok(data["@graph"].some((node) => node["@type"] === "BreadcrumbList"));
  });

  it("keeps price-less guide pages out of the sitemap and structured offers", () => {
    const xml = sitemapXml();
    for (const type of partTypes) {
      const has = partsOfType(type).length > 0;
      assert.equal(xml.includes(`/parts/${type.slug}<`), has, type.slug);
      if (!has) {
        const data = partTypeJsonLd(type, []);
        assert.equal(
          data["@graph"].some((node) => node["@type"] === "ItemList"),
          false,
        );
      }
    }
    assert.ok(indexablePartTypes().length >= 5);
  });

  it("lists every vehicle, including EVs, with a known kind", () => {
    const kinds = new Set(["Motorcycle", "Scooter", "Car", "Jeep"]);
    for (const vehicle of vehicles) assert.ok(kinds.has(vehicle.kind), vehicle.slug);
    assert.ok(vehicles.some((v) => v.slug === "byd-atto-3" && v.ev));
    assert.equal(new Set(vehicles.map((v) => v.slug)).size, vehicles.length);
  });
});

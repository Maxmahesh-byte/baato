import { createServerFn } from "@tanstack/react-start";
import type { OrderLookupResult, PlaceOrderResult } from "./order-types";
import type { PublicShopConfig } from "./shop-config";

export const placeOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<PlaceOrderResult> => {
    const { placeOrderRecord } = await import("./orders.server");
    return placeOrderRecord(data);
  });

export const lookupOrder = createServerFn({ method: "POST" })
  .validator((data: { code: string; phone: string }) => data)
  .handler(async ({ data }): Promise<OrderLookupResult> => {
    const { lookupOrderRecord } = await import("./orders.server");
    return lookupOrderRecord(data.code ?? "", data.phone ?? "");
  });

export const refreshOrder = createServerFn({ method: "POST" })
  .validator((data: { code: string; phone: string }) => data)
  .handler(async ({ data }): Promise<OrderLookupResult> => {
    const { refreshOrderRecord } = await import("./orders.server");
    return refreshOrderRecord(data.code ?? "", data.phone ?? "");
  });

export const resumePayment = createServerFn({ method: "POST" })
  .validator((data: { code: string; phone: string }) => data)
  .handler(async ({ data }): Promise<OrderLookupResult> => {
    const { resumeOrderPayment } = await import("./orders.server");
    return resumeOrderPayment(data.code ?? "", data.phone ?? "");
  });

export const downloadInvoice = createServerFn({ method: "POST" })
  .validator((data: { code: string; phone: string }) => data)
  .handler(async ({ data }) => {
    const { invoicePdfRecord } = await import("./orders.server");
    return invoicePdfRecord(data.code ?? "", data.phone ?? "");
  });

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { saveInquiry } = await import("./orders.server");
    return saveInquiry(data);
  });

export const loadOrderPageFn = createServerFn({ method: "POST" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { loadOrderPage } = await import("./orders.server");
    return loadOrderPage(data.code);
  });

export const getShopConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicShopConfig> => {
    const { getPublicShopConfig } = await import("./shop.server");
    return getPublicShopConfig();
  },
);

export const getPublicStock = createServerFn({ method: "GET" }).handler(async () => {
  const { publicStock } = await import("./stock.server");
  return publicStock();
});

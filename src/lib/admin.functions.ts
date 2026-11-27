import { createServerFn } from "@tanstack/react-start";
import type { Fulfillment } from "./fulfillment";

export const loadAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { loadAdminPage } = await import("./admin.server");
  return loadAdminPage();
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const { loginAdmin } = await import("./admin.server");
    return loginAdmin(typeof data?.password === "string" ? data.password : "");
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { logoutAdmin } = await import("./admin.server");
  logoutAdmin();
  return { ok: true as const };
});

export const adminSetFulfillment = createServerFn({ method: "POST" })
  .validator((data: { code: string; fulfillment: Fulfillment }) => data)
  .handler(async ({ data }) => {
    const { updateFulfillment } = await import("./admin.server");
    return updateFulfillment(data?.code ?? "", data?.fulfillment ?? "");
  });

export const adminSetStock = createServerFn({ method: "POST" })
  .validator((data: { slug: string; stock: number; available: boolean }) => data)
  .handler(async ({ data }) => {
    const { updateStock } = await import("./admin.server");
    return updateStock(data);
  });

export const adminDownloadInvoice = createServerFn({ method: "POST" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { adminInvoice } = await import("./admin.server");
    return adminInvoice(data?.code ?? "");
  });

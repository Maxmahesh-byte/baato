import { createFileRoute } from "@tanstack/react-router";
import { AdminDesk, AdminLogin, AdminSetup } from "@/components/admin-desk";
import { loadAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  loader: () => loadAdmin(),
  head: () => ({
    meta: [
      { title: "Desk — BAATO" },
      { name: "description", content: "BAATO order and inventory desk." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const data = Route.useLoaderData();
  if (!data.configured) return <AdminSetup />;
  if (!data.authed) return <AdminLogin />;
  return <AdminDesk orders={data.orders} inventory={data.inventory} />;
}

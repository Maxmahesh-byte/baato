import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/khalti")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleKhaltiReturn } = await import("@/lib/payments/return.server");
        return handleKhaltiReturn(request);
      },
    },
  },
});

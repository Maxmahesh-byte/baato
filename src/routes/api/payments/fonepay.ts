import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/fonepay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleFonepayWebhook } = await import("@/lib/payments/return.server");
        return handleFonepayWebhook(request);
      },
    },
  },
});

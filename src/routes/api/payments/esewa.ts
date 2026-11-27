import { createFileRoute } from "@tanstack/react-router";

async function handle({ request }: { request: Request }) {
  const { handleEsewaReturn } = await import("@/lib/payments/return.server");
  return handleEsewaReturn(request);
}

export const Route = createFileRoute("/api/payments/esewa")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});

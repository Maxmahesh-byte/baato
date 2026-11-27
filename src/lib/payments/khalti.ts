export const KHALTI_API = {
  uat: "https://dev.khalti.com/api/v2",
  prod: "https://khalti.com/api/v2",
} as const;

/** Khalti rejects checkouts below Rs 10 (1000 paisa). */
export const KHALTI_MIN_PAISA = 1000;

export function classifyKhaltiStatus(status: string): "complete" | "pending" | "failed" {
  if (status === "Completed") return "complete";
  if (status === "Pending" || status === "Initiated") return "pending";
  return "failed";
}

export function khaltiAuthHeader(secret: string): string {
  return `Key ${secret}`;
}

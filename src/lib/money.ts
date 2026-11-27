/** Nepal VAT is 13%. Shelf prices in the catalog are VAT-inclusive rupees. */
export const VAT_RATE_NUMERATOR = 13;
export const VAT_RATE_DENOMINATOR = 113;

export function nprToPaisa(rupees: number): number {
  if (!Number.isInteger(rupees) || rupees < 0) {
    throw new Error("Catalog prices must be non-negative whole rupees");
  }
  return rupees * 100;
}

/** Back VAT out of a VAT-inclusive paisa total. `taxable + vat === total`. */
export function splitInclusiveVat(totalPaisa: number): { taxablePaisa: number; vatPaisa: number } {
  if (!Number.isInteger(totalPaisa) || totalPaisa < 0) {
    throw new Error("Amount must be a non-negative integer number of paisa");
  }
  const vatPaisa = Math.round((totalPaisa * VAT_RATE_NUMERATOR) / VAT_RATE_DENOMINATOR);
  return { vatPaisa, taxablePaisa: totalPaisa - vatPaisa };
}

/** Two-decimal rupee string used in gateway signatures. No float math. */
export function paisaToDecimal(paisa: number): string {
  if (!Number.isInteger(paisa)) throw new Error("paisa must be an integer");
  const neg = paisa < 0;
  const abs = Math.abs(paisa);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${neg ? "-" : ""}${whole}.${frac}`;
}

/**
 * Fonepay's dynamic QR samples send whole rupees without a decimal point
 * (`"14"`, `"50"`). Keep two decimals only when there is a paisa remainder,
 * and sign whatever string is actually sent.
 */
export function fonepayAmountString(paisa: number): string {
  if (!Number.isInteger(paisa) || paisa < 0) throw new Error("paisa must be a non-negative integer");
  if (paisa % 100 === 0) return String(paisa / 100);
  return paisaToDecimal(paisa);
}

/** Parse a rupee amount (`"110"`, `"110.5"`, `110.5`) into paisa. */
export function parseRupeesToPaisa(value: string | number): number | null {
  const source = typeof value === "number" ? value.toFixed(2) : value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(source)) return null;
  const [whole, frac = ""] = source.split(".");
  const padded = (frac + "00").slice(0, 2);
  return Number(whole) * 100 + Number(padded);
}

export function formatNprFromPaisa(paisa: number): string {
  if (!Number.isInteger(paisa)) throw new Error("paisa must be an integer");
  const neg = paisa < 0;
  const abs = Math.abs(paisa);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const grouped = new Intl.NumberFormat("en-NP").format(whole);
  const body = frac === 0 ? grouped : `${grouped}.${String(frac).padStart(2, "0")}`;
  return `${neg ? "-" : ""}NPR ${body}`;
}

/**
 * Nepal fiscal year starts Shrawan 1 (treated here as 16 July, Asia/Kathmandu).
 * The label is the short Bikram Sambat pair used on bills, e.g. `83/84`.
 */
export function nepalFiscalYear(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const fyStartAd = month > 7 || (month === 7 && day >= 16) ? year : year - 1;
  const bsStart = fyStartAd + 57;
  const start = String(bsStart).slice(-2);
  const end = String(bsStart + 1).slice(-2);
  return `${start}/${end}`;
}

export function formatFiscalInvoiceNumber(fiscalYear: string, sequence: number): string {
  return `BT-${fiscalYear}-${String(sequence).padStart(6, "0")}`;
}

export function formatOrderCode(sequence: number): string {
  return `BT-${sequence}`;
}

export function kathmanduStamp(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

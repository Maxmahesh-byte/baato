import type { DeliveryZone, OrderLine, PaymentMethod } from "./checkout";
import { kathmanduStamp } from "./money";

export type InvoiceKind = "proforma" | "tax";

export type InvoiceView = {
  kind: InvoiceKind;
  title: string;
  banner: string;
  invoiceNumber: string;
  fiscalYear: string;
  issuedAt: string;
  orderCode: string;
  sellerName: string;
  sellerAddress: string;
  sellerPan: string;
  sellerPhone: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  zone: DeliveryZone;
  buyerPan: string | null;
  lines: OrderLine[];
  subtotalPaisa: number;
  shippingPaisa: number;
  taxablePaisa: number;
  vatPaisa: number;
  totalPaisa: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
};

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case "cod":
      return "Cash on delivery";
    case "esewa":
      return "eSewa";
    case "khalti":
      return "Khalti";
    case "fonepay":
      return "Fonepay QR";
    default:
      return method;
  }
}

export function buildInvoiceView(input: {
  kind: InvoiceKind;
  invoiceNumber: string;
  fiscalYear: string;
  issuedAt: Date;
  orderCode: string;
  sellerName: string;
  sellerAddress: string;
  sellerPan: string;
  sellerPhone: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  zone: DeliveryZone;
  buyerPan: string | null;
  lines: OrderLine[];
  subtotalPaisa: number;
  shippingPaisa: number;
  taxablePaisa: number;
  vatPaisa: number;
  totalPaisa: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
}): InvoiceView {
  const proforma = input.kind === "proforma";
  return {
    ...input,
    issuedAt: kathmanduStamp(input.issuedAt),
    title: proforma ? "PROFORMA" : "TAX INVOICE",
    banner: proforma
      ? "Not a tax invoice. Payable on delivery. A tax invoice number is issued when payment is confirmed."
      : "Payment received. VAT at 13% is included in the shelf price and backed out below.",
    sellerPan: input.sellerPan || "Not configured",
  };
}

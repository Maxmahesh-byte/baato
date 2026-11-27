import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { paymentMethodLabel, type InvoiceView } from "./invoice-view";
import { formatNprFromPaisa } from "./money";

function pdfSafe(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

/** Render a bill entirely in memory. Nothing is written to disk. */
export async function renderInvoicePdf(view: InvoiceView): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.12, 0.14);
  const muted = rgb(0.33, 0.36, 0.4);
  let page = doc.addPage([595.28, 841.89]);
  let y = 800;
  const left = 48;

  const nextPage = () => {
    page = doc.addPage([595.28, 841.89]);
    y = 800;
  };

  const line = (value: string, size: number, face: typeof font, color = ink) => {
    const text = pdfSafe(value).slice(0, 140);
    if (!text) return;
    if (y < 56) nextPage();
    page.drawText(text, { x: left, y, size, font: face, color });
    y -= size + 5;
  };

  line("BAATO", 20, bold);
  line(view.title, 14, bold);
  line(view.banner, 9, font, muted);
  y -= 6;
  line(`Invoice ${view.invoiceNumber}`, 12, bold);
  line(`Order ${view.orderCode}`, 10, font);
  line(`Issued ${view.issuedAt} NPT`, 10, font);
  line(`Fiscal year ${view.fiscalYear}`, 10, font);
  y -= 6;
  line("Seller", 11, bold);
  line(view.sellerName, 10, font);
  line(view.sellerAddress, 10, font);
  line(`PAN ${view.sellerPan}`, 10, font);
  if (view.sellerPhone) line(view.sellerPhone, 10, font);
  y -= 4;
  line("Buyer", 11, bold);
  line(view.buyerName, 10, font);
  line(view.buyerPhone, 10, font);
  line(view.buyerAddress, 10, font);
  line(view.zone === "valley" ? "Zone: Kathmandu Valley" : "Zone: Outside Valley", 10, font);
  line(view.buyerPan ? `Buyer PAN ${view.buyerPan}` : "Buyer PAN not supplied", 10, font);
  y -= 8;
  line("Lines", 11, bold);

  for (const item of view.lines) {
    if (y < 88) nextPage();
    line(`${item.qty} x ${item.name}`, 10, bold);
    line(`SKU ${item.sku}`, 9, font, muted);
    line(`Fits ${item.fitment || "see the product page"}`, 9, font, muted);
    line(`${formatNprFromPaisa(item.unitPaisa)} each  ·  ${formatNprFromPaisa(item.unitPaisa * item.qty)}`, 10, font);
    y -= 4;
  }

  y -= 6;
  line(`Parts ${formatNprFromPaisa(view.subtotalPaisa)}`, 10, font);
  line(`Delivery ${formatNprFromPaisa(view.shippingPaisa)}`, 10, font);
  line(`Taxable value ${formatNprFromPaisa(view.taxablePaisa)}`, 10, font);
  line(`VAT 13% ${formatNprFromPaisa(view.vatPaisa)}`, 10, font);
  line(`Total ${formatNprFromPaisa(view.totalPaisa)}`, 13, bold);
  line(`Payment ${paymentMethodLabel(view.paymentMethod)} · ${view.paymentStatus}`, 10, font);
  line("Prices are VAT-inclusive NPR. The split above is 13/113 of the total.", 8, font, muted);

  doc.setTitle(`${view.title} ${view.invoiceNumber}`);
  doc.setAuthor(pdfSafe(view.sellerName) || "BAATO");
  return doc.save();
}

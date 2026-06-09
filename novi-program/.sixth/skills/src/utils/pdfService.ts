import PDFDocument from "pdfkit";
import { Readable } from "stream";

interface InvoiceData {
  invoiceNumber: string;
  createdAt: Date;
  dueDate?: Date;
  total: number;
  client: {
    name: string;
    email: string;
    phone: string;
  };
  saloonName: string;
  items: Array<{
    service: {
      name: string;
    };
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export const generateInvoicePDF = (invoiceData: InvoiceData): Readable => {
  const doc = new PDFDocument();

  // Header
  doc.fontSize(20).font("Helvetica-Bold").text(invoiceData.saloonName, { align: "left" });
  doc.fontSize(10).font("Helvetica").text("FAKTURA", { align: "right" }).moveDown();

  // Invoice Details
  doc.fontSize(11).font("Helvetica-Bold").text(`Broj fakture: ${invoiceData.invoiceNumber}`);
  doc.fontSize(10).text(`Datum: ${invoiceData.createdAt.toLocaleDateString()}`);

  if (invoiceData.dueDate) {
    doc.text(`Rok plaćanja: ${invoiceData.dueDate.toLocaleDateString()}`);
  }

  doc.moveDown();

  // Client Info
  doc.fontSize(11).font("Helvetica-Bold").text("Klijent:");
  doc.fontSize(10).font("Helvetica");
  doc.text(invoiceData.client.name);
  doc.text(`Email: ${invoiceData.client.email}`);
  doc.text(`Telefon: ${invoiceData.client.phone}`);

  doc.moveDown();

  // Items Table Header
  const tableTop = doc.y;
  const col1X = 50;
  const col2X = 250;
  const col3X = 320;
  const col4X = 420;

  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Usluga", col1X, tableTop);
  doc.text("Količina", col2X, tableTop);
  doc.text("Cijena", col3X, tableTop);
  doc.text("Iznos", col4X, tableTop);

  // Horizontal line
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Items
  let yPosition = tableTop + 25;
  doc.font("Helvetica").fontSize(10);

  for (const item of invoiceData.items) {
    doc.text(item.service.name, col1X, yPosition);
    doc.text(item.quantity.toString(), col2X, yPosition);
    doc.text(`$${item.unitPrice.toFixed(2)}`, col3X, yPosition);
    doc.text(`$${item.amount.toFixed(2)}`, col4X, yPosition);
    yPosition += 20;
  }

  // Total line
  doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
  yPosition += 10;

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("UKUPNO:", col1X, yPosition, { width: 200 });
  doc.text(`$${invoiceData.total.toFixed(2)}`, col4X, yPosition);

  doc.moveDown();

  // Footer
  doc.fontSize(9).font("Helvetica").text("Hvala na poverenju!", { align: "center" });

  doc.end();

  return doc as any;
};

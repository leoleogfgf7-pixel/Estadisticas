import jsPDF from "jspdf";
import "jspdf-autotable";

interface SaleReceiptData {
  id: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  clientName?: string;
  clientDocument?: string;
  saleType: string;
  paymentMethod: string;
  paymentStatus: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  date: string;
  notes?: string;
}

export function generateSalePDF(data: SaleReceiptData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.businessName, 105, 15, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (data.businessAddress) doc.text(data.businessAddress, 105, 21, { align: "center" });
  if (data.businessPhone) doc.text(`Tel: ${data.businessPhone}`, 105, 26, { align: "center" });

  // Divider
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(10, 30, 200, 30);

  // Document info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const docType = data.saleType === "retail" ? "BOLETA DE VENTA" : "FACTURA";
  doc.text(docType, 105, 37, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${data.id.slice(0, 8).toUpperCase()}`, 105, 42, { align: "center" });
  doc.text(`Fecha: ${data.date}`, 105, 47, { align: "center" });

  // Client info
  doc.setFontSize(9);
  let yPos = 54;
  if (data.clientName) {
    doc.text(`Cliente: ${data.clientName}`, 15, yPos);
    yPos += 5;
  }
  if (data.clientDocument) {
    doc.text(`Documento: ${data.clientDocument}`, 15, yPos);
    yPos += 5;
  }
  doc.text(`Tipo: ${data.saleType === "retail" ? "Por menor" : data.saleType === "wholesale" ? "Por mayor" : "Especial"}`, 15, yPos);
  yPos += 5;
  doc.text(`Método: ${data.paymentMethod} | Estado: ${data.paymentStatus}`, 15, yPos);
  yPos += 8;

  // Table
  (doc as any).autoTable({
    startY: yPos,
    head: [["Producto", "Cant", "P.Unit", "Subtotal"]],
    body: data.items.map((item) => [
      item.name,
      item.quantity.toString(),
      `${data.currency} ${item.unitPrice.toFixed(2)}`,
      `${data.currency} ${item.subtotal.toFixed(2)}`,
    ]),
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  // Totals
  doc.setFontSize(9);
  doc.text(`Subtotal:`, 130, yPos);
  doc.text(`${data.currency} ${data.subtotal.toFixed(2)}`, 170, yPos, { align: "right" });
  yPos += 5;
  if (data.tax > 0) {
    doc.text(`IGV:`, 130, yPos);
    doc.text(`${data.currency} ${data.tax.toFixed(2)}`, 170, yPos, { align: "right" });
    yPos += 5;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`TOTAL:`, 130, yPos);
  doc.text(`${data.currency} ${data.total.toFixed(2)}`, 170, yPos, { align: "right" });

  // Notes
  if (data.notes) {
    yPos += 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Notas: ${data.notes}`, 15, yPos);
  }

  // Footer
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Gracias por su compra", 105, 280, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

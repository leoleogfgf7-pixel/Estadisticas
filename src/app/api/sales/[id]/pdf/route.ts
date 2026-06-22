import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { generateSalePDF } from "@/lib/pdf";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const store = getStore();
    const sale = store.sales.find(s => s.id === id);
    if (!sale) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

    const items = store.saleItems
      .filter(i => i.saleId === id)
      .map(i => ({
        name: store.products.find(p => p.id === i.productId)?.name || "Producto",
        quantity: i.quantity,
        unitPrice: parseFloat(i.unitPrice || "0"),
        subtotal: parseFloat(i.subtotal || "0"),
      }));

    const client = store.clients.find(c => c.id === sale.clientId);
    const setting = store.settings[0];

    const pdfBuffer = generateSalePDF({
      id: sale.id,
      businessName: setting?.businessName || "Mi Negocio",
      businessAddress: setting?.address || undefined,
      businessPhone: setting?.phone || undefined,
      businessEmail: setting?.email || undefined,
      clientName: client?.name || "Cliente general",
      clientDocument: client?.documentNumber || "",
      saleType: sale.saleType,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      items,
      subtotal: parseFloat(sale.subtotal || "0"),
      tax: parseFloat(sale.tax || "0"),
      total: parseFloat(sale.total || "0"),
      currency: setting?.currency || "S/",
      date: new Date(sale.createdAt).toLocaleDateString("es-PE", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      }),
      notes: sale.notes || undefined,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="comprobante-${id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

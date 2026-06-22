import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, saleItems, products, clients, settings } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { generateSalePDF } from "@/lib/pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const [sale] = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
    if (!sale) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });

    const items = await db
      .select({
        name: products.name,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        subtotal: saleItems.subtotal,
      })
      .from(saleItems)
      .innerJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, id));

    let clientName = "Cliente general";
    let clientDocument = "";
    if (sale.clientId) {
      const [client] = await db.select().from(clients).where(eq(clients.id, sale.clientId)).limit(1);
      if (client) {
        clientName = client.name;
        clientDocument = client.documentNumber || "";
      }
    }

    const [setting] = await db.select().from(settings).limit(1);

    const pdfBuffer = generateSalePDF({
      id: sale.id,
      businessName: setting?.businessName || "Mi Negocio",
      businessAddress: setting?.address || undefined,
      businessPhone: setting?.phone || undefined,
      businessEmail: setting?.email || undefined,
      clientName,
      clientDocument,
      saleType: sale.saleType,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice || "0"),
        subtotal: parseFloat(item.subtotal || "0"),
      })),
      subtotal: parseFloat(sale.subtotal || "0"),
      tax: parseFloat(sale.tax || "0"),
      total: parseFloat(sale.total || "0"),
      currency: setting?.currency || "S/",
      date: sale.createdAt.toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      notes: sale.notes || undefined,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="comprobante-${id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("PDF error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

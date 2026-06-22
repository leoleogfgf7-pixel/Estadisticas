import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";

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
        ...i,
        productName: store.products.find(p => p.id === i.productId)?.name || "Producto",
      }));
    return NextResponse.json({ sale, items });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

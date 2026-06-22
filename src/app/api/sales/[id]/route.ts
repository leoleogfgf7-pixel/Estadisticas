import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const store = getStore();
    const saleIdx = store.sales.findIndex(s => s.id === id);
    if (saleIdx === -1) return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    const sale = store.sales[saleIdx];

    // Restore stock for each item
    const items = store.saleItems.filter(i => i.saleId === id);
    for (const item of items) {
      const product = store.products.find(p => p.id === item.productId);
      if (product) {
        product.stock += item.quantity;
        product.updatedAt = new Date().toISOString();
        // Register inventory movement (entry)
        store.inventoryMovements.push({
          id: crypto.randomUUID(), productId: item.productId, userId: user.id,
          type: "entry", quantity: item.quantity,
          reason: `Anulación venta #${id.slice(0, 8)}`, referenceId: id,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Remove sale items and sale
    store.saleItems = store.saleItems.filter(i => i.saleId !== id);
    store.sales.splice(saleIdx, 1);

    // Remove related payments
    store.payments = store.payments.filter(p => p.saleId !== id);

    await logActivity(user.id, "delete", "sale", id, `Anuló venta por S/ ${sale.total}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

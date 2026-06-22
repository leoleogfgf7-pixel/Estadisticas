import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    const store = getStore();
    let list = store.sales;
    if (startDate) list = list.filter(s => new Date(s.createdAt) >= new Date(startDate));
    if (endDate) list = list.filter(s => new Date(s.createdAt) <= new Date(endDate + "T23:59:59.999Z"));
    if (clientId) list = list.filter(s => s.clientId === clientId);
    if (status) list = list.filter(s => s.paymentStatus === status);
    list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 200);

    const enriched = list.map(s => ({
      ...s,
      clientName: store.clients.find(c => c.id === s.clientId)?.name || null,
    }));

    return NextResponse.json({ sales: enriched });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const store = getStore();

    const sale = {
      id: crypto.randomUUID(),
      clientId: data.clientId || null,
      userId: user.id,
      saleType: data.saleType || "retail",
      paymentMethod: data.paymentMethod || "cash",
      paymentStatus: (data.paymentMethod === "credit" ? "pending" : "paid") as "paid" | "pending" | "partial",
      subtotal: data.subtotal?.toString() || "0",
      tax: data.tax?.toString() || "0",
      total: data.total?.toString() || "0",
      totalCost: data.totalCost?.toString() || "0",
      profit: data.profit?.toString() || "0",
      notes: data.notes || null,
      dueDate: data.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.sales.push(sale);

    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        store.saleItems.push({
          id: crypto.randomUUID(), saleId: sale.id, productId: item.productId,
          quantity: item.quantity, unitPrice: item.unitPrice?.toString() || "0",
          unitCost: item.unitCost?.toString() || "0", subtotal: item.subtotal?.toString() || "0",
          profit: item.profit?.toString() || "0",
        });
        const product = store.products.find(p => p.id === item.productId);
        if (product) {
          product.stock = Math.max(0, product.stock - item.quantity);
          product.updatedAt = new Date().toISOString();
          store.inventoryMovements.push({
            id: crypto.randomUUID(), productId: item.productId, userId: user.id,
            type: "exit", quantity: item.quantity,
            reason: `Venta #${sale.id.slice(0, 8)}`, referenceId: sale.id,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    await logActivity(user.id, "create", "sale", sale.id, `Registró venta por ${data.total}`);
    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

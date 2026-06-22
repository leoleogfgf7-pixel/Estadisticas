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
    let list = [...store.sales];

    if (startDate) list = list.filter(s => new Date(s.createdAt) >= new Date(startDate));
    if (endDate) list = list.filter(s => new Date(s.createdAt) <= new Date(endDate + "T23:59:59.999Z"));
    if (clientId) list = list.filter(s => s.clientId === clientId);
    if (status) list = list.filter(s => s.paymentStatus === status);

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const enriched = list.slice(0, 200).map(s => ({
      ...s,
      clientName: store.clients.find(c => c.id === s.clientId)?.name || null,
    }));

    return NextResponse.json({ sales: enriched });
  } catch (error: any) {
    console.error("GET /sales error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const store = getStore();

    // Ensure user exists
    if (!store.users.find(u => u.id === user.id)) {
      store.users.push({
        id: user.id, name: user.name, email: user.email,
        passwordHash: "demo", role: user.role, active: true,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }

    const saleId = crypto.randomUUID();

    const sale = {
      id: saleId,
      clientId: data.clientId || null,
      userId: user.id,
      saleType: data.saleType || "retail",
      paymentMethod: data.paymentMethod || "cash",
      paymentStatus: (data.paymentMethod === "credit" ? "pending" : "paid") as "paid" | "pending" | "partial",
      subtotal: String(data.subtotal || "0"),
      tax: String(data.tax || "0"),
      total: String(data.total || "0"),
      totalCost: String(data.totalCost || "0"),
      profit: String(data.profit || "0"),
      notes: data.notes || null,
      dueDate: data.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.sales.push(sale);

    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        store.saleItems.push({
          id: crypto.randomUUID(),
          saleId,
          productId: item.productId,
          quantity: Number(item.quantity) || 1,
          unitPrice: String(item.unitPrice || "0"),
          unitCost: String(item.unitCost || "0"),
          subtotal: String(item.subtotal || "0"),
          profit: String(item.profit || "0"),
        });

        const product = store.products.find(p => p.id === item.productId);
        if (product) {
          product.stock = Math.max(0, product.stock - (Number(item.quantity) || 1));
          product.updatedAt = new Date().toISOString();

          store.inventoryMovements.push({
            id: crypto.randomUUID(),
            productId: item.productId,
            userId: user.id,
            type: "exit",
            quantity: Number(item.quantity) || 1,
            reason: `Venta #${saleId.slice(0, 8)}`,
            referenceId: saleId,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    await logActivity(user.id, "create", "sale", saleId, `Registró venta por ${data.total}`);
    return NextResponse.json({ sale }, { status: 201 });
  } catch (error: any) {
    console.error("POST /sales error:", error?.message || error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

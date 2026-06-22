import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const store = getStore();
    let list = store.inventoryMovements;
    if (productId) list = list.filter(m => m.productId === productId);
    list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 200);
    const enriched = list.map(m => ({
      ...m,
      productName: store.products.find(p => p.id === m.productId)?.name || "Producto",
    }));
    return NextResponse.json({ movements: enriched });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const store = getStore();
    const movement = {
      id: crypto.randomUUID(),
      productId: data.productId,
      userId: user.id,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      referenceId: data.referenceId || null,
      createdAt: new Date().toISOString(),
    };
    store.inventoryMovements.push(movement);

    const product = store.products.find(p => p.id === data.productId);
    if (product) {
      product.stock = data.type === "entry"
        ? product.stock + data.quantity
        : Math.max(0, product.stock - data.quantity);
      product.updatedAt = new Date().toISOString();
    }

    await logActivity(user.id, "create", "inventory", movement.id, `${data.type} de ${data.quantity} en ${product?.name}`);
    return NextResponse.json({ movement }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

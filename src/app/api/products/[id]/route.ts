import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const store = getStore();
    const product = store.products.find(p => p.id === id);
    if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const data = await request.json();
    const store = getStore();
    const idx = store.products.findIndex(p => p.id === id);
    if (idx === -1) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    store.products[idx] = {
      ...store.products[idx],
      name: data.name, description: data.description, barcode: data.barcode,
      cost: data.cost?.toString(), priceRetail: data.priceRetail?.toString(),
      priceWholesale: data.priceWholesale?.toString(), priceSpecial: data.priceSpecial?.toString(),
      stock: data.stock, minStock: data.minStock, category: data.category,
      updatedAt: new Date().toISOString(),
    };
    await logActivity(user.id, "update", "product", id, `Actualizó producto: ${data.name}`);
    return NextResponse.json({ product: store.products[idx] });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const store = getStore();
    const product = store.products.find(p => p.id === id);
    if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    product.active = false;
    product.updatedAt = new Date().toISOString();
    await logActivity(user.id, "delete", "product", id, `Desactivó producto: ${product.name}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

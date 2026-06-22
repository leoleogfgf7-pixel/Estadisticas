import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const store = getStore();
    let list = store.products;
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (category) list = list.filter(p => p.category === category);
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ products: list });
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
    const product = {
      id: crypto.randomUUID(),
      name: data.name, description: data.description || null, barcode: data.barcode || null,
      cost: data.cost?.toString() || "0", priceRetail: data.priceRetail?.toString() || "0",
      priceWholesale: data.priceWholesale?.toString() || "0", priceSpecial: data.priceSpecial?.toString() || "0",
      stock: data.stock || 0, minStock: data.minStock || 5, category: data.category || null,
      active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    store.products.push(product);
    await logActivity(user.id, "create", "product", product.id, `Creó producto: ${product.name}`);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

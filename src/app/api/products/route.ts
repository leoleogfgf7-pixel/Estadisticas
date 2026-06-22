import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq, ilike, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    let conditions = [];
    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }
    if (category) {
      conditions.push(eq(products.category, category));
    }

    const productList = await db
      .select()
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(products.name);

    return NextResponse.json({ products: productList });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Get products error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();

    const [product] = await db.insert(products).values({
      name: data.name,
      description: data.description || null,
      barcode: data.barcode || null,
      cost: data.cost?.toString() || "0",
      priceRetail: data.priceRetail?.toString() || "0",
      priceWholesale: data.priceWholesale?.toString() || "0",
      priceSpecial: data.priceSpecial?.toString() || "0",
      stock: data.stock || 0,
      minStock: data.minStock || 5,
      category: data.category || null,
    }).returning();

    await logActivity(user.id, "create", "product", product.id, `Creó producto: ${product.name}`);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

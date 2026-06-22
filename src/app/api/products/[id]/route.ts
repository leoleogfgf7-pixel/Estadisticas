import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
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

    const [product] = await db
      .update(products)
      .set({
        name: data.name,
        description: data.description,
        barcode: data.barcode,
        cost: data.cost?.toString(),
        priceRetail: data.priceRetail?.toString(),
        priceWholesale: data.priceWholesale?.toString(),
        priceSpecial: data.priceSpecial?.toString(),
        stock: data.stock,
        minStock: data.minStock,
        category: data.category,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    await logActivity(user.id, "update", "product", product.id, `Actualizó producto: ${product.name}`);

    return NextResponse.json({ product });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
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

    const [product] = await db
      .update(products)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    await logActivity(user.id, "delete", "product", product.id, `Desactivó producto: ${product.name}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

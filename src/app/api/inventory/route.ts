import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryMovements, products } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");

    const movements = await db
      .select({
        id: inventoryMovements.id,
        productId: inventoryMovements.productId,
        productName: products.name,
        type: inventoryMovements.type,
        quantity: inventoryMovements.quantity,
        reason: inventoryMovements.reason,
        referenceId: inventoryMovements.referenceId,
        createdAt: inventoryMovements.createdAt,
      })
      .from(inventoryMovements)
      .leftJoin(products, eq(inventoryMovements.productId, products.id))
      .where(productId ? eq(inventoryMovements.productId, productId) : undefined)
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(200);

    return NextResponse.json({ movements });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();

    // Create movement
    const [movement] = await db.insert(inventoryMovements).values({
      productId: data.productId,
      userId: user.id,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      referenceId: data.referenceId || null,
    }).returning();

    // Update product stock
    const [product] = await db.select({ stock: products.stock, name: products.name }).from(products).where(eq(products.id, data.productId)).limit(1);
    if (product) {
      const newStock = data.type === "entry"
        ? product.stock + data.quantity
        : Math.max(0, product.stock - data.quantity);
      await db.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, data.productId));
    }

    await logActivity(user.id, "create", "inventory", movement.id, `${data.type === "entry" ? "Entrada" : "Salida"} de ${data.quantity} en ${product?.name}`);

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

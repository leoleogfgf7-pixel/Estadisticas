import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, saleItems, products, inventoryMovements, clients } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    let conditions = [];
    if (startDate) conditions.push(gte(sales.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(sales.createdAt, new Date(endDate + "T23:59:59.999Z")));
    if (clientId) conditions.push(eq(sales.clientId, clientId));
    if (status) conditions.push(eq(sales.paymentStatus, status as "paid" | "pending" | "partial"));

    const salesList = await db
      .select({
        id: sales.id,
        clientId: sales.clientId,
        clientName: clients.name,
        userId: sales.userId,
        saleType: sales.saleType,
        paymentMethod: sales.paymentMethod,
        paymentStatus: sales.paymentStatus,
        subtotal: sales.subtotal,
        tax: sales.tax,
        total: sales.total,
        totalCost: sales.totalCost,
        profit: sales.profit,
        notes: sales.notes,
        dueDate: sales.dueDate,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .leftJoin(clients, eq(sales.clientId, clients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sales.createdAt))
      .limit(200);

    return NextResponse.json({ sales: salesList });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Get sales error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();

    // Create sale
    const [sale] = await db.insert(sales).values({
      clientId: data.clientId || null,
      userId: user.id,
      saleType: data.saleType || "retail",
      paymentMethod: data.paymentMethod || "cash",
      paymentStatus: data.paymentMethod === "credit" ? "pending" : "paid",
      subtotal: data.subtotal?.toString() || "0",
      tax: data.tax?.toString() || "0",
      total: data.total?.toString() || "0",
      totalCost: data.totalCost?.toString() || "0",
      profit: data.profit?.toString() || "0",
      notes: data.notes || null,
      dueDate: data.dueDate || null,
    }).returning();

    // Create sale items and update stock
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        await db.insert(saleItems).values({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice?.toString() || "0",
          unitCost: item.unitCost?.toString() || "0",
          subtotal: item.subtotal?.toString() || "0",
          profit: item.profit?.toString() || "0",
        });

        // Update stock
        const [product] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, item.productId)).limit(1);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await db.update(products).set({ stock: newStock, updatedAt: new Date() }).where(eq(products.id, item.productId));

          // Inventory movement
          await db.insert(inventoryMovements).values({
            productId: item.productId,
            userId: user.id,
            type: "exit",
            quantity: item.quantity,
            reason: `Venta #${sale.id.slice(0, 8)}`,
            referenceId: sale.id,
          });
        }
      }
    }

    await logActivity(user.id, "create", "sale", sale.id, `Registró venta por ${data.total}`);

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Create sale error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

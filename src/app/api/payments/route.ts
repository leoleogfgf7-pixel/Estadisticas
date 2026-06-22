import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, sales } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const saleId = searchParams.get("saleId");

    const paymentList = await db
      .select()
      .from(payments)
      .where(saleId ? eq(payments.saleId, saleId) : undefined)
      .orderBy(payments.createdAt);

    return NextResponse.json({ payments: paymentList });
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

    const [payment] = await db.insert(payments).values({
      saleId: data.saleId,
      amount: data.amount?.toString() || "0",
      method: data.method || "cash",
      notes: data.notes || null,
    }).returning();

    // Update sale payment status
    const [sale] = await db.select({ id: sales.id, total: sales.total }).from(sales).where(eq(sales.id, data.saleId)).limit(1);
    if (sale) {
      const totalPaid = await db
        .select({ total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`.as("total") })
        .from(payments)
        .where(eq(payments.saleId, data.saleId));

      const paid = parseFloat(totalPaid[0]?.total || "0");
      const total = parseFloat(sale.total || "0");

      let newStatus: "paid" | "pending" | "partial" = "pending";
      if (paid >= total) newStatus = "paid";
      else if (paid > 0) newStatus = "partial";

      await db.update(sales).set({ paymentStatus: newStatus, updatedAt: new Date() }).where(eq(sales.id, data.saleId));
    }

    await logActivity(user.id, "create", "payment", payment.id, `Registró pago de S/ ${data.amount}`);

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

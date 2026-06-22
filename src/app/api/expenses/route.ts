import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses, expenseCategories } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let conditions = [];
    if (startDate) conditions.push(gte(expenses.date, startDate));
    if (endDate) conditions.push(lte(expenses.date, endDate));

    const expenseList = await db
      .select({
        id: expenses.id,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        userId: expenses.userId,
        description: expenses.description,
        amount: expenses.amount,
        date: expenses.date,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(expenses.date))
      .limit(200);

    return NextResponse.json({ expenses: expenseList });
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

    const [expense] = await db.insert(expenses).values({
      categoryId: data.categoryId || null,
      userId: user.id,
      description: data.description,
      amount: data.amount?.toString() || "0",
      date: data.date || new Date().toISOString().split("T")[0],
    }).returning();

    await logActivity(user.id, "create", "expense", expense.id, `Registró gasto: ${data.description} - ${data.amount}`);

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

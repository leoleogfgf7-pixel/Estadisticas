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
    const store = getStore();
    let list = store.expenses;
    if (startDate) list = list.filter(e => e.date >= startDate);
    if (endDate) list = list.filter(e => e.date <= endDate);
    list = [...list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 200);
    const enriched = list.map(e => ({
      ...e,
      categoryName: store.expenseCategories.find(c => c.id === e.categoryId)?.name || "General",
    }));
    return NextResponse.json({ expenses: enriched });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const store = getStore();
    const expense = {
      id: crypto.randomUUID(),
      categoryId: data.categoryId || null,
      userId: user.id,
      description: data.description,
      amount: data.amount?.toString() || "0",
      date: data.date || new Date().toISOString().split("T")[0],
      receiptUrl: null,
      createdAt: new Date().toISOString(),
    };
    store.expenses.push(expense);
    await logActivity(user.id, "create", "expense", expense.id, `Registró gasto: ${data.description} - ${data.amount}`);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const store = getStore();
    return NextResponse.json({ categories: store.expenseCategories });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const data = await request.json();
    const store = getStore();
    const category = {
      id: crypto.randomUUID(), name: data.name, color: data.color || "#64748b",
      createdAt: new Date().toISOString(),
    };
    store.expenseCategories.push(category);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

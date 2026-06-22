import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenseCategories } from "@/db/schema";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const categories = await db.select().from(expenseCategories).orderBy(expenseCategories.name);
    return NextResponse.json({ categories });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const data = await request.json();
    const [category] = await db.insert(expenseCategories).values({
      name: data.name,
      color: data.color || "#64748b",
    }).returning();
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

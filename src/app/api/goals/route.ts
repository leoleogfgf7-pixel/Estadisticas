import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    await requireAuth();
    const goalsList = await db.select().from(goals).orderBy(goals.createdAt);
    return NextResponse.json({ goals: goalsList });
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

    const [goal] = await db.insert(goals).values({
      userId: user.id,
      title: data.title,
      targetAmount: data.targetAmount?.toString() || "0",
      currentAmount: "0",
      type: data.type || "sales",
      period: data.period || "monthly",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      endDate: data.endDate || new Date().toISOString().split("T")[0],
    }).returning();

    await logActivity(user.id, "create", "goal", goal.id, `Creó meta: ${data.title}`);

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();

    const [goal] = await db.update(goals)
      .set({
        title: data.title,
        targetAmount: data.targetAmount?.toString(),
        currentAmount: data.currentAmount?.toString(),
        type: data.type,
        period: data.period,
        endDate: data.endDate,
        active: data.active,
      })
      .where(eq(goals.id, data.id))
      .returning();

    if (!goal) return NextResponse.json({ error: "Meta no encontrada" }, { status: 404 });

    await logActivity(user.id, "update", "goal", goal.id, `Actualizó meta: ${data.title}`);
    return NextResponse.json({ goal });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

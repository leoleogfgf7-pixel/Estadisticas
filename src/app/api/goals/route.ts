import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    await requireAuth();
    const store = getStore();
    return NextResponse.json({ goals: store.goals });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const store = getStore();
    const goal = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: data.title,
      targetAmount: data.targetAmount?.toString() || "0",
      currentAmount: "0",
      type: data.type || "sales",
      period: data.period || "monthly",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      endDate: data.endDate || new Date().toISOString().split("T")[0],
      active: true,
      createdAt: new Date().toISOString(),
    };
    store.goals.push(goal);
    await logActivity(user.id, "create", "goal", goal.id, `Creó meta: ${data.title}`);
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const store = getStore();
    const idx = store.goals.findIndex(g => g.id === data.id);
    if (idx === -1) return NextResponse.json({ error: "Meta no encontrada" }, { status: 404 });
    store.goals[idx] = { ...store.goals[idx], ...data };
    await logActivity(user.id, "update", "goal", data.id, `Actualizó meta: ${data.title}`);
    return NextResponse.json({ goal: store.goals[idx] });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

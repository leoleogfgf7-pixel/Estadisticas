import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const store = getStore();
    const logs = [...store.activityLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100)
      .map(l => ({
        ...l,
        userName: store.users.find(u => u.id === l.userId)?.name || "Sistema",
      }));
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getStore, serializeStore, restoreStore, resetStore } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const json = serializeStore();
    const buffer = Buffer.from(json, "utf-8");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="arenapos-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const data = await request.json();
    if (!data.json) return NextResponse.json({ error: "JSON requerido" }, { status: 400 });
    const ok = restoreStore(data.json);
    if (!ok) return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await requireAdmin();
    resetStore();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

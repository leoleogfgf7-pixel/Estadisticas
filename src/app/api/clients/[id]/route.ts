import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const store = getStore();
    const client = store.clients.find(c => c.id === id);
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    return NextResponse.json({ client });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const data = await request.json();
    const store = getStore();
    const idx = store.clients.findIndex(c => c.id === id);
    if (idx === -1) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    store.clients[idx] = { ...store.clients[idx], ...data, updatedAt: new Date().toISOString() };
    await logActivity(user.id, "update", "client", id, `Actualizó cliente: ${data.name}`);
    return NextResponse.json({ client: store.clients[idx] });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const store = getStore();
    const client = store.clients.find(c => c.id === id);
    if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    client.active = false;
    client.updatedAt = new Date().toISOString();
    await logActivity(user.id, "delete", "client", id, "Desactivó cliente");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

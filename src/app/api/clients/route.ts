import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const store = getStore();
    let list = store.clients;
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ clients: list });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const store = getStore();
    const client = {
      id: crypto.randomUUID(), name: data.name, documentType: data.documentType || "DNI",
      documentNumber: data.documentNumber || null, email: data.email || null,
      phone: data.phone || null, address: data.address || null, type: data.type || "frequent",
      notes: data.notes || null, active: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    store.clients.push(client);
    await logActivity(user.id, "create", "client", client.id, `Creó cliente: ${client.name}`);
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

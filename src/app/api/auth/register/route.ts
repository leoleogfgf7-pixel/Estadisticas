import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }
    const store = getStore();
    if (store.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    const newUser = {
      id: crypto.randomUUID(), name, email, passwordHash: "demo",
      role: role as "admin" | "seller", active: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    await logActivity(admin.id, "create", "user", newUser.id, `Creó usuario: ${name}`);
    return NextResponse.json({ user: { id: newUser.id, name, email, role } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

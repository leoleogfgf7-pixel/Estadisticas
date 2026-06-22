import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      role: role as "admin" | "seller",
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    await logActivity(admin.id, "create", "user", newUser.id, `Creó usuario: ${name}`);

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden: Admin only") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

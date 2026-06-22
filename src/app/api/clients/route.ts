import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { eq, ilike, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    let conditions = [];
    if (search) {
      conditions.push(ilike(clients.name, `%${search}%`));
    }

    const clientList = await db
      .select()
      .from(clients)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(clients.name);

    return NextResponse.json({ clients: clientList });
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

    const [client] = await db.insert(clients).values({
      name: data.name,
      documentType: data.documentType || "DNI",
      documentNumber: data.documentNumber || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      type: data.type || "frequent",
      notes: data.notes || null,
    }).returning();

    await logActivity(user.id, "create", "client", client.id, `Creó cliente: ${client.name}`);

    return NextResponse.json({ client }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

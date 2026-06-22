import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    await requireAuth();
    const [setting] = await db.select().from(settings).limit(1);
    if (!setting) {
      const [newSetting] = await db.insert(settings).values({}).returning();
      return NextResponse.json({ settings: newSetting });
    }
    return NextResponse.json({ settings: setting });
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

    let [setting] = await db.select().from(settings).limit(1);

    if (setting) {
      [setting] = await db.update(settings)
        .set({
          businessName: data.businessName ?? setting.businessName,
          currency: data.currency ?? setting.currency,
          logoUrl: data.logoUrl ?? setting.logoUrl,
          primaryColor: data.primaryColor ?? setting.primaryColor,
          secondaryColor: data.secondaryColor ?? setting.secondaryColor,
          address: data.address ?? setting.address,
          phone: data.phone ?? setting.phone,
          email: data.email ?? setting.email,
          taxRate: data.taxRate?.toString() ?? setting.taxRate,
          updatedAt: new Date(),
        })
        .where({ id: setting.id } as any)
        .returning();
    } else {
      [setting] = await db.insert(settings).values({
        businessName: data.businessName || "Mi Negocio",
        currency: data.currency || "S/",
        primaryColor: data.primaryColor || "#1e293b",
        secondaryColor: data.secondaryColor || "#f59e0b",
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        taxRate: data.taxRate?.toString() || "0",
      }).returning();
    }

    await logActivity(user.id, "update", "settings", setting.id, "Actualizó configuración");

    return NextResponse.json({ settings: setting });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

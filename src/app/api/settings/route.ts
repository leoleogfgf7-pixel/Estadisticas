import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    await requireAuth();
    const store = getStore();
    if (store.settings.length === 0) {
      const setting = {
        id: crypto.randomUUID(), businessName: "Mi Negocio", currency: "S/",
        logoUrl: null, primaryColor: "#1e293b", secondaryColor: "#f59e0b",
        address: null, phone: null, email: null, taxRate: "0",
        updatedAt: new Date().toISOString(),
      };
      store.settings.push(setting);
    }
    return NextResponse.json({ settings: store.settings[0] });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const store = getStore();
    if (store.settings.length === 0) {
      store.settings.push({
        id: crypto.randomUUID(), businessName: data.businessName || "Mi Negocio",
        currency: data.currency || "S/", logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || "#1e293b", secondaryColor: data.secondaryColor || "#f59e0b",
        address: data.address || null, phone: data.phone || null, email: data.email || null,
        taxRate: data.taxRate?.toString() || "0", updatedAt: new Date().toISOString(),
      });
    } else {
      store.settings[0] = {
        ...store.settings[0],
        businessName: data.businessName ?? store.settings[0].businessName,
        currency: data.currency ?? store.settings[0].currency,
        primaryColor: data.primaryColor ?? store.settings[0].primaryColor,
        secondaryColor: data.secondaryColor ?? store.settings[0].secondaryColor,
        address: data.address ?? store.settings[0].address,
        phone: data.phone ?? store.settings[0].phone,
        email: data.email ?? store.settings[0].email,
        taxRate: data.taxRate?.toString() ?? store.settings[0].taxRate,
        updatedAt: new Date().toISOString(),
      };
    }
    await logActivity(user.id, "update", "settings", store.settings[0].id, "Actualizó configuración");
    return NextResponse.json({ settings: store.settings[0] });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

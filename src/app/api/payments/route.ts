import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const saleId = searchParams.get("saleId");
    const store = getStore();
    let list = store.payments;
    if (saleId) list = list.filter(p => p.saleId === saleId);
    list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ payments: list });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await request.json();
    const store = getStore();
    const payment = {
      id: crypto.randomUUID(),
      saleId: data.saleId,
      amount: data.amount?.toString() || "0",
      method: data.method || "cash",
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
    };
    store.payments.push(payment);

    // Update sale status
    const sale = store.sales.find(s => s.id === data.saleId);
    if (sale) {
      const totalPaid = store.payments
        .filter(p => p.saleId === data.saleId)
        .reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
      const total = parseFloat(sale.total || "0");
      if (totalPaid >= total) sale.paymentStatus = "paid";
      else if (totalPaid > 0) sale.paymentStatus = "partial";
      else sale.paymentStatus = "pending";
      sale.updatedAt = new Date().toISOString();
    }

    await logActivity(user.id, "create", "payment", payment.id, `Registró pago de S/ ${data.amount}`);
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, clients } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { exportSalesToExcel } from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let conditions = [];
    if (startDate) conditions.push(gte(sales.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(sales.createdAt, new Date(endDate + "T23:59:59.999Z")));

    const salesList = await db
      .select({
        id: sales.id,
        clientName: clients.name,
        saleType: sales.saleType,
        paymentMethod: sales.paymentMethod,
        paymentStatus: sales.paymentStatus,
        subtotal: sales.subtotal,
        total: sales.total,
        profit: sales.profit,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .leftJoin(clients, eq(sales.clientId, clients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sales.createdAt);

    const excelData = salesList.map((s) => ({
      "ID": s.id.slice(0, 8),
      "Fecha": s.createdAt.toISOString().split("T")[0],
      "Cliente": s.clientName || "General",
      "Tipo": s.saleType === "retail" ? "Menor" : s.saleType === "wholesale" ? "Mayor" : "Especial",
      "Método": s.paymentMethod,
      "Estado": s.paymentStatus === "paid" ? "Pagado" : s.paymentStatus === "pending" ? "Pendiente" : "Parcial",
      "Subtotal": `S/ ${parseFloat(s.subtotal || "0").toFixed(2)}`,
      "Total": `S/ ${parseFloat(s.total || "0").toFixed(2)}`,
      "Ganancia": `S/ ${parseFloat(s.profit || "0").toFixed(2)}`,
    }));

    const buffer = exportSalesToExcel(excelData);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ventas.xlsx"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

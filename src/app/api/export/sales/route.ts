import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";
import { exportToExcel } from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const store = getStore();
    let list = store.sales;
    if (startDate) list = list.filter(s => new Date(s.createdAt) >= new Date(startDate));
    if (endDate) list = list.filter(s => new Date(s.createdAt) <= new Date(endDate + "T23:59:59.999Z"));

    const excelData = list.map(s => ({
      "ID": s.id.slice(0, 8),
      "Fecha": s.createdAt.split("T")[0],
      "Cliente": store.clients.find(c => c.id === s.clientId)?.name || "General",
      "Tipo": s.saleType === "retail" ? "Menor" : s.saleType === "wholesale" ? "Mayor" : "Especial",
      "Método": s.paymentMethod,
      "Estado": s.paymentStatus === "paid" ? "Pagado" : s.paymentStatus === "pending" ? "Pendiente" : "Parcial",
      "Total": `S/ ${parseFloat(s.total || "0").toFixed(2)}`,
      "Ganancia": `S/ ${parseFloat(s.profit || "0").toFixed(2)}`,
    }));

    const buffer = exportToExcel(excelData, "Ventas", "ventas.xlsx");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ventas.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

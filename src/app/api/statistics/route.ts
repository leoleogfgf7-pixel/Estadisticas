import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();

    const store = getStore();

    const inRange = (dateStr: string) => {
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    // Most profitable / sold
    const productStats: Record<string, { name: string; total_profit: number; total_quantity: number; total_sold: number }> = {};
    for (const si of store.saleItems) {
      const sale = store.sales.find(s => s.id === si.saleId);
      if (!sale || !inRange(sale.createdAt)) continue;
      const product = store.products.find(p => p.id === si.productId);
      if (!productStats[si.productId]) {
        productStats[si.productId] = { name: product?.name || "?", total_profit: 0, total_quantity: 0, total_sold: 0 };
      }
      productStats[si.productId].total_profit += parseFloat(si.profit || "0");
      productStats[si.productId].total_quantity += si.quantity;
      productStats[si.productId].total_sold += parseFloat(si.subtotal || "0");
    }
    const mostProfitable = Object.values(productStats).sort((a, b) => b.total_profit - a.total_profit).slice(0, 10);
    const mostSold = Object.values(productStats).sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 10);

    // Monthly comparison (last 6 months)
    const monthlyComparison = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthSales = store.sales.filter(s => {
        const d = new Date(s.createdAt);
        return d >= monthStart && d <= monthEnd;
      });
      const monthExpenses = store.expenses.filter(e => {
        const d = new Date(e.date);
        return d >= monthStart && d <= monthEnd;
      });
      const salesTotal = monthSales.reduce((s, x) => s + parseFloat(x.total || "0"), 0);
      const profitTotal = monthSales.reduce((s, x) => s + parseFloat(x.profit || "0"), 0);
      const expensesTotal = monthExpenses.reduce((s, x) => s + parseFloat(x.amount || "0"), 0);
      monthlyComparison.push({
        month: monthStart.toLocaleDateString("es-PE", { month: "short", year: "numeric" }),
        sales: salesTotal,
        expenses: expensesTotal,
        profit: profitTotal,
        netProfit: profitTotal - expensesTotal,
      });
    }

    // Sales trend
    const salesTrend = [];
    const trendStart = new Date(Math.max(start.getTime(), now.getTime() - 30 * 24 * 60 * 60 * 1000));
    for (let d = new Date(trendStart); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const total = store.sales
        .filter(s => {
          const dt = new Date(s.createdAt);
          return dt >= dayStart && dt <= dayEnd;
        })
        .reduce((s, x) => s + parseFloat(x.total || "0"), 0);
      salesTrend.push({
        date: d.toLocaleDateString("es-PE", { day: "numeric", month: "short" }),
        total,
      });
    }

    // Unsold products
    const soldIds = new Set(
      store.saleItems
        .filter(si => {
          const sale = store.sales.find(s => s.id === si.saleId);
          return sale && inRange(sale.createdAt);
        })
        .map(si => si.productId)
    );
    const unsoldProducts = store.products.filter(p => p.active && !soldIds.has(p.id));

    return NextResponse.json({
      mostProfitable, mostSold, monthlyComparison, salesTrend,
      unsoldProducts: unsoldProducts.map(p => ({ id: p.id, name: p.name })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

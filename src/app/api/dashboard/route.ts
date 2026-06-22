import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const store = getStore();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const sumSales = (from: Date, to: Date) => {
      const filtered = store.sales.filter(s => {
        const d = new Date(s.createdAt);
        return d >= from && d <= to;
      });
      return {
        total: filtered.reduce((s, x) => s + parseFloat(x.total || "0"), 0),
        profit: filtered.reduce((s, x) => s + parseFloat(x.profit || "0"), 0),
        count: filtered.length,
      };
    };

    const daily = sumSales(todayStart, todayEnd);
    const weekly = sumSales(weekStart, todayEnd);
    const monthly = sumSales(monthStart, todayEnd);

    const monthExpenses = store.expenses
      .filter(e => {
        const d = new Date(e.date);
        return d >= monthStart && d <= todayEnd;
      })
      .reduce((s, e) => s + parseFloat(e.amount || "0"), 0);

    const netProfit = monthly.profit - monthExpenses;
    const margin = monthly.total > 0 ? (netProfit / monthly.total) * 100 : 0;

    const lowStockProducts = store.products.filter(p => p.stock <= p.minStock && p.active);
    const pendingSales = store.sales.filter(s => s.paymentStatus === "pending" || s.paymentStatus === "partial");
    const pendingTotal = pendingSales.reduce((s, x) => s + parseFloat(x.total || "0"), 0);

    // Sales by type
    const salesByTypeMap: Record<string, number> = {};
    for (const s of store.sales) {
      const d = new Date(s.createdAt);
      if (d >= monthStart && d <= todayEnd) {
        salesByTypeMap[s.saleType] = (salesByTypeMap[s.saleType] || 0) + parseFloat(s.total || "0");
      }
    }
    const salesByType = Object.entries(salesByTypeMap).map(([type, total]) => ({ type, total: total.toFixed(2) }));

    // Top products
    const productMap: Record<string, { name: string; quantity: number; total: number }> = {};
    for (const si of store.saleItems) {
      const sale = store.sales.find(s => s.id === si.saleId);
      if (!sale) continue;
      const d = new Date(sale.createdAt);
      if (d < monthStart || d > todayEnd) continue;
      const product = store.products.find(p => p.id === si.productId);
      if (!productMap[si.productId]) productMap[si.productId] = { name: product?.name || "?", quantity: 0, total: 0 };
      productMap[si.productId].quantity += si.quantity;
      productMap[si.productId].total += parseFloat(si.subtotal || "0");
    }
    const topProducts = Object.values(productMap).sort((a, b) => b.total - a.total).slice(0, 5);

    // Chart data - last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayStart);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
      const total = store.sales
        .filter(s => {
          const d = new Date(s.createdAt);
          return d >= dayStart && d <= dayEnd;
        })
        .reduce((s, x) => s + parseFloat(x.total || "0"), 0);
      last7Days.push({
        date: day.toLocaleDateString("es-PE", { weekday: "short", day: "numeric" }),
        total,
      });
    }

    return NextResponse.json({
      daily, weekly, monthly,
      expenses: monthExpenses, netProfit, margin,
      lowStock: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map(p => ({ id: p.id, name: p.name, stock: p.stock, minStock: p.minStock })),
      pendingDebts: pendingTotal,
      pendingDebtsCount: pendingSales.length,
      salesByType,
      topProducts,
      chartData: last7Days,
      goals: store.goals.filter(g => g.active),
      stats: {
        products: store.products.filter(p => p.active).length,
        clients: store.clients.filter(c => c.active).length,
        sales: store.sales.length,
        expenses: store.expenses.length,
        totalRevenue: store.sales.reduce((s, x) => s + parseFloat(x.total || "0"), 0),
        totalProfit: store.sales.reduce((s, x) => s + parseFloat(x.profit || "0"), 0),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

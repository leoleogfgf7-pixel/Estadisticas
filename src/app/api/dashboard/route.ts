import { NextResponse } from "next/server";
import { db } from "@/db";
import { sales, expenses, products, goals } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export async function GET() {
  try {
    await requireAuth();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Daily sales
    const dailySales = await db
      .select({
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`.as("total"),
        profit: sql<string>`COALESCE(SUM(${sales.profit}), 0)`.as("profit"),
        count: sql<number>`COUNT(${sales.id})`.as("count"),
      })
      .from(sales)
      .where(and(gte(sales.createdAt, todayStart), lte(sales.createdAt, todayEnd)));

    // Weekly sales
    const weeklySales = await db
      .select({
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`.as("total"),
        profit: sql<string>`COALESCE(SUM(${sales.profit}), 0)`.as("profit"),
        count: sql<number>`COUNT(${sales.id})`.as("count"),
      })
      .from(sales)
      .where(and(gte(sales.createdAt, weekStart), lte(sales.createdAt, todayEnd)));

    // Monthly sales
    const monthlySales = await db
      .select({
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`.as("total"),
        profit: sql<string>`COALESCE(SUM(${sales.profit}), 0)`.as("profit"),
        count: sql<number>`COUNT(${sales.id})`.as("count"),
      })
      .from(sales)
      .where(and(gte(sales.createdAt, monthStart), lte(sales.createdAt, todayEnd)));

    // Monthly expenses
    const monthlyExpenses = await db
      .select({
        total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`.as("total"),
      })
      .from(expenses)
      .where(and(gte(expenses.date, monthStart.toISOString().split("T")[0]), lte(expenses.date, todayEnd.toISOString().split("T")[0])));

    // Low stock products
    const lowStock = await db
      .select({ id: products.id, name: products.name, stock: products.stock, minStock: products.minStock })
      .from(products)
      .where(sql`${products.stock} <= ${products.minStock} AND ${products.active} = true`);

    // Pending debts
    const pendingDebts = await db
      .select({
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`.as("total"),
        count: sql<number>`COUNT(${sales.id})`.as("count"),
      })
      .from(sales)
      .where(eq(sales.paymentStatus, "pending"));

    // Sales by type this month
    const salesByType = await db
      .select({
        type: sales.saleType,
        total: sql<string>`COALESCE(SUM(${sales.total}), 0)`.as("total"),
      })
      .from(sales)
      .where(and(gte(sales.createdAt, monthStart), lte(sales.createdAt, todayEnd)))
      .groupBy(sales.saleType);

    // Top products this month
    const topProducts = await db.execute(sql`
      SELECT p.name, SUM(si.quantity) as quantity, SUM(si.subtotal) as total
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= ${monthStart.toISOString()} AND s.created_at <= ${todayEnd.toISOString()}
      GROUP BY p.name
      ORDER BY total DESC
      LIMIT 5
    `);

    // Daily sales for chart (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayStart);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

      const [result] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${sales.total}), 0)`.as("total"),
        })
        .from(sales)
        .where(and(gte(sales.createdAt, dayStart), lte(sales.createdAt, dayEnd)));

      last7Days.push({
        date: day.toLocaleDateString("es-PE", { weekday: "short", day: "numeric" }),
        total: parseFloat(result.total || "0"),
      });
    }

    // Goals progress
    const activeGoals = await db.select().from(goals).where(eq(goals.active, true));

    const dailyTotal = parseFloat(dailySales[0]?.total || "0");
    const dailyProfit = parseFloat(dailySales[0]?.profit || "0");
    const weeklyTotal = parseFloat(weeklySales[0]?.total || "0");
    const weeklyProfit = parseFloat(weeklySales[0]?.profit || "0");
    const monthlyTotal = parseFloat(monthlySales[0]?.total || "0");
    const monthlyProfit = parseFloat(monthlySales[0]?.profit || "0");
    const monthlyExpenseTotal = parseFloat(monthlyExpenses[0]?.total || "0");
    const netProfit = monthlyProfit - monthlyExpenseTotal;
    const margin = monthlyTotal > 0 ? (netProfit / monthlyTotal) * 100 : 0;

    return NextResponse.json({
      daily: { total: dailyTotal, profit: dailyProfit, count: dailySales[0]?.count || 0 },
      weekly: { total: weeklyTotal, profit: weeklyProfit, count: weeklySales[0]?.count || 0 },
      monthly: { total: monthlyTotal, profit: monthlyProfit, count: monthlySales[0]?.count || 0 },
      expenses: monthlyExpenseTotal,
      netProfit,
      margin,
      lowStock: lowStock.length,
      lowStockProducts: lowStock,
      pendingDebts: parseFloat(pendingDebts[0]?.total || "0"),
      pendingDebtsCount: pendingDebts[0]?.count || 0,
      salesByType,
      topProducts: topProducts.rows || [],
      chartData: last7Days,
      goals: activeGoals,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

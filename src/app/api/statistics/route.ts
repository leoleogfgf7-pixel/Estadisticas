import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, saleItems, products, expenses } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { sql, and, gte, lte, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();

    // Most profitable products
    const mostProfitable = await db.execute(sql`
      SELECT p.name, 
        SUM(si.profit) as total_profit,
        SUM(si.quantity) as total_quantity,
        SUM(si.subtotal) as total_sold,
        AVG(CAST(si.unit_price AS numeric) - CAST(si.unit_cost AS numeric)) as avg_margin
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= ${start.toISOString()} AND s.created_at <= ${end.toISOString()}
      GROUP BY p.name
      ORDER BY total_profit DESC
      LIMIT 10
    `);

    // Most sold products
    const mostSold = await db.execute(sql`
      SELECT p.name, 
        SUM(si.quantity) as total_quantity,
        SUM(si.subtotal) as total_sold
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= ${start.toISOString()} AND s.created_at <= ${end.toISOString()}
      GROUP BY p.name
      ORDER BY total_quantity DESC
      LIMIT 10
    `);

    // Monthly comparison (last 6 months)
    const monthlyComparison = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const [salesResult] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${sales.total}), 0)`.as("total"),
          profit: sql<string>`COALESCE(SUM(${sales.profit}), 0)`.as("profit"),
        })
        .from(sales)
        .where(and(gte(sales.createdAt, monthStart), lte(sales.createdAt, monthEnd)));

      const [expenseResult] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`.as("total"),
        })
        .from(expenses)
        .where(and(
          gte(expenses.date, monthStart.toISOString().split("T")[0]),
          lte(expenses.date, monthEnd.toISOString().split("T")[0])
        ));

      monthlyComparison.push({
        month: monthStart.toLocaleDateString("es-PE", { month: "short", year: "numeric" }),
        sales: parseFloat(salesResult.total),
        expenses: parseFloat(expenseResult.total),
        profit: parseFloat(salesResult.profit),
        netProfit: parseFloat(salesResult.profit) - parseFloat(expenseResult.total),
      });
    }

    // Sales trend (daily for the period)
    const salesTrend: Array<{ date: string; total: number }> = [];
    const trendStart = new Date(Math.max(start.getTime(), now.getTime() - 30 * 24 * 60 * 60 * 1000));
    for (let d = new Date(trendStart); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const [result] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${sales.total}), 0)`.as("total"),
        })
        .from(sales)
        .where(and(gte(sales.createdAt, dayStart), lte(sales.createdAt, dayEnd)));

      salesTrend.push({
        date: d.toLocaleDateString("es-PE", { day: "numeric", month: "short" }),
        total: parseFloat(result.total || "0"),
      });
    }

    // Unsold products (no sales in the period)
    const allProductIds = await db.select({ id: products.id, name: products.name }).from(products).where(eq(products.active, true));
    const soldProductIds = await db
      .select({ productId: saleItems.productId })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(gte(sales.createdAt, start), lte(sales.createdAt, end)))
      .groupBy(saleItems.productId);

    const soldIds = new Set(soldProductIds.map((p) => p.productId));
    const unsold = allProductIds.filter((p) => !soldIds.has(p.id));

    return NextResponse.json({
      mostProfitable: mostProfitable.rows || [],
      mostSold: mostSold.rows || [],
      monthlyComparison,
      salesTrend,
      unsoldProducts: unsold,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Statistics error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

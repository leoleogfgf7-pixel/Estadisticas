"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import KpiCard from "@/components/KpiCard";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface DashboardData {
  daily: { total: number; profit: number; count: number };
  weekly: { total: number; profit: number; count: number };
  monthly: { total: number; profit: number; count: number };
  expenses: number;
  netProfit: number;
  margin: number;
  lowStock: number;
  lowStockProducts: Array<{ id: string; name: string; stock: number; minStock: number }>;
  pendingDebts: number;
  pendingDebtsCount: number;
  salesByType: Array<{ type: string; total: string }>;
  topProducts: Array<{ name: string; quantity: number; total: number }>;
  chartData: Array<{ date: string; total: number }>;
  goals: Array<{ id: string; title: string; targetAmount: string; currentAmount: string; type: string }>;
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse space-y-6 w-full">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-slate-500">Error al cargar el dashboard</p>
          <button onClick={fetchDashboard} className="mt-4 text-amber-500 hover:underline">Reintentar</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Ventas Hoy"
            value={`S/ ${data.daily.total.toFixed(2)}`}
            icon="💰"
            color="amber"
            trend={{ value: data.daily.count, positive: true }}
          />
          <KpiCard
            title="Ganancia Neta (Mes)"
            value={`S/ ${data.netProfit.toFixed(2)}`}
            icon="📈"
            color={data.netProfit >= 0 ? "green" : "red"}
            trend={{ value: parseFloat(data.margin.toFixed(1)), positive: data.margin > 0 }}
          />
          <KpiCard
            title="Gastos del Mes"
            value={`S/ ${data.expenses.toFixed(2)}`}
            icon="💸"
            color="red"
          />
          <KpiCard
            title="Margen de Ganancia"
            value={`${data.margin.toFixed(1)}%`}
            icon="🎯"
            color="purple"
            trend={{ value: parseFloat(data.margin.toFixed(1)), positive: data.margin > 20 }}
          />
        </div>

        {/* Alerts */}
        {(data.lowStock > 0 || data.pendingDebtsCount > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.lowStock > 0 && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400">Stock Bajo</p>
                  <p className="text-sm text-red-600 dark:text-red-400/80">
                    {data.lowStock} producto(s) con stock bajo mínimo
                  </p>
                </div>
              </div>
            )}
            {data.pendingDebtsCount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">🔔</span>
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">Deudas Pendientes</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400/80">
                    {data.pendingDebtsCount} deuda(s) por S/ {data.pendingDebts.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Ventas - Últimos 7 Días</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(30,41,59,0.95)",
                      border: "1px solid rgba(148,163,184,0.3)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Type */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Ventas por Tipo (Mes)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.salesByType.map((s) => ({
                      name: s.type === "retail" ? "Por Menor" : s.type === "wholesale" ? "Por Mayor" : "Especial",
                      value: parseFloat(s.total),
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.salesByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(30,41,59,0.95)",
                      border: "1px solid rgba(148,163,184,0.3)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: unknown) => `S/ ${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products + Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Productos Más Vendidos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data.topProducts || []).map((p: any) => ({
                  name: p.name?.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
                  cantidad: Number(p.quantity),
                  total: Number(p.total),
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(30,41,59,0.95)",
                      border: "1px solid rgba(148,163,184,0.3)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="total" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Total S/" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Metas</h3>
            {data.goals.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <span className="text-4xl">🎯</span>
                <p className="mt-2">No hay metas definidas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.goals.map((goal) => {
                  const progress = parseFloat(goal.targetAmount) > 0
                    ? (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100
                    : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{goal.title}</span>
                        <span className="text-slate-500">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>S/ {parseFloat(goal.currentAmount).toFixed(2)}</span>
                        <span>S/ {parseFloat(goal.targetAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        {data.lowStockProducts.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Productos con Stock Bajo</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium">Stock Actual</th>
                    <th className="pb-2 font-medium">Stock Mínimo</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStockProducts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2.5 text-slate-900 dark:text-white">{p.name}</td>
                      <td className="py-2.5 font-medium text-red-600">{p.stock}</td>
                      <td className="py-2.5 text-slate-500">{p.minStock}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                          {p.stock === 0 ? "Agotado" : "Bajo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

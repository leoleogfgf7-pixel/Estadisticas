"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import KpiCard from "@/components/KpiCard";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface DashboardData {
  daily: { total: number; profit: number; count: number };
  weekly: { total: number; profit: number; count: number };
  monthly: { total: number; profit: number; count: number };
  expenses: number; netProfit: number; margin: number;
  lowStock: number; lowStockProducts: Array<{ id: string; name: string; stock: number; minStock: number }>;
  pendingDebts: number; pendingDebtsCount: number;
  salesByType: Array<{ type: string; total: string }>;
  topProducts: Array<{ name: string; quantity: number; total: number }>;
  chartData: Array<{ date: string; total: number }>;
  goals: Array<{ id: string; title: string; targetAmount: string; currentAmount: string; type: string }>;
  stats: { products: number; clients: number; sales: number; expenses: number; totalRevenue: number; totalProfit: number };
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];

// ─── Welcome Panel (when empty) ────────────────────────────────────
function WelcomePanel() {
  const quickActions = [
    { href: "/sales/new", icon: "🛒", title: "Nueva Venta", desc: "Registrar una venta rápida", color: "from-amber-500 to-amber-600" },
    { href: "/products", icon: "📦", title: "Agregar Producto", desc: "Cargar tu primer producto al stock", color: "from-blue-500 to-blue-600" },
    { href: "/clients", icon: "👥", title: "Agregar Cliente", desc: "Crear tu primer cliente", color: "from-emerald-500 to-emerald-600" },
    { href: "/settings", icon: "⚙️", title: "Configurar Negocio", desc: "Nombre, moneda, colores y más", color: "from-purple-500 to-purple-600" },
  ];

  const tips = [
    { icon: "💰", title: "Define tus precios", text: "Configura costo, precio menor, mayor y especial por producto." },
    { icon: "📊", title: "Controla tu inventario", text: "El sistema avisa cuando un producto llega al stock mínimo." },
    { icon: "🎯", title: "Establece metas", text: "Define objetivos de ventas mensuales para mantener el foco." },
    { icon: "📄", title: "Genera comprobantes", text: "Cada venta genera un PDF listo para imprimir o enviar." },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 sm:p-12 border border-slate-700/50">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium mb-4">
            ✨ Bienvenido a ArenaPOS
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Comencemos a gestionar tu negocio
          </h1>
          <p className="text-slate-400 max-w-xl mb-6">
            Tu panel está vacío — perfecto para empezar desde cero. Sigue estos pasos rápidos y en minutos estarás operando.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sales/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm transition-colors shadow-lg shadow-amber-500/20">
              🛒 Hacer mi primera venta
            </Link>
            <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-sm transition-colors border border-white/10">
              📦 Cargar productos
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center text-white text-xl shadow-md mb-3`}>
                {a.icon}
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{a.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Consejos profesionales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tips.map((t, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="text-2xl mb-2">{t.icon}</div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{t.title}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Panel - EMPTY MODE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📊 Tus estadísticas (en tiempo real)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Ventas Hoy", value: "S/ 0.00", icon: "🗓️", color: "text-amber-600" },
            { label: "Ventas Semana", value: "S/ 0.00", icon: "📅", color: "text-blue-600" },
            { label: "Ventas Mes", value: "S/ 0.00", icon: "📆", color: "text-purple-600" },
            { label: "Ganancia Bruta", value: "S/ 0.00", icon: "📈", color: "text-emerald-600" },
            { label: "Ganancia Neta", value: "S/ 0.00", icon: "💰", color: "text-emerald-600" },
          ].map((s, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs text-slate-500 font-medium">{s.label}</span>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          Comienza a registrar ventas y tus estadísticas aparecerán aquí automáticamente.
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        // Empty if no products AND no sales AND no clients AND no expenses
        const s = json.stats || {};
        setIsEmpty(s.products === 0 && s.sales === 0 && s.clients === 0 && s.expenses === 0);
      }
    } catch (err) {
      console.error(err);
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
              {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isEmpty) {
    return <AppLayout><WelcomePanel /></AppLayout>;
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button onClick={fetchDashboard} className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            🔄 Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Ventas Hoy" value={`S/ ${data.daily.total.toFixed(2)}`} icon="💰" color="amber" trend={{ value: data.daily.count, positive: true }} />
          <KpiCard title="Ganancia Neta (Mes)" value={`S/ ${data.netProfit.toFixed(2)}`} icon="📈" color={data.netProfit >= 0 ? "green" : "red"} trend={{ value: parseFloat(data.margin.toFixed(1)), positive: data.margin > 0 }} />
          <KpiCard title="Gastos del Mes" value={`S/ ${data.expenses.toFixed(2)}`} icon="💸" color="red" />
          <KpiCard title="Margen de Ganancia" value={`${data.margin.toFixed(1)}%`} icon="🎯" color="purple" trend={{ value: parseFloat(data.margin.toFixed(1)), positive: data.margin > 20 }} />
        </div>

        {/* Quick Stats Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">📊 Resumen Rápido</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Ventas Hoy</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">S/ {data.daily.total.toFixed(2)}</p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">{data.daily.count} venta(s)</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/50">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Ventas Semana</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">S/ {data.weekly.total.toFixed(2)}</p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">{data.weekly.count} venta(s)</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/50">
              <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">Ventas Mes</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">S/ {data.monthly.total.toFixed(2)}</p>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">{data.monthly.count} venta(s)</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">Ganancia Bruta</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">S/ {data.monthly.profit.toFixed(2)}</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Mes actual</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">Ganancia Neta</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">S/ {data.netProfit.toFixed(2)}</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Margen: {data.margin.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {(data.lowStock > 0 || data.pendingDebtsCount > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.lowStock > 0 && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-400">Stock Bajo</p>
                  <p className="text-sm text-red-600 dark:text-red-400/80">{data.lowStock} producto(s) con stock bajo mínimo</p>
                </div>
              </div>
            )}
            {data.pendingDebtsCount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xl">🔔</span>
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">Deudas Pendientes</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400/80">{data.pendingDebtsCount} deuda(s) por S/ {data.pendingDebts.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Ventas - Últimos 7 Días</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(30,41,59,0.95)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "8px", color: "#fff" }} />
                  <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

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
                    cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                    {data.salesByType.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(30,41,59,0.95)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "8px", color: "#fff" }} formatter={(value: unknown) => `S/ ${Number(value).toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(30,41,59,0.95)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "8px", color: "#fff" }} />
                  <Bar dataKey="total" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Total S/" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Metas</h3>
            {data.goals.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <span className="text-5xl">🎯</span>
                <h3 className="mt-4 font-semibold text-slate-700 dark:text-slate-300">Sin metas definidas</h3>
                <p className="text-sm mt-1">Establece metas de ventas o ganancias</p>
                <Link href="/goals" className="inline-block mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg">+ Crear meta</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {data.goals.map((g) => {
                  const progress = parseFloat(g.targetAmount) > 0 ? (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100 : 0;
                  return (
                    <div key={g.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{g.title}</span>
                        <span className="font-semibold text-amber-600">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div className="bg-gradient-to-r from-purple-500 to-amber-500 h-3 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, progress)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>S/ {parseFloat(g.currentAmount).toFixed(2)}</span>
                        <span>Meta: S/ {parseFloat(g.targetAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
                      <td className="py-2.5 text-slate-900 dark:text-white font-medium">{p.name}</td>
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

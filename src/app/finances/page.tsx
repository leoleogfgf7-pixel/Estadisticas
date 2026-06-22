"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import KpiCard from "@/components/KpiCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function FinancesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/statistics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <AppLayout><div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" /></div></AppLayout>;
  if (!data) return <AppLayout><p className="text-slate-500">Error al cargar datos</p></AppLayout>;

  const totalSales = data.monthlyComparison?.reduce((sum: number, m: any) => sum + m.sales, 0) || 0;
  const totalExpenses = data.monthlyComparison?.reduce((sum: number, m: any) => sum + m.expenses, 0) || 0;
  const totalProfit = data.monthlyComparison?.reduce((sum: number, m: any) => sum + m.profit, 0) || 0;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Balance General</h1>
          <p className="text-slate-500 text-sm mt-1">Resumen financiero</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard title="Ingresos Totales" value={`S/ ${totalSales.toFixed(2)}`} icon="💰" color="green" />
          <KpiCard title="Egresos Totales" value={`S/ ${totalExpenses.toFixed(2)}`} icon="💸" color="red" />
          <KpiCard title="Utilidad Neta" value={`S/ ${totalProfit.toFixed(2)}`} icon="📈" color={totalProfit >= 0 ? "blue" : "red"} />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="font-semibold mb-4">Comparación Mensual</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(30,41,59,0.95)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="sales" fill="#f59e0b" name="Ventas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" fill="#10b981" name="Ganancia Neta" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                  <th className="px-4 py-3 font-medium">Mes</th>
                  <th className="px-4 py-3 font-medium text-right">Ventas</th>
                  <th className="px-4 py-3 font-medium text-right">Gastos</th>
                  <th className="px-4 py-3 font-medium text-right">Ganancia Bruta</th>
                  <th className="px-4 py-3 font-medium text-right">Ganancia Neta</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyComparison?.map((m: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-medium">{m.month}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">S/ {m.sales.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-red-600">S/ {m.expenses.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">S/ {m.profit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold">S/ {m.netProfit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

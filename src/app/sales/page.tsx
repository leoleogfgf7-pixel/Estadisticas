"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { formatDateTime } from "@/lib/utils";

interface Sale {
  id: string;
  clientId: string | null;
  clientName: string | null;
  saleType: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  tax: string;
  total: string;
  profit: string;
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("month");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => { fetchSales(); }, [dateFilter, statusFilter]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const now = new Date();
      if (dateFilter === "today") {
        params.set("startDate", now.toISOString().split("T")[0]);
        params.set("endDate", now.toISOString().split("T")[0]);
      } else if (dateFilter === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        params.set("startDate", weekStart.toISOString().split("T")[0]);
        params.set("endDate", now.toISOString().split("T")[0]);
      } else if (dateFilter === "month") {
        params.set("startDate", new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
        params.set("endDate", now.toISOString().split("T")[0]);
      }
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/sales?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    window.open(`/api/export/sales?${new URLSearchParams(dateFilter ? { startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0] } : {}).toString()}`, "_blank");
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Historial de Ventas</h1>
            <p className="text-slate-500 text-sm mt-1">{sales.length} ventas encontradas</p>
          </div>
          <button onClick={exportExcel} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg text-sm transition-colors">
            📥 Exportar Excel
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {(["today", "week", "month", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateFilter === f
                  ? "bg-amber-500 text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {f === "today" ? "Hoy" : f === "week" ? "Semana" : f === "month" ? "Mes" : "Todo"}
            </button>
          ))}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300"
          >
            <option value="">Todos los estados</option>
            <option value="paid">Pagado</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
          </select>
        </div>

        {/* Sales Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Pago</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Ganancia</th>
                  <th className="px-4 py-3 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">Cargando...</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <span className="text-4xl">💰</span>
                    <p className="mt-2">No hay ventas en este periodo</p>
                  </td></tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-xs text-amber-600">#{s.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{formatDateTime(s.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">{s.clientName || "General"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                          {s.saleType === "retail" ? "Menor" : s.saleType === "wholesale" ? "Mayor" : "Especial"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{s.paymentMethod}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : s.paymentStatus === "partial"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        }`}>
                          {s.paymentStatus === "paid" ? "Pagado" : s.paymentStatus === "partial" ? "Parcial" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">S/ {parseFloat(s.total).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">S/ {parseFloat(s.profit).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <a href={`/api/sales/${s.id}/pdf`} target="_blank" className="text-blue-500 hover:text-blue-600 text-xs font-medium">📄 Ver</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

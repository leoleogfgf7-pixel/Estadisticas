"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from "recharts";

export default function StatisticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/statistics?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Estadísticas Avanzadas</h1>
            <p className="text-slate-500 text-sm mt-1">Análisis detallado de rendimiento</p>
          </div>
          <div className="flex gap-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white dark:bg-slate-900 border rounded-lg px-3 py-2 text-sm" />
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white dark:bg-slate-900 border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        ) : data ? (
          <>
            {/* Sales Trend */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-semibold mb-4">Tendencia de Ventas</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(30,41,59,0.95)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "8px", color: "#fff" }} />
                    <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Most Profitable + Most Sold */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="font-semibold mb-4">Productos Más Rentables</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.mostProfitable} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(30,41,59,0.95)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "8px", color: "#fff" }} />
                      <Bar dataKey="total_profit" fill="#10b981" radius={[0, 4, 4, 0]} name="Ganancia" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="font-semibold mb-4">Productos Más Vendidos</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.mostSold} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(30,41,59,0.95)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "8px", color: "#fff" }} />
                      <Bar dataKey="total_quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Cantidad" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Unsold Products */}
            {data.unsoldProducts?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="font-semibold mb-2">⚠️ Productos Sin Vender en el Periodo</h3>
                <p className="text-sm text-slate-500 mb-4">Recomendación: considere promociones o ajuste de precios</p>
                <div className="flex flex-wrap gap-2">
                  {data.unsoldProducts.map((p: any) => (
                    <span key={p.id} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}

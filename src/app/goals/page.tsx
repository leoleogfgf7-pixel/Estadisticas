"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

interface Goal {
  id: string; title: string; targetAmount: string; currentAmount: string;
  type: string; period: string; startDate: string; endDate: string; active: boolean;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", targetAmount: "", type: "sales", period: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
  });

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) { const d = await res.json(); setGoals(d.goals); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ title: "", targetAmount: "", type: "sales", period: "monthly", startDate: new Date().toISOString().split("T")[0], endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0] });
      fetchGoals();
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Metas y Objetivos</h1>
            <p className="text-slate-500 text-sm mt-1">{goals.filter(g => g.active).length} metas activas</p>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors shadow-sm">
            <span>+</span> Nueva Meta
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center py-12 text-slate-400 animate-pulse">Cargando...</div>
          ) : goals.length === 0 ? (
            <div className="col-span-3 bg-white dark:bg-slate-900 rounded-xl border p-12 text-center">
              <span className="text-5xl">🎯</span>
              <h3 className="mt-4 font-semibold">Sin metas definidas</h3>
              <p className="text-slate-500 text-sm mt-1">Establece metas de ventas, ganancias o clientes</p>
            </div>
          ) : (
            goals.map(g => {
              const progress = parseFloat(g.targetAmount) > 0 ? (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100 : 0;
              return (
                <div key={g.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{g.title}</h3>
                      <span className="text-xs text-slate-400 capitalize">{g.type} · {g.period}</span>
                    </div>
                    <span className="text-2xl">{g.type === "sales" ? "💰" : g.type === "profit" ? "📈" : "👥"}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Progreso</span>
                      <span className="font-semibold text-amber-600">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-purple-500 to-amber-500 h-3 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>S/ {parseFloat(g.currentAmount).toFixed(2)}</span>
                    <span>Meta: S/ {parseFloat(g.targetAmount).toFixed(2)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                    {new Date(g.startDate).toLocaleDateString("es-PE")} → {new Date(g.endDate).toLocaleDateString("es-PE")}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl animate-slide-up">
                <div className="p-6">
                  <h2 className="text-lg font-bold mb-4">Nueva Meta</h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Título *</label>
                      <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Ventas enero 2026" className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Monto Meta *</label>
                        <input type="number" step="0.01" value={form.targetAmount} onChange={e => setForm({...form, targetAmount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm">
                          <option value="sales">Ventas</option>
                          <option value="profit">Ganancias</option>
                          <option value="clients">Clientes</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Periodo</label>
                        <select value={form.period} onChange={e => setForm({...form, period: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm">
                          <option value="daily">Diario</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Inicio</label>
                        <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Fin</label>
                      <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm">Cancelar</button>
                      <button type="submit" className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg text-sm">Crear Meta</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

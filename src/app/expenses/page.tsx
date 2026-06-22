"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { formatDate } from "@/lib/utils";

interface Expense {
  id: string; categoryName: string | null; description: string;
  amount: string; date: string;
}

interface Category {
  id: string; name: string; color: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", categoryId: "", date: new Date().toISOString().split("T")[0] });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [resE, resC] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/expenses/categories"),
      ]);
      if (resE.ok) { const d = await resE.json(); setExpenses(d.expenses); }
      if (resC.ok) { const d = await resC.json(); setCategories(d.categories); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ description: "", amount: "", categoryId: "", date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      fetchData();
    }
  };

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gastos</h1>
            <p className="text-slate-500 text-sm mt-1">Total: <span className="font-semibold text-red-600">S/ {total.toFixed(2)}</span></p>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-sm">
            <span>+</span> Nuevo Gasto
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">Cargando...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    <span className="text-4xl">💸</span><p className="mt-2">No hay gastos registrados</p>
                  </td></tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-500">{formatDate(e.date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{e.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {e.categoryName || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">S/ {parseFloat(e.amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl animate-slide-up">
                <div className="p-6">
                  <h2 className="text-lg font-bold mb-4">Nuevo Gasto</h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Descripción *</label>
                      <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Monto *</label>
                        <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Fecha</label>
                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Categoría</label>
                      <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm">
                        <option value="">Sin categoría</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border rounded-lg text-sm">Cancelar</button>
                      <button type="submit" className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg text-sm">Registrar</button>
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

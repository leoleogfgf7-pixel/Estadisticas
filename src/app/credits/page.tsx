"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { formatDate } from "@/lib/utils";

interface Credit {
  id: string; clientName: string | null; total: string; paymentStatus: string;
  dueDate: string | null; createdAt: string; saleType: string; paymentMethod: string;
}

interface Payment {
  id: string; saleId: string; amount: string; method: string; notes: string | null; createdAt: string;
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "cash", notes: "" });

  useEffect(() => { fetchCredits(); }, []);

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/sales?status=pending");
      if (res.ok) {
        const data = await res.json();
        setCredits(data.sales);
      }
      const res2 = await fetch("/api/sales?status=partial");
      if (res2.ok) {
        const data2 = await res2.json();
        setCredits(prev => [...prev, ...data2.sales]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (saleId: string) => {
    const res = await fetch(`/api/payments?saleId=${saleId}`);
    if (res.ok) {
      const data = await res.json();
      setPayments(data.payments);
    }
  };

  const openPayment = (saleId: string) => {
    setSelectedSale(saleId);
    setPaymentForm({ amount: "", method: "cash", notes: "" });
    fetchPayments(saleId);
    setShowPayment(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saleId: selectedSale,
        amount: paymentForm.amount,
        method: paymentForm.method,
        notes: paymentForm.notes || null,
      }),
    });
    if (res.ok) {
      setShowPayment(false);
      fetchCredits();
    }
  };

  const overdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Créditos y Deudas</h1>
          <p className="text-slate-500 text-sm mt-1">Control de ventas fiadas y pagos pendientes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Venta</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Cargando...</td></tr>
                ) : credits.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <span className="text-4xl">💳</span>
                    <p className="mt-2">No hay deudas pendientes</p>
                  </td></tr>
                ) : (
                  credits.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-xs text-amber-600">#{c.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.clientName || "General"}</td>
                      <td className="px-4 py-3 font-semibold">S/ {parseFloat(c.total).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.paymentStatus === "partial"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        }`}>
                          {c.paymentStatus === "partial" ? "Parcial" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={overdue(c.dueDate) ? "text-red-600 font-medium" : "text-slate-500"}>
                          {c.dueDate ? formatDate(c.dueDate) : "-"}
                          {overdue(c.dueDate) && " ⚠️"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openPayment(c.id)} className="text-blue-500 hover:text-blue-600 text-xs font-medium">
                          Registrar Pago
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Modal */}
        {showPayment && selectedSale && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowPayment(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl animate-slide-up">
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Registrar Pago</h2>

                  {/* Payment history */}
                  {payments.length > 0 && (
                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-xs font-medium text-slate-500 mb-2">Historial de pagos:</p>
                      {payments.map((p) => (
                        <div key={p.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-300 py-1">
                          <span>{formatDate(p.createdAt)}</span>
                          <span className="font-medium">S/ {parseFloat(p.amount).toFixed(2)}</span>
                          <span className="text-slate-400">{p.method}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handlePayment} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto *</label>
                      <input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Método</label>
                      <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm">
                        <option value="cash">Efectivo</option>
                        <option value="yape">Yape</option>
                        <option value="plin">Plin</option>
                        <option value="card">Tarjeta</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                      <input type="text" value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowPayment(false)} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm">Cancelar</button>
                      <button type="submit" className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm">Registrar</button>
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

"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

interface Movement {
  id: string; productName: string; type: string; quantity: number;
  reason: string; referenceId: string | null; createdAt: string;
}

interface Product {
  id: string; name: string; stock: number; minStock: number; cost: string;
}

export default function InventoryPage() {
  const [tab, setTab] = useState<"movements" | "entry" | "alerts">("movements");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ productId: "", type: "entry", quantity: "1", reason: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [resM, resP] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/products"),
      ]);
      if (resM.ok) { const d = await resM.json(); setMovements(d.movements); }
      if (resP.ok) { const d = await resP.json(); setProducts(d.products.filter((p: any) => p.active)); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: parseInt(form.quantity) }),
    });
    if (res.ok) {
      setForm({ productId: "", type: "entry", quantity: "1", reason: "" });
      fetchData();
    }
  };

  const totalStockValue = products.reduce((sum, p) => sum + parseFloat(p.cost) * p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalProducts = products.length;
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario</h1>
            <p className="text-slate-500 text-sm mt-1">{totalProducts} productos · {totalItems} items · Valor S/ {totalStockValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 w-fit">
          {(["movements", "entry", "alerts"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t === "movements" ? "📋 Historial" : t === "entry" ? "📥 Registrar Movimiento" : "⚠️ Alertas"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "movements" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Cantidad</th>
                    <th className="px-4 py-3 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Cargando...</td></tr>
                  ) : movements.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Sin movimientos</td></tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(m.createdAt).toLocaleString("es-PE")}</td>
                        <td className="px-4 py-3 font-medium">{m.productName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            m.type === "entry" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                          }`}>
                            {m.type === "entry" ? "Entrada" : "Salida"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{m.quantity}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{m.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "entry" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Producto *</label>
                <select value={form.productId} onChange={e => setForm({...form, productId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required>
                  <option value="">Seleccionar producto</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo *</label>
                <div className="flex gap-2">
                  {(["entry", "exit"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setForm({...form, type: t})}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                        form.type === t ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                      }`}>
                      {t === "entry" ? "📥 Entrada" : "📤 Salida"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cantidad *</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Motivo *</label>
                <input type="text" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Ej: Compra a proveedor, ajuste..." className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm">Registrar Movimiento</button>
            </form>
          </div>
        )}

        {tab === "alerts" && (
          <div className="space-y-4">
            {lowStockProducts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border p-8 text-center text-slate-400">
                <span className="text-4xl">✅</span><p className="mt-2">Todo en orden, no hay alertas</p>
              </div>
            ) : (
              lowStockProducts.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-red-600">Stock: {p.stock} / Mín: {p.minStock}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                    {p.stock === 0 ? "Agotado" : "Reponer"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

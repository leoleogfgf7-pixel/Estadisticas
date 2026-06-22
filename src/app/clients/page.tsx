"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

interface Client {
  id: string; name: string; documentType: string; documentNumber: string | null;
  email: string | null; phone: string | null; address: string | null;
  type: string; notes: string | null; active: boolean;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: "", documentType: "DNI", documentNumber: "", email: "",
    phone: "", address: "", type: "frequent", notes: "",
  });

  useEffect(() => { fetchClients(); }, [search]);

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", documentType: "DNI", documentNumber: "", email: "", phone: "", address: "", type: "frequent", notes: "" });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name, documentType: c.documentType, documentNumber: c.documentNumber || "",
      email: c.email || "", phone: c.phone || "", address: c.address || "",
      type: c.type, notes: c.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/clients/${editing.id}` : "/api/clients";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { resetForm(); fetchClients(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Desactivar este cliente?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    fetchClients();
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
            <p className="text-slate-500 text-sm mt-1">{clients.filter(c => c.active).length} clientes activos</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-sm">
            <span>+</span> Nuevo Cliente
          </button>
        </div>

        <input
          type="text" placeholder="Buscar cliente..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.filter(c => c.active).map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3 text-slate-500">{c.documentNumber || "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{c.phone || "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{c.email || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.type === "wholesale"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      }`}>
                        {c.type === "wholesale" ? "Mayorista" : "Frecuente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-blue-500 hover:text-blue-600 text-xs font-medium">Editar</button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-600 text-xs font-medium">Desactivar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clients.filter(c => c.active).length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <span className="text-4xl">👥</span>
                    <p className="mt-2">No hay clientes registrados</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={resetForm} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl animate-slide-up">
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editing ? "Editar Cliente" : "Nuevo Cliente"}</h2>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo Doc.</label>
                        <select value={form.documentType} onChange={e => setForm({...form, documentType: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm">
                          <option value="DNI">DNI</option>
                          <option value="RUC">RUC</option>
                          <option value="CE">CE</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">N° Documento</label>
                        <input type="text" value={form.documentNumber} onChange={e => setForm({...form, documentNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                        <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                      <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm">
                        <option value="frequent">Frecuente</option>
                        <option value="wholesale">Mayorista</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
                      <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                      <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm">Cancelar</button>
                      <button type="submit" className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm">{editing ? "Guardar" : "Crear"}</button>
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

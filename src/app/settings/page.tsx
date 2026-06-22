"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"business" | "users" | "categories">("business");

  // Categories for expenses
  const [categories, setCategories] = useState<any[]>([]);
  const [newCat, setNewCat] = useState("");

  // Register user form
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", role: "seller" });

  useEffect(() => { fetchSettings(); fetchCategories(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const d = await res.json();
        setSettings(d.settings);
        // Pre-fill
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/expenses/categories");
      if (res.ok) { const d = await res.json(); setCategories(d.categories); }
    } catch (err) { console.error(err); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setMessage("✅ Configuración guardada correctamente");
    } else {
      setMessage("❌ Error al guardar");
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regForm),
    });
    if (res.ok) {
      setRegForm({ name: "", email: "", password: "", role: "seller" });
      setMessage("✅ Usuario creado correctamente");
    } else {
      const d = await res.json();
      setMessage(`❌ ${d.error}`);
    }
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    const res = await fetch("/api/expenses/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat }),
    });
    if (res.ok) {
      setNewCat("");
      fetchCategories();
      setMessage("✅ Categoría creada");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) return <AppLayout><div className="animate-pulse h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" /></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración</h1>
          <p className="text-slate-500 text-sm mt-1">Personaliza tu sistema</p>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.includes("✅") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 w-fit">
          {(["business", "users", "categories"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"
              }`}>
              {t === "business" ? "🏪 Negocio" : t === "users" ? "👤 Usuarios" : "📂 Categorías"}
            </button>
          ))}
        </div>

        {/* Business Settings */}
        {tab === "business" && settings && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Negocio</label>
                <input type="text" value={settings.businessName} onChange={e => setSettings({...settings, businessName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Moneda</label>
                  <select value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm">
                    <option value="S/">S/ - Sol Peruano</option>
                    <option value="$">$ - Dólar</option>
                    <option value="€">€ - Euro</option>
                    <option value="MX$">MX$ - Peso Mexicano</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IGV (%)</label>
                  <input type="number" step="0.01" value={settings.taxRate} onChange={e => setSettings({...settings, taxRate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Color Principal</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} className="w-10 h-10 rounded cursor-pointer" />
                    <input type="text" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} className="flex-1 bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color Secundario</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.secondaryColor} onChange={e => setSettings({...settings, secondaryColor: e.target.value})} className="w-10 h-10 rounded cursor-pointer" />
                    <input type="text" value={settings.secondaryColor} onChange={e => setSettings({...settings, secondaryColor: e.target.value})} className="flex-1 bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input type="text" value={settings.address || ""} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input type="text" value={settings.phone || ""} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={settings.email || ""} onChange={e => setSettings({...settings, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar Configuración"}
              </button>
            </form>
          </div>
        )}

        {/* Users */}
        {tab === "users" && user?.role === "admin" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md">
            <h3 className="font-semibold mb-4">Registrar Nuevo Usuario</h3>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input type="text" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña *</label>
                <input type="password" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select value={regForm.role} onChange={e => setRegForm({...regForm, role: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm">
                  <option value="seller">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-sm">
                {saving ? "Creando..." : "Crear Usuario"}
              </button>
            </form>
          </div>
        )}
        {tab === "users" && user?.role !== "admin" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-8 text-center text-slate-400">
            <span className="text-4xl">🔒</span><p className="mt-2">Solo administradores pueden gestionar usuarios</p>
          </div>
        )}

        {/* Categories */}
        {tab === "categories" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md">
            <h3 className="font-semibold mb-4">Categorías de Gastos</h3>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nueva categoría..." className="flex-1 bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-sm" />
              <button onClick={handleAddCategory} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm">Agregar</button>
            </div>
            <div className="space-y-2">
              {categories.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm">{c.name}</span>
                </div>
              ))}
              {categories.length === 0 && <p className="text-slate-400 text-sm">Sin categorías</p>}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

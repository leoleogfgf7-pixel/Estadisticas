"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/auth-context";

type Tab = "business" | "categories" | "backup";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("business");
  const [categories, setCategories] = useState<any[]>([]);
  const [newCat, setNewCat] = useState("");

  useEffect(() => { fetchSettings(); fetchCategories(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) { const d = await res.json(); setSettings(d.settings); }
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
    setSaving(true); setMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) setMessage("✅ Configuración guardada");
    else setMessage("❌ Error al guardar");
    setSaving(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    const res = await fetch("/api/expenses/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat }),
    });
    if (res.ok) { setNewCat(""); fetchCategories(); setMessage("✅ Categoría creada"); setTimeout(() => setMessage(""), 2500); }
  };

  const handleBackup = async () => {
    window.location.href = "/api/backup";
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await fetch("/api/backup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: text }),
    });
    if (res.ok) {
      setMessage("✅ Datos restaurados - recargando...");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setMessage("❌ Archivo inválido");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleReset = async () => {
    if (!confirm("⚠️ ¿Borrar TODOS los datos y empezar de cero? Esta acción NO se puede deshacer.")) return;
    const res = await fetch("/api/backup", { method: "DELETE" });
    if (res.ok) {
      setMessage("✅ Datos reiniciados - recargando...");
      setTimeout(() => window.location.reload(), 1500);
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

        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 w-fit">
          {([
            ["business", "🏪 Negocio"],
            ["categories", "📂 Categorías"],
            ["backup", "💾 Backup"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "business" && settings && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Negocio</label>
                <input type="text" value={settings.businessName} onChange={e => setSettings({...settings, businessName: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Moneda</label>
                  <select value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm">
                    <option value="S/">S/ - Sol Peruano</option>
                    <option value="$">$ - Dólar</option>
                    <option value="€">€ - Euro</option>
                    <option value="MX$">MX$ - Peso Mexicano</option>
                    <option value="R$">R$ - Real Brasilero</option>
                    <option value="₡">₡ - Colón</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IGV / Impuesto (%)</label>
                  <input type="number" step="0.01" value={settings.taxRate} onChange={e => setSettings({...settings, taxRate: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Color Principal</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer" />
                    <input type="text" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color Secundario</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={settings.secondaryColor} onChange={e => setSettings({...settings, secondaryColor: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer" />
                    <input type="text" value={settings.secondaryColor} onChange={e => setSettings({...settings, secondaryColor: e.target.value})}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input type="text" value={settings.address || ""} onChange={e => setSettings({...settings, address: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input type="text" value={settings.phone || ""} onChange={e => setSettings({...settings, phone: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={settings.email || ""} onChange={e => setSettings({...settings, email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm disabled:opacity-50 transition-colors">
                {saving ? "Guardando..." : "Guardar Configuración"}
              </button>
            </form>
          </div>
        )}

        {tab === "categories" && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl">
            <h3 className="font-semibold mb-4">Categorías de Gastos</h3>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)}
                placeholder="Nueva categoría..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm"
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddCategory())} />
              <button onClick={handleAddCategory} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm">Agregar</button>
            </div>
            <div className="space-y-2">
              {categories.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
              ))}
              {categories.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sin categorías</p>}
            </div>
          </div>
        )}

        {tab === "backup" && (
          <div className="space-y-4 max-w-2xl">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-lg bg-blue-500/10 flex items-center justify-center text-2xl">💾</div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Exportar datos</h3>
                  <p className="text-sm text-slate-500 mt-1">Descarga un backup completo de tu negocio (productos, clientes, ventas, gastos, etc).</p>
                </div>
              </div>
              <button onClick={handleBackup} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg text-sm shadow-sm">
                📥 Descargar Backup
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center text-2xl">📤</div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Restaurar desde backup</h3>
                  <p className="text-sm text-slate-500 mt-1">Carga un archivo .json de backup anterior para restaurar tus datos.</p>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg text-sm cursor-pointer shadow-sm">
                📂 Seleccionar archivo
                <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
              </label>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-800 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-lg bg-red-500/10 flex items-center justify-center text-2xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-400">Reiniciar datos</h3>
                  <p className="text-sm text-slate-500 mt-1">Borra TODO y empieza desde cero. Acción irreversible.</p>
                </div>
              </div>
              <button onClick={handleReset} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg text-sm shadow-sm">
                🗑️ Reiniciar Todo
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

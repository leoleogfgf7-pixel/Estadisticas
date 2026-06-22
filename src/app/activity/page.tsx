"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

interface Log {
  id: string; userName: string | null; action: string; entity: string;
  entityId: string | null; details: string | null; createdAt: string;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/activity");
      if (res.ok) { const d = await res.json(); setLogs(d.logs); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Registro de Actividad</h1>
          <p className="text-slate-500 text-sm mt-1">Últimas 100 acciones en el sistema</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Acción</th>
                  <th className="px-4 py-3 font-medium">Entidad</th>
                  <th className="px-4 py-3 font-medium">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Cargando...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <span className="text-4xl">📝</span><p className="mt-2">No hay actividad registrada</p>
                  </td></tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString("es-PE")}
                      </td>
                      <td className="px-4 py-3 font-medium">{l.userName || "Sistema"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          l.action === "create" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                          l.action === "update" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" :
                          l.action === "delete" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {l.action === "create" ? "Creó" : l.action === "update" ? "Actualizó" : l.action === "delete" ? "Eliminó" : l.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs capitalize">{l.entity}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">{l.details || "-"}</td>
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

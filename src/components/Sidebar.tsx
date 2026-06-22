"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const menuItems = [
  {
    group: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: "📊" },
      { href: "/sales/new", label: "Nueva Venta", icon: "🛒" },
    ],
  },
  {
    group: "Gestión",
    items: [
      { href: "/sales", label: "Ventas", icon: "💰" },
      { href: "/products", label: "Stock", icon: "📦" },
      { href: "/clients", label: "Clientes", icon: "👥" },
      { href: "/credits", label: "Créditos", icon: "💳" },
    ],
  },
  {
    group: "Finanzas",
    items: [
      { href: "/expenses", label: "Gastos", icon: "💸" },
      { href: "/finances", label: "Balance", icon: "📋" },
    ],
  },
  {
    group: "Análisis",
    items: [
      { href: "/statistics", label: "Estadísticas", icon: "📈" },
      { href: "/inventory", label: "Inventario", icon: "🏭" },
      { href: "/goals", label: "Metas", icon: "🎯" },
    ],
  },
  {
    group: "Sistema",
    items: [
      { href: "/activity", label: "Actividad", icon: "📝" },
      { href: "/settings", label: "Configuración", icon: "⚙️" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-amber-500/20">
          MN
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base leading-tight truncate">Mi Negocio</h1>
            <p className="text-slate-400 text-xs">Gestión de ventas</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {menuItems.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {group.group}
              </p>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive(item.href)
                    ? "bg-amber-500/15 text-amber-400 shadow-sm"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-700/50">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate capitalize">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors p-1"
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-slate-800 text-white shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-slate-900 z-40 transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
        >
          {collapsed ? "→" : "←"}
        </button>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-900 z-50">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

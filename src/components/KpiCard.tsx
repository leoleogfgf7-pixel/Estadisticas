"use client";

interface KpiCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: { value: number; positive: boolean };
  color?: "amber" | "blue" | "green" | "red" | "purple";
}

const colorMap = {
  amber: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-200", icon: "bg-amber-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200", icon: "bg-blue-500" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-200", icon: "bg-emerald-500" },
  red: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-200", icon: "bg-red-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-200", icon: "bg-purple-500" },
};

export default function KpiCard({ title, value, icon, trend, color = "blue" }: KpiCardProps) {
  const c = colorMap[color];

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border ${c.border} dark:border-slate-800 p-5 hover:shadow-lg transition-shadow duration-300`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center text-white text-lg shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.positive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
          }`}>
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${c.text} dark:text-white`}>{value}</p>
    </div>
  );
}

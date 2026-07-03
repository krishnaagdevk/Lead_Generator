"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";

interface StageRevenue { stage: string; count: number; totalValue: number; }

export default function RevenueDashboardPage() {
  const { data: summary } = useQuery<StageRevenue[]>({
    queryKey: ["revenue-summary"],
    queryFn: () => fetch("/api/analytics/revenue").then(r => r.json()),
  });

  const wonTotal = summary?.find(s => s.stage === "won")?.totalValue ?? 0;
  const pipeline = summary?.filter(s => s.stage !== "won" && s.stage !== "lost")
    .reduce((acc, s) => acc + s.totalValue, 0) ?? 0;

  return (
    <div className="p-6 max-w-4xl flex flex-col gap-6">
      <h1 className="text-xl font-bold text-text">Revenue Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Revenue Won", value: wonTotal, icon: DollarSign, color: "#10b981" },
          { label: "Pipeline Value", value: pipeline, icon: TrendingUp, color: "#6366f1" },
          { label: "Total Leads w/ Value", value: summary?.reduce((a, s) => a + s.count, 0) ?? 0, icon: BarChart3, color: "#f59e0b", isCount: true },
        ].map(({ label, value, icon: Icon, color, isCount }) => (
          <div key={label} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs text-muted">{label}</span>
            </div>
            <p className="text-2xl font-bold text-text">
              {isCount ? value : `$${value.toLocaleString()}`}
            </p>
          </div>
        ))}
      </div>

      {/* Stage breakdown table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Stage</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted">Leads</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {summary?.map(s => (
              <tr key={s.stage} className="border-b border-border last:border-0">
                <td className="px-4 py-3 capitalize font-medium text-text">{s.stage}</td>
                <td className="px-4 py-3 text-right text-muted">{s.count}</td>
                <td className="px-4 py-3 text-right font-semibold text-text">${s.totalValue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
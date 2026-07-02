"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Printer, Mail, Eye, MessageSquare, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Campaign {
  id: number;
  name: string;
  templateSubject: string;
  status: string;
  createdAt: string;
}

interface Stats {
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
}

interface Log {
  id: number;
  lead: { name: string; email: string | null; websiteUrl: string | null };
  status: string;
  sentAt: string;
  replyClassification: string | null;
}

export default function CampaignReportPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = Number(params.id);

  const { data: campaign, isLoading: loadingCampaign } = useQuery<Campaign>({
    queryKey: ["campaign", campaignId],
    queryFn: () => fetch(`/api/campaigns`).then(r => r.json()).then((list: Campaign[]) => list.find(c => c.id === campaignId)!),
  });

  const { data: stats, isLoading: loadingStats } = useQuery<Stats>({
    queryKey: ["campaign-stats", campaignId],
    queryFn: () => fetch(`/api/campaigns/${campaignId}/stats`).then(r => r.json()),
  });

  const { data: logs, isLoading: loadingLogs } = useQuery<Log[]>({
    queryKey: ["campaign-logs", campaignId],
    queryFn: () => fetch(`/api/campaigns/${campaignId}/drafts`).then(r => r.json()).then((list: any[]) => 
      list.filter(d => d.status === "sent" || d.status === "failed").map(d => ({
        id: d.id,
        lead: d.lead,
        status: d.status === "sent" ? "sent" : "bounced",
        sentAt: d.sentAt || d.createdAt,
        replyClassification: null,
      }))
    ),
  });

  const isLoading = loadingCampaign || loadingStats || loadingLogs;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-2 text-muted">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>Loading report data...</span>
      </div>
    );
  }

  if (!campaign || !stats) {
    return (
      <div className="p-8 text-center text-red-500">
        Campaign report not found.
      </div>
    );
  }

  const openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
  const replyRate = stats.sent > 0 ? (stats.replied / stats.sent) * 100 : 0;
  const bounceRate = stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0;

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 bg-white min-h-screen">
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Top action bar: Hidden on Print */}
      <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted hover:text-text cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to campaigns
        </button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Report Header */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-text">{campaign.name}</h1>
            <p className="text-sm text-muted">Performance Report • Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
              {campaign.status}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <MetricCard label="Total Sent" value={stats.sent} icon={Mail} color="text-indigo-600 bg-indigo-50 border-indigo-100" />
        <MetricCard label="Open Rate" value={`${openRate.toFixed(0)}%`} subtext={`${stats.opened} opens`} icon={Eye} color="text-blue-600 bg-blue-50 border-blue-100" />
        <MetricCard label="Reply Rate" value={`${replyRate.toFixed(0)}%`} subtext={`${stats.replied} replies`} icon={MessageSquare} color="text-emerald-600 bg-emerald-50 border-emerald-100" />
        <MetricCard label="Bounce Rate" value={`${bounceRate.toFixed(0)}%`} subtext={`${stats.bounced} bounces`} icon={AlertTriangle} color="text-red-600 bg-red-50 border-red-100" />
      </div>

      {/* Funnel chart representation */}
      <div className="border border-border rounded-xl p-6 mt-4">
        <h3 className="font-semibold text-text mb-4">Funnel Performance</h3>
        <div className="flex flex-col gap-3">
          <FunnelBar label="Sent" value={stats.sent} max={stats.sent || 1} color="#6366f1" />
          <FunnelBar label="Opened" value={stats.opened} max={stats.sent || 1} color="#3b82f6" />
          <FunnelBar label="Replied" value={stats.replied} max={stats.sent || 1} color="#10b981" />
          <FunnelBar label="Bounced" value={stats.bounced} max={stats.sent || 1} color="#ef4444" />
        </div>
      </div>

      {/* Lead Log Details */}
      <div className="mt-4 flex flex-col gap-3">
        <h3 className="font-semibold text-text">Recipient Activity Log</h3>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border font-semibold text-text">
                <th className="p-3">Recipient</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Sent Date</th>
              </tr>
            </thead>
            <tbody>
              {logs && logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-background/20 transition-colors">
                    <td className="p-3 font-medium text-text">{log.lead.name}</td>
                    <td className="p-3 text-muted">{log.lead.email || "—"}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] uppercase border ${
                        log.status === "sent" ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-red-50 border-red-100 text-red-700"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-right text-muted">{new Date(log.sentAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted">No emails sent in this campaign.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext, icon: Icon, color }: { label: string; value: string | number; subtext?: string; icon: any; color: string }) {
  return (
    <div className={`p-4 border rounded-xl flex items-center justify-between gap-4 ${color}`}>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider opacity-80 block">{label}</span>
        <span className="text-2xl font-bold block mt-0.5">{value}</span>
        {subtext && <span className="text-[10px] font-semibold opacity-70">{subtext}</span>}
      </div>
      <Icon className="w-8 h-8 opacity-20 shrink-0" />
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs font-semibold text-muted text-right shrink-0">{label}</div>
      <div className="flex-1 bg-background rounded-full h-6 overflow-hidden">
        <div
          className="h-full rounded-full flex items-center px-3 text-white text-[10px] font-bold transition-all duration-500"
          style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color }}
        >
          {value}
        </div>
      </div>
      <div className="w-10 text-xs text-muted text-right font-semibold">{pct.toFixed(0)}%</div>
    </div>
  );
}

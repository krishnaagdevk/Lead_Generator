"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, FileText } from "lucide-react";
import Link from "next/link";

interface Campaign { id: number; name: string; status: string; createdAt: string; }
interface Stats { campaignId: number; sent: number; opened: number; replied: number; bounced: number; }

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-sm text-muted text-right shrink-0">{label}</div>
      <div className="flex-1 bg-background rounded-full h-7 overflow-hidden">
        <div
          className="h-full rounded-full flex items-center px-3 text-white text-xs font-semibold transition-all duration-500"
          style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color }}
        >
          {value}
        </div>
      </div>
      <div className="w-12 text-sm text-muted">{pct.toFixed(0)}%</div>
    </div>
  );
}

function CampaignStats({ campaign }: { campaign: Campaign }) {
  const { data } = useQuery<Stats>({
    queryKey: ["stats", campaign.id],
    queryFn: () => fetch(`/api/campaigns/${campaign.id}/stats`).then(r => r.json()),
  });

  if (!data) return null;
  const max = data.sent || 1;

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-text">{campaign.name}</h3>
          <p className="text-xs text-muted mt-0.5">{new Date(campaign.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/campaigns/${campaign.id}/report`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> PDF Report
          </Link>
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${campaign.status === "done" ? "bg-emerald-100 text-emerald-700" : campaign.status === "running" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
            {campaign.status}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <FunnelBar label="Sent" value={data.sent} max={max} color="#6366f1" />
        <FunnelBar label="Opened" value={data.opened} max={max} color="#3b82f6" />
        <FunnelBar label="Replied" value={data.replied} max={max} color="#10b981" />
        <FunnelBar label="Bounced" value={data.bounced} max={max} color="#ef4444" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: () => fetch("/api/campaigns").then(r => r.json()),
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Analytics</h1>
        <p className="text-sm text-muted mt-0.5">Campaign performance across all sends</p>
      </div>

      {isLoading && <div className="flex items-center gap-2 text-muted"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}

      {!isLoading && campaigns?.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-muted">
          <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">No campaigns yet</p>
          <p className="text-sm mt-1">Create a campaign in Compose to see stats here</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {campaigns?.map(c => <CampaignStats key={c.id} campaign={c} />)}
      </div>
    </div>
  );
}

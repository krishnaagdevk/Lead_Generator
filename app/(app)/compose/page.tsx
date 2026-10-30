"use client";

import { Button } from "@/components/ui/Button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  RefreshCw,
  ChevronRight,
  Plus,
  Trash2,
  Search,
  Mail,
  Folder,
  Play,
  ArrowLeft,
  Settings,
  Shield,
  Eye,
  Percent,
  Check,
  Globe,
  Star,
  Users,
  AlertCircle,
  Calendar,
  X,
  Target,
  FileText,
  AlertTriangle,
  Smile,
  Flame,
  UserCheck,
  Layers,
  ChevronLeft,
  Briefcase,
  HelpCircle,
  TrendingUp,
  MapPin
} from "lucide-react";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { cn } from "@/lib/utils";
import { SequenceBuilder } from "@/components/campaigns/SequenceBuilder";
import { useToast } from "@/components/ui/Toast";

interface Lead {
  id: number;
  name: string;
  email: string | null;
  websiteStatus: string;
  category: string | null;
  emailVerifiedStatus: string;
  leadScore: number;
  rating: number | null;
  reviewCount: number | null;
  websiteUrl: string | null;
  address: string | null;
  reviewSentiment: string | null;
  reviewPitchAngle: string | null;
}

interface Draft {
  id: number;
  leadId: number;
  subject: string;
  body: string;
  status: string;
  editedByUser: boolean;
  lead: Lead;
  campaign?: {
    id: number;
    name: string;
    status: string;
    emailAccountId: number | null;
  };
}

interface EmailAccount {
  id: number;
  gmailAddress: string;
  isDefault: boolean;
  dailySent: number;
  dailyLimit: number;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
  isSequence: boolean;
  createdAt: string;
  emailAccountId: number | null;
  _count: {
    drafts: number;
    logs: number;
  };
}

export default function ComposePage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  // Sidebar navigation mode: "create" a new campaign or "manage" existing campaigns
  const [sidebarTab, setSidebarTab] = useState<"create" | "manage">("manage");

  // Selection states
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<number | null>(null);
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [emailAccountId, setEmailAccountId] = useState<number | null>(null);
  const [gmailAddress, setGmailAddress] = useState<string>("");
  const [campaignName, setCampaignName] = useState("");
  const [isSequence, setIsSequence] = useState(false);
  const [selectedModel, setSelectedModel] = useState("laguna-s-2.1");

  // New Lead selection filters
  const [leadSearch, setLeadSearch] = useState("");
  const [leadCategoryFilter, setLeadCategoryFilter] = useState("");
  const [leadVerificationFilter, setLeadVerificationFilter] = useState("all");

  // Draft filters
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatusFilter, setDraftStatusFilter] = useState("all");

  // Dynamic AI Models Query (Market-Standard Config-Driven Architecture)
  const { data: aiModelsData } = useQuery<{
    defaultModel: string;
    models: Array<{ id: string; name: string; provider: string; isDefault?: boolean }>;
  }>({
    queryKey: ["ai-models"],
    queryFn: () => fetch("/api/ai/models").then((r) => r.json()),
  });

  useEffect(() => {
    if (aiModelsData?.defaultModel && (!selectedModel || selectedModel === "mistral-large")) {
      setSelectedModel(aiModelsData.defaultModel);
    }
  }, [aiModelsData, selectedModel]);

  // Queries
  const { data: leadsData } = useQuery({
    queryKey: ["leads", "compose"],
    queryFn: () => fetch("/api/leads?pageSize=200").then(r => r.json())
  });
  const leads: Lead[] = leadsData?.items ?? [];

  const { data: accounts } = useQuery<EmailAccount[]>({
    queryKey: ["email-accounts"],
    queryFn: () => fetch("/api/email-accounts").then(r => r.json())
  });

  const { data: campaigns, refetch: refetchCampaigns } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: () => fetch("/api/campaigns").then(r => r.json()),
    refetchInterval: 5000 // Periodically poll campaigns to update states
  });

  const { data: drafts, refetch: refetchDrafts, isPending: loadingDrafts } = useQuery<Draft[]>({
    queryKey: ["drafts", activeCampaign],
    queryFn: () => fetch(`/api/campaigns/${activeCampaign}/drafts`).then(r => r.json()),
    enabled: !!activeCampaign,
    refetchInterval: (query) => {
      // Auto-poll drafts if the active campaign is currently sending
      const campaign = campaigns?.find(c => c.id === activeCampaign);
      return campaign?.status === "running" ? 3000 : false;
    }
  });

  // Automatically select the first draft when campaign loads
  useEffect(() => {
    if (drafts && drafts.length > 0 && !activeDraft) {
      setActiveDraft(drafts[0]);
    } else if (drafts && drafts.length === 0) {
      setActiveDraft(null);
    }
  }, [drafts, activeDraft]);

  // Handle activeCampaign status changes
  const activeCampaignDetails = campaigns?.find(c => c.id === activeCampaign);

  // Mutators
  const createCampaign = useMutation({
    mutationFn: () =>
      fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName || `Campaign ${new Date().toLocaleDateString()}`,
          templateSubject: "Quick question about your business",
          templateBody: "Hi {{name}},\n\nI noticed your business could benefit from a professional website...",
          emailAccountId,
          gmailAddress: emailAccountId ? undefined : gmailAddress,
          leadIds: selectedLeads,
          isSequence,
        }),
      }).then(r => r.json()),
    onSuccess: (c: Campaign) => {
      toast({ message: "Campaign created successfully!", type: "success" });
      refetchCampaigns();
      setActiveCampaign(c.id);
      setSelectedLeads([]);
      setCampaignName("");
      setIsSequence(false);
      setSidebarTab("manage");
    },
    onError: (err: any) => {
      toast({ message: err.message || "Failed to create campaign", type: "error" });
    }
  });

  const deleteCampaign = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/campaigns/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      toast({ message: "Campaign deleted successfully", type: "success" });
      refetchCampaigns();
      setActiveCampaign(null);
      setActiveDraft(null);
    },
    onError: (err: any) => {
      toast({ message: err.message || "Failed to delete campaign", type: "error" });
    }
  });

  const generateAll = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${activeCampaign}/generate?model=${selectedModel}`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => {
      toast({ message: "AI draft generation process queued in background!", type: "success" });
      setTimeout(() => refetchDrafts(), 2000);
    },
    onError: (err: any) => {
      toast({ message: err.message || "Failed to start AI generation", type: "error" });
    }
  });

  const sendAll = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${activeCampaign}/send`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => {
      toast({ message: "Bulk sending job started successfully!", type: "success" });
      refetchCampaigns();
      refetchDrafts();
    },
    onError: (err: any) => {
      toast({ message: err.message || "Failed to schedule sending", type: "error" });
    }
  });

  const updateCampaignAccount = useMutation({
    mutationFn: (emailAccountId: number) =>
      fetch(`/api/campaigns/${activeCampaign}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAccountId }),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ message: "Campaign sending account updated", type: "success" });
      refetchCampaigns();
      refetchDrafts();
    }
  });

  const saveDraft = useMutation({
    mutationFn: ({ id, subject, body }: { id: number; subject: string; body: string }) =>
      fetch(`/api/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body })
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ message: "Draft saved successfully", type: "success" });
      refetchDrafts();
    },
    onError: () => {
      toast({ message: "Failed to save draft", type: "error" });
    }
  });

  const regenerate = useMutation({
    mutationFn: (id: number) => fetch(`/api/drafts/${id}/regenerate?model=${selectedModel}`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => {
      toast({ message: "AI regeneration started for this draft...", type: "info" });
      setTimeout(() => refetchDrafts(), 3000);
    },
    onError: () => {
      toast({ message: "Failed to regenerate", type: "error" });
    }
  });

  // Lead filtering logic for creation form
  const filteredLeads = leads.filter(lead => {
    if (!lead.email) return false;
    const matchesSearch =
      lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.email.toLowerCase().includes(leadSearch.toLowerCase());
    const matchesCategory =
      !leadCategoryFilter ||
      lead.category?.toLowerCase().includes(leadCategoryFilter.toLowerCase());
    const matchesVerification =
      leadVerificationFilter === "all" ||
      lead.emailVerifiedStatus === leadVerificationFilter;
    return matchesSearch && matchesCategory && matchesVerification;
  });

  // Draft filtering logic for active campaign
  const filteredDrafts = drafts?.filter(draft => {
    const matchesSearch =
      draft.lead.name.toLowerCase().includes(draftSearch.toLowerCase()) ||
      (draft.lead.email && draft.lead.email.toLowerCase().includes(draftSearch.toLowerCase()));
    const matchesStatus =
      draftStatusFilter === "all" ||
      draft.status === draftStatusFilter;
    return matchesSearch && matchesStatus;
  }) ?? [];

  // Active Campaign stats calculations
  const pendingCount = drafts?.filter(d => d.status === "pending").length ?? 0;
  const sentCount = drafts?.filter(d => d.status === "sent").length ?? 0;
  const failedCount = drafts?.filter(d => d.status === "failed").length ?? 0;
  const skippedCount = drafts?.filter(d => d.status === "skipped").length ?? 0;
  const totalCount = drafts?.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

  const renderVerificationBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Valid</span>;
      case "invalid":
        return <span className="bg-rose-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Invalid</span>;
      case "catchall":
        return <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Catch-All</span>;
      case "unverified":
        return <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">Unverified</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">{status || "Unknown"}</span>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Panel: Create or List Campaigns */}
      <div className="w-full lg:w-90 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col h-[45vh] lg:h-full shadow-sm z-10">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Outreach Center
            </h1>
            {activeCampaign && (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs flex items-center gap-1"
                onClick={() => {
                  setActiveCampaign(null);
                  setActiveDraft(null);
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            )}
          </div>

          {/* Tab Selection (only visible if not viewing an active campaign) */}
          {!activeCampaign && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setSidebarTab("manage")}
                className={cn(
                  "flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  sidebarTab === "manage"
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Active Campaigns ({campaigns?.length ?? 0})
              </button>
              <button
                onClick={() => setSidebarTab("create")}
                className={cn(
                  "flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  sidebarTab === "create"
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                + New Campaign
              </button>
            </div>
          )}
        </div>

        {/* Content area: campaign builder OR drafts manager */}
        {!activeCampaign ? (
          <div className="flex-1 overflow-y-auto min-h-0">
            {sidebarTab === "create" ? (
              /* CREATE CAMPAIGN FORM */
              <div className="p-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Campaign Name</label>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                    placeholder="E.g., Web Design Outreach London"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                  />
                </div>

                {accounts && accounts.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Send From Account</label>
                    <select
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white cursor-pointer"
                      value={emailAccountId ?? ""}
                      onChange={e => setEmailAccountId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Select Connected Gmail Account</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.gmailAddress} ({a.dailySent}/{a.dailyLimit} sent today)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Or Enter Connected Gmail Address
                  </label>
                  <input
                    type="email"
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                    placeholder="your@gmail.com"
                    value={gmailAddress}
                    onChange={e => setGmailAddress(e.target.value)}
                  />
                </div>

                {/* LEAD FILTERING PANEL */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Filter Leads ({leads.filter(l => l.email).length})</span>
                    <button
                      onClick={() => setSelectedLeads(filteredLeads.map(l => l.id))}
                      className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Select All Filtered
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        className="h-8 w-full pl-9 pr-3 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                        placeholder="Search lead name or email..."
                        value={leadSearch}
                        onChange={e => setLeadSearch(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="h-8 rounded-md border border-slate-200 px-2 text-xs focus:outline-none bg-white cursor-pointer"
                        value={leadVerificationFilter}
                        onChange={e => setLeadVerificationFilter(e.target.value)}
                      >
                        <option value="all">Verification Status</option>
                        <option value="valid">Valid</option>
                        <option value="invalid">Invalid</option>
                        <option value="catchall">Catch-All</option>
                        <option value="unverified">Unverified</option>
                      </select>
                      <input
                        className="h-8 rounded-md border border-slate-200 px-2 text-xs focus:outline-none bg-white"
                        placeholder="Category (e.g. Agency)"
                        value={leadCategoryFilter}
                        onChange={e => setLeadCategoryFilter(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* LEADS MULTI-SELECT CHECKLIST */}
                  <div className="flex flex-col gap-1 max-h-52 overflow-y-auto border border-slate-200 rounded-lg bg-white p-1">
                    {filteredLeads.map(lead => (
                      <label
                        key={lead.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors",
                          selectedLeads.includes(lead.id) && "bg-primary/5"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="accent-primary rounded cursor-pointer"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() =>
                            setSelectedLeads(s =>
                              s.includes(lead.id) ? s.filter(i => i !== lead.id) : [...s, lead.id]
                            )
                          }
                        />
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="text-xs font-semibold text-slate-700 truncate">{lead.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">{lead.email}</span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <StatusBadge status={lead.websiteStatus} className="text-[9px] py-0 px-1" />
                          {renderVerificationBadge(lead.emailVerifiedStatus)}
                        </div>
                      </label>
                    ))}
                    {filteredLeads.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No matching leads found.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="seq"
                    checked={isSequence}
                    onChange={e => setIsSequence(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <label htmlFor="seq" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Enable Email Sequence (multi-step drip follow-ups)
                  </label>
                </div>

                <Button
                  className="w-full h-11 text-sm rounded-xl font-bold flex items-center justify-center gap-2"
                  disabled={selectedLeads.length === 0 || (!emailAccountId && !gmailAddress)}
                  onClick={() => createCampaign.mutate()}
                  loading={createCampaign.isPending}
                >
                  <ChevronRight className="w-5 h-5" />
                  Create Campaign ({selectedLeads.length} leads)
                </Button>
                {!emailAccountId && !gmailAddress && (
                  <p className="text-xs text-rose-500 text-center font-semibold">
                    ⚠️ Select a Gmail account to enable campaign creation.
                  </p>
                )}
              </div>
            ) : (
              /* CAMPAIGNS LIST */
              <div className="flex flex-col divide-y divide-slate-100 p-2">
                {campaigns && campaigns.length > 0 ? (
                  campaigns.map(c => (
                    <div
                      key={c.id}
                      className={cn(
                        "group p-3 flex items-center justify-between rounded-xl hover:bg-slate-50 transition-all cursor-pointer duration-200 mb-1"
                      )}
                      onClick={() => {
                        setActiveCampaign(c.id);
                        setActiveDraft(null);
                      }}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-bold text-slate-700 group-hover:text-primary truncate transition-colors">
                          {c.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            · {c._count?.drafts ?? 0} leads
                          </span>
                          {c.isSequence && (
                            <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 rounded">
                              Sequence
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                            c.status === "running"
                              ? "bg-amber-100 text-amber-800 animate-pulse"
                              : c.status === "done"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {c.status}
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this campaign? All drafts and logs will be permanently removed.")) {
                              deleteCampaign.mutate(c.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Folder className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="text-sm">No campaigns found.</p>
                    <p className="text-xs mt-1">Click "+ New Campaign" above to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE CAMPAIGN DRAFTS LIST */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
            {/* Active Campaign Header & Summary Stats */}
            <div className="p-3 bg-white border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 truncate max-w-45">
                  📁 {activeCampaignDetails?.name}
                </span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  {sentCount} / {totalCount} Sent
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Stat breakdown badges */}
              <div className="grid grid-cols-4 gap-1.5">
                <div className="bg-slate-100/70 rounded p-1.5 text-center">
                  <div className="text-xs font-bold text-slate-700">{pendingCount}</div>
                  <div className="text-[9px] font-semibold text-slate-400">Drafts</div>
                </div>
                <div className="bg-emerald-50 rounded p-1.5 text-center">
                  <div className="text-xs font-bold text-emerald-700">{sentCount}</div>
                  <div className="text-[9px] font-semibold text-emerald-500">Sent</div>
                </div>
                <div className="bg-rose-50 rounded p-1.5 text-center">
                  <div className="text-xs font-bold text-red-700">{failedCount}</div>
                  <div className="text-[9px] font-semibold text-red-500">Failed</div>
                </div>
                <div className="bg-amber-50 rounded p-1.5 text-center">
                  <div className="text-xs font-bold text-amber-700">{skippedCount}</div>
                  <div className="text-[9px] font-semibold text-amber-500">Skip</div>
                </div>
              </div>

              {/* Active Campaign Gmail Override */}
              {accounts && accounts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sending email:</span>
                  <select
                    className="h-7 text-xs rounded border border-slate-200 px-1.5 font-semibold bg-white cursor-pointer max-w-42.5"
                    value={activeCampaignDetails?.emailAccountId ?? ""}
                    onChange={e => updateCampaignAccount.mutate(Number(e.target.value))}
                  >
                    <option value="">No account selected</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.gmailAddress}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Filters for Draft List */}
            <div className="p-2 border-b border-slate-200 bg-white flex flex-col gap-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  className="h-8 w-full pl-8 pr-3 rounded-md border border-slate-100 text-xs focus:outline-none bg-slate-50 focus:bg-white"
                  placeholder="Filter drafts by lead name..."
                  value={draftSearch}
                  onChange={e => setDraftSearch(e.target.value)}
                />
              </div>

              <div className="flex bg-slate-100 p-0.5 rounded-md text-[10px] font-bold text-slate-600">
                {["all", "pending", "sent", "failed"].map(st => (
                  <button
                    key={st}
                    onClick={() => setDraftStatusFilter(st)}
                    className={cn(
                      "flex-1 text-center py-1 rounded cursor-pointer capitalize transition-all",
                      draftStatusFilter === st ? "bg-white text-slate-800 shadow-sm" : "hover:text-slate-900"
                    )}
                  >
                    {st === "pending" ? "Drafts" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* List of drafts */}
            <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 bg-white">
              {loadingDrafts ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-medium">Loading drafts...</span>
                </div>
              ) : filteredDrafts.length > 0 ? (
                filteredDrafts.map(draft => (
                  <button
                    key={draft.id}
                    onClick={() => setActiveDraft(draft)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex flex-col transition-all cursor-pointer relative",
                      activeDraft?.id === draft.id
                        ? "bg-primary/5 border-l-[3px] border-l-primary"
                        : "hover:bg-slate-50/50"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-700 truncate pr-2 flex-1">
                        {draft.lead.name}
                      </span>
                      <span
                        className={cn(
                          "text-[9px] px-1.5 rounded-full font-bold capitalize",
                          draft.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : draft.status === "failed"
                            ? "bg-rose-100 text-red-800"
                            : draft.status === "skipped"
                            ? "bg-amber-100 text-amber-800"
                            : draft.editedByUser
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {draft.status === "pending"
                          ? draft.editedByUser
                            ? "Custom Draft"
                            : "AI Draft"
                          : draft.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-1 w-full font-medium">
                      {draft.subject || "(No subject yet - click AI generate)"}
                    </p>

                    <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 font-semibold">
                      <span className="truncate">{draft.lead.email}</span>
                      {draft.lead.leadScore > 0 && (
                        <span className="text-amber-600">★ Score: {draft.lead.leadScore}</span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Mail className="w-8 h-8 mx-auto opacity-35 mb-2" />
                  <p className="text-xs">No matching drafts found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Action Controls Footer */}
        {activeCampaign && (
          <div className="p-3 border-t border-slate-200 bg-white flex flex-col gap-2 shrink-0">
            {activeCampaignDetails?.isSequence && (
              <div className="max-h-44 overflow-y-auto mb-1">
                <SequenceBuilder campaignId={activeCampaign} />
              </div>
            )}
            <div className="mb-2">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block mb-1">AI Engine Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full h-9 px-2.5 text-xs font-bold border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-slate-50 text-slate-700 cursor-pointer shadow-sm hover:bg-slate-100/50 transition-colors"
              >
                {aiModelsData?.models && aiModelsData.models.length > 0 ? (
                  Object.entries(
                    aiModelsData.models.reduce((acc, m) => {
                      acc[m.provider] = acc[m.provider] || [];
                      acc[m.provider].push(m);
                      return acc;
                    }, {} as Record<string, typeof aiModelsData.models>)
                  ).map(([provider, models]) => (
                    <optgroup key={provider} label={provider}>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </optgroup>
                  ))
                ) : (
                  <optgroup label="Default Engine">
                    <option value="laguna-s-2.1">Laguna S-2.1 (Fast & Smart)</option>
                    <option value="openai/gpt-oss-120b">GPT OSS 120B (Enterprise Intelligence)</option>
                  </optgroup>
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-10 text-xs font-bold border-slate-200 text-slate-700 flex items-center justify-center gap-1 bg-white hover:bg-slate-50 shadow-sm"
                onClick={() => generateAll.mutate()}
                loading={generateAll.isPending}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Draft All
              </Button>
              <Button
                variant="cta"
                size="sm"
                className="h-10 text-xs font-bold shadow-md bg-linear-to-r from-primary to-indigo-600 text-white flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
                onClick={() => sendAll.mutate()}
                loading={sendAll.isPending}
                disabled={activeCampaignDetails?.status === "running"}
              >
                <Send className="w-3.5 h-3.5" /> Send All (Bulk)
              </Button>
            </div>
            {activeCampaignDetails?.status === "running" && (
              <p className="text-[10px] text-amber-600 font-semibold animate-pulse text-center">
                ⚙️ Bulk outreach running in background. Status updates live.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Panel: Draft Editor, Lead Context, and AI Tools */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-[55vh] lg:h-full">
        {activeDraft ? (
          <DraftEditor
            key={activeDraft.id}
            draft={activeDraft}
            onSave={(subject, body) => saveDraft.mutate({ id: activeDraft.id, subject, body })}
            onRegenerate={() => regenerate.mutate(activeDraft.id)}
            onSent={() => {
              refetchDrafts();
            }}
            saving={saveDraft.isPending}
            regenerating={regenerate.isPending}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-white shadow-card rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Sparkles className="w-8 h-8 text-primary/40 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">Outreach Workspace</h3>
              <p className="text-xs text-slate-400">
                {activeCampaign
                  ? "Select a lead from the sidebar list to review and customize their email draft."
                  : "Start by selecting an existing campaign, or tap '+ New Campaign' to draft outbound sequences."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DraftEditor({
  draft,
  onSave,
  onRegenerate,
  onSent,
  saving,
  regenerating
}: {
  draft: Draft;
  onSave: (subject: string, body: string) => void;
  onRegenerate: () => void;
  onSent?: () => void;
  saving: boolean;
  regenerating: boolean;
}) {
  const { toast } = useToast();
  const [subject, setSubject] = useState(draft.subject || "");
  const [body, setBody] = useState(draft.body || "");
  const [rankResult, setRankResult] = useState<any>(null);
  const [toneResult, setToneResult] = useState<any>(null);
  const [analyzingTone, setAnalyzingTone] = useState(false);
  const [spamResult, setSpamResult] = useState<any>(null);
  const [checkingSpam, setCheckingSpam] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Detail panel active tab: "context" (lead context), "ai" (tone/spam tools), "subject" (subject ranker)
  const [panelTab, setPanelTab] = useState<"context" | "ai" | "subject">("context");

  // Keep state synced when switching between different drafts
  useEffect(() => {
    setSubject(draft.subject || "");
    setBody(draft.body || "");
    setRankResult(null);
    setToneResult(null);
    setSpamResult(null);
    setSendError(null);
  }, [draft]);

  const handleSendViaGmail = async () => {
    setSending(true);
    setSendError(null);
    onSave(subject, body);
    try {
      const res = await fetch(`/api/drafts/${draft.id}/send`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error || "Failed to send");
        toast({ message: data.error || "Gmail delivery error", type: "error" });
      } else {
        toast({ message: `Email sent to ${draft.lead.name}!`, type: "success" });
        onSent?.();
      }
    } catch {
      setSendError("Network delivery failure");
      toast({ message: "Network connection failure", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleAnalyzeTone = async () => {
    setAnalyzingTone(true);
    try {
      const res = await fetch("/api/tools/analyze-tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      if (res.ok) {
        setToneResult(await res.json());
        setPanelTab("ai");
        toast({ message: "Tone analysis finished", type: "success" });
      } else {
        toast({ message: "Failed to analyze tone", type: "error" });
      }
    } catch {
      toast({ message: "Network error", type: "error" });
    } finally {
      setAnalyzingTone(false);
    }
  };

  const handleCheckSpam = async () => {
    setCheckingSpam(true);
    setSpamResult(null);
    try {
      const res = await fetch("/api/tools/spam-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      if (res.ok) {
        setSpamResult(await res.json());
        setPanelTab("ai");
        toast({ message: "Spam check completed", type: "success" });
      } else {
        toast({ message: "Failed to analyze spam risks", type: "error" });
      }
    } catch {
      toast({ message: "Network error", type: "error" });
    } finally {
      setCheckingSpam(false);
    }
  };

  const handleRankSubjects = async () => {
    const subjects = subject.split("|||").map(s => s.trim());
    if (subjects.length < 2) {
      toast({ message: "Include '|||' in the subject field to split and rank alternative lines.", type: "info" });
      return;
    }
    try {
      const res = await fetch("/api/tools/rank-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects, businessName: draft.lead.name }),
      });
      if (res.ok) {
        setRankResult(await res.json());
        setPanelTab("subject");
        toast({ message: "Subject options evaluated!", type: "success" });
      } else {
        toast({ message: "Failed to rank subjects", type: "error" });
      }
    } catch {
      toast({ message: "Network error", type: "error" });
    }
  };

  // Cursor-sensitive placeholder insertions
  const insertVariableToBody = (variable: string) => {
    const textarea = document.getElementById("draft-body-textarea") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = body.substring(0, start) + variable + body.substring(end);
      setBody(newBody);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setBody(b => b + variable);
    }
  };

  const insertVariableToSubject = (variable: string) => {
    const input = document.getElementById("draft-subject-input") as HTMLInputElement;
    if (input) {
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const newSubject = subject.substring(0, start) + variable + subject.substring(end);
      setSubject(newSubject);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setSubject(s => s + variable);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 lg:flex-row">
      {/* Editor Panel Left */}
      <div className="flex-1 flex flex-col border-r border-slate-200 bg-white min-h-0">
        <div className="border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">{draft.lead.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={draft.lead.websiteStatus} className="text-[10px]" />
              {draft.lead.email && (
                <span className="text-xs text-slate-400 font-semibold">{draft.lead.email}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs font-semibold gap-1"
              onClick={onRegenerate}
              loading={regenerating}
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" /> AI Draft
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs font-semibold gap-1"
              onClick={handleAnalyzeTone}
              loading={analyzingTone}
            >
              🎯 Analyze Tone
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs font-semibold gap-1"
              onClick={handleCheckSpam}
              loading={checkingSpam}
            >
              🚫 Check Spam
            </Button>
            {draft.status !== "sent" && (
              <Button
                variant="cta"
                size="sm"
                className="h-8 text-xs font-bold gap-1 shadow bg-linear-to-r from-primary to-indigo-600 text-white cursor-pointer"
                onClick={handleSendViaGmail}
                loading={sending}
              >
                <Send className="w-3 h-3" /> Send
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 text-xs font-bold gap-1"
              onClick={() => onSave(subject, body)}
              loading={saving}
            >
              Save
            </Button>
          </div>
        </div>

        {/* Workspace Inputs */}
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto min-h-0">
          {/* Subject line input */}
          <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Line</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Pills to insert:</span>
                {["{{business_name}}", "{{city}}", "{{category}}"].map(v => (
                  <button
                    key={v}
                    onClick={() => insertVariableToSubject(v)}
                    className="text-[10px] font-semibold bg-white border border-slate-200 hover:border-primary/50 hover:bg-primary/5 text-slate-600 rounded px-1.5 py-0.5 cursor-pointer"
                  >
                    {v.replace(/\{\{|\}\}/g, "")}
                  </button>
                ))}
              </div>
            </div>
            <input
              id="draft-subject-input"
              className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject..."
            />
            {subject.includes("|||") && (
              <button
                onClick={handleRankSubjects}
                className="text-xs text-primary font-bold hover:underline mt-2 flex items-center gap-1 cursor-pointer"
              >
                🏆 Rank these alternative subject lines
              </button>
            )}
          </div>

          {/* Email body editor */}
          <div className="flex-1 flex flex-col bg-slate-50/50 p-4 border border-slate-100 rounded-xl min-h-0">
            <div className="flex items-center justify-between mb-1.5 shrink-0">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Body</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400">Pills to insert:</span>
                {["{{name}}", "{{city}}", "{{category}}", "{{website_status}}", "{{rating}}", "{{reviews}}"].map(
                  v => (
                    <button
                      key={v}
                      onClick={() => insertVariableToBody(v)}
                      className="text-[10px] font-semibold bg-white border border-slate-200 hover:border-primary/50 hover:bg-primary/5 text-slate-600 rounded px-1.5 py-0.5 cursor-pointer"
                    >
                      {v.replace(/\{\{|\}\}/g, "")}
                    </button>
                  )
                )}
              </div>
            </div>
            <textarea
              id="draft-body-textarea"
              className="flex-1 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white resize-none font-normal leading-relaxed text-slate-700 min-h-55"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Start drafting..."
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mt-2 shrink-0">
              <span>Chars: {body.length}</span>
              <span>Double braces variable parsing supported.</span>
            </div>
          </div>

          {sendError && (
            <div className="bg-rose-50 border border-red-200 rounded-xl p-3 shrink-0 flex items-start gap-2 text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <div>
                <p className="text-xs font-bold">Gmail Outbound Failure</p>
                <p className="text-[11px] mt-0.5 font-medium">{sendError}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side Utilities Panel Right (Lead context details & AI analyzer feedback) */}
      <div className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col h-[50vh] lg:h-full">
        {/* Panel tabs */}
        <div className="flex border-b border-slate-100 p-2 shrink-0 bg-slate-50/50">
          <button
            onClick={() => setPanelTab("context")}
            className={cn(
              "flex-1 text-center py-2 text-xs font-bold rounded-md transition-all cursor-pointer",
              panelTab === "context" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Lead Context
          </button>
          <button
            onClick={() => setPanelTab("ai")}
            className={cn(
              "flex-1 text-center py-2 text-xs font-bold rounded-md transition-all cursor-pointer",
              panelTab === "ai" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            AI Scores
          </button>
          <button
            onClick={() => setPanelTab("subject")}
            className={cn(
              "flex-1 text-center py-2 text-xs font-bold rounded-md transition-all cursor-pointer",
              panelTab === "subject" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            A/B Subject
          </button>
        </div>

        {/* Panel content area */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {panelTab === "context" && (
            /* LEAD DETAILS TAB */
            <div className="flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Firmographics</h4>
                <div className="space-y-2 text-xs">
                  {draft.lead.category && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Category</span>
                      <span className="font-semibold text-slate-700 truncate max-w-42.5">{draft.lead.category}</span>
                    </div>
                  )}
                  {draft.lead.rating && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Google Rating</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        {draft.lead.rating} ({draft.lead.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                  {draft.lead.websiteUrl && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-semibold">Website</span>
                      <a
                        href={draft.lead.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-semibold flex items-center gap-0.5 truncate max-w-42.5"
                      >
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {draft.lead.websiteUrl}
                      </a>
                    </div>
                  )}
                  {draft.lead.address && (
                    <div className="flex flex-col gap-1 py-1">
                      <span className="text-slate-500 font-semibold">Address</span>
                      <span className="text-slate-700 font-semibold leading-relaxed flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        {draft.lead.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* REVIEW SENTIMENT / PITCH ANGLES CARD */}
              {(draft.lead.reviewSentiment || draft.lead.reviewPitchAngle) && (
                <div className="border border-amber-100 rounded-xl bg-amber-50/40 p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900">AI Google Review Painpoints</span>
                  </div>
                  {draft.lead.reviewSentiment && (
                    <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                      <strong>Sentiment angle:</strong> {draft.lead.reviewSentiment}
                    </p>
                  )}
                  {draft.lead.reviewPitchAngle && (
                    <div className="text-[11px] text-amber-800 bg-white rounded-lg p-2.5 border border-amber-100 leading-relaxed font-normal">
                      <strong>Generated pitch:</strong> "{draft.lead.reviewPitchAngle}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {panelTab === "ai" && (
            /* AI SPAM AND TONE ANALYZER VIEW */
            <div className="flex flex-col gap-4">
              {/* TONE RESULT CARD */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subjective Tone</h4>
                {toneResult ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Tone Rating</span>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full font-bold",
                          toneResult.score >= 75
                            ? "bg-emerald-100 text-emerald-800"
                            : toneResult.score >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {toneResult.score}/100 - {toneResult.verdict?.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>

                    {toneResult.issues?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Improvement Areas:
                        </p>
                        <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-500 leading-relaxed">
                          {toneResult.issues.map((iss: string, idx: number) => (
                            <li key={idx}>{iss}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {toneResult.suggestions?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Smile className="w-3.5 h-3.5 text-primary" /> Suggestions:
                        </p>
                        <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-500 leading-relaxed">
                          {toneResult.suggestions.map((sug: string, idx: number) => (
                            <li key={idx}>{sug}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tap "Analyze Tone" above to trigger AI evaluation.</p>
                )}
              </div>

              {/* SPAM SCORE RESULT CARD */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Spam Scoring</h4>
                {spamResult ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Risk Factor</span>
                      <span
                        className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full font-bold",
                          spamResult.score <= 20
                            ? "bg-emerald-100 text-emerald-800"
                            : spamResult.score <= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {spamResult.score}/100 - {spamResult.score <= 20 ? "LOW RISK" : "SPAM SIGNAL RISK"}
                      </span>
                    </div>

                    {spamResult.flags?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Flagged Words/Signals:
                        </p>
                        <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-500 leading-relaxed">
                          {spamResult.flags.map((flg: string, idx: number) => (
                            <li key={idx}>{flg}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {spamResult.suggestions?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-primary" /> How to clean:
                        </p>
                        <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-500 leading-relaxed">
                          {spamResult.suggestions.map((sug: string, idx: number) => (
                            <li key={idx}>{sug}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Tap "Check Spam" above to filter trigger phrases.</p>
                )}
              </div>
            </div>
          )}

          {panelTab === "subject" && (
            /* SUBJECT LINE RANKER PANEL */
            <div className="flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject Split Evaluator</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Separate multiple subject choices with <code className="bg-slate-100 px-1 rounded">|||</code> in the subject field, then tap the evaluation trigger to sort and rank options by estimated open performance.
                </p>

                {rankResult ? (
                  <div className="space-y-3">
                    {rankResult.map((item: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                            #{item.rank}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{item.subject}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-7 leading-relaxed font-normal">
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                    <Percent className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500">Provide option variants inside subject field first.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

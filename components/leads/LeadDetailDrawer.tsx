"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { X, Loader2, Star, Mail, Phone, Globe, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { ContactBadge } from "./ContactBadge";

interface LeadDetailDrawerProps {
  leadId: number | null;
  onClose: () => void;
}

export function LeadDetailDrawer({ leadId, onClose }: LeadDetailDrawerProps) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead-details", leadId],
    queryFn: () => fetch(`/api/leads/${leadId}`).then((r) => r.json()),
    enabled: !!leadId,
  });

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || "");
    }
  }, [lead]);

  const updateLead = useMutation({
    mutationFn: async (data: { notes?: string; pipelineStage?: string }) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update lead");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-details", leadId] });
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Failed to save"),
  });

  if (!leadId) return null;

  const timeline: Array<{ id: string; date: Date; label: string; details?: string; iconColor: string }> = [];

  if (lead && !isLoading && !lead.error) {
    timeline.push({
      id: "discovered",
      date: new Date(lead.createdAt),
      label: "Lead Discovered",
      details: `Added to CRM. Website status: "${lead.websiteStatus}".`,
      iconColor: "bg-blue-500",
    });

    for (const d of lead.emailDrafts || []) {
      timeline.push({
        id: `draft-${d.id}`,
        date: new Date(d.createdAt),
        label: `Email Draft Generated`,
        details: `Draft created for campaign "${d.campaign?.name || "N/A"}" (Status: ${d.status}).`,
        iconColor: "bg-gray-400",
      });
    }

    for (const l of lead.emailLogs || []) {
      const statusLabel = l.status === "sent" 
        ? "Email Sent" 
        : l.status === "opened" 
        ? "Email Opened" 
        : l.status === "replied" 
        ? "Email Replied" 
        : l.status === "bounced"
        ? "Email Bounced"
        : "Email Unsubscribed";

      const iconColor = l.status === "sent" 
        ? "bg-indigo-500" 
        : l.status === "opened" 
        ? "bg-amber-500" 
        : l.status === "replied" 
        ? "bg-emerald-500" 
        : "bg-red-500";

      timeline.push({
        id: `log-${l.id}`,
        date: new Date(l.sentAt),
        label: statusLabel,
        details: `Campaign: "${l.campaign?.name || "N/A"}"`,
        iconColor,
      });
    }

    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  const handleSaveNotes = () => {
    updateLead.mutate({ notes });
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLead.mutate({ pipelineStage: e.target.value });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity duration-200" 
        onClick={onClose} 
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-border shadow-2xl flex flex-col h-full animate-slide-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-text">Lead Details</h2>
            {lead && !isLoading && !lead.error && (
              <div 
                className="flex items-center justify-center w-7 h-7 rounded-lg font-bold border border-primary/20 bg-primary/5 text-primary text-xs"
                title={`Quality Score: ${lead.leadScore ?? 0}/100`}
              >
                {lead.leadScore ?? 0}
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-muted hover:text-text cursor-pointer p-1 rounded hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Loading details...</span>
            </div>
          ) : lead?.error ? (
            <div className="text-center text-red-500 py-10">
              Failed to load lead details.
            </div>
          ) : (
            <>
              {/* Business Summary */}
              <div>
                <h3 className="font-bold text-xl text-text leading-tight">{lead.name}</h3>
                {lead.category && <p className="text-sm font-semibold text-primary mt-1">{lead.category}</p>}
                {lead.address && (
                  <p className="text-xs text-muted flex items-center gap-1 mt-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {lead.address}
                  </p>
                )}
              </div>

              {/* CRM Pipeline Stage Selection */}
              <div className="bg-background rounded-xl p-4 border border-border">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">Pipeline Stage</label>
                <select 
                  className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer font-medium text-text"
                  value={lead.pipelineStage}
                  onChange={handleStageChange}
                  disabled={updateLead.isPending}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="replied">Replied</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* AI Reply Analyzer Section */}
              {lead.emailLogs?.some((l: any) => l.status === "replied" && l.replyBody) && (
                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2.5">🤖 AI Reply Analyzer</h4>
                  {lead.emailLogs.filter((l: any) => l.status === "replied" && l.replyBody).map((log: any) => {
                    const intentColors: Record<string, string> = {
                      interested: "bg-emerald-100 text-emerald-800 border-emerald-200",
                      meeting_requested: "bg-blue-100 text-blue-800 border-blue-200",
                      not_interested: "bg-gray-100 text-gray-800 border-gray-200",
                      unsubscribed: "bg-red-100 text-red-800 border-red-200",
                    };
                    const badgeClass = intentColors[log.replyClassification || ""] || "bg-slate-100 text-slate-800 border-slate-200";
                    const formattedClassification = (log.replyClassification || "interested").replace(/_/g, " ");

                    return (
                      <div key={log.id} className="flex flex-col gap-3 text-sm">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-muted">Lead Reply</span>
                            <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border tracking-wide", badgeClass)}>
                              {formattedClassification}
                            </span>
                          </div>
                          <blockquote className="bg-white border-l-2 border-amber-300 p-2.5 rounded text-xs text-text italic break-all max-h-40 overflow-y-auto">
                            "{log.replyBody}"
                          </blockquote>
                        </div>
                        {log.replySuggestedResponse && (
                          <div className="pt-2 border-t border-amber-200/50">
                            <div className="text-xs font-semibold text-muted mb-1.5 flex items-center gap-1">
                              <span>Recommended Follow-up Draft</span>
                            </div>
                            <div className="bg-white/80 border border-border p-3 rounded-lg text-xs text-text relative whitespace-pre-wrap select-all font-medium leading-relaxed">
                              {log.replySuggestedResponse}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Status and Rating Indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-border rounded-lg">
                  <span className="text-[10px] font-semibold text-muted uppercase block">Website Status</span>
                  <div className="mt-1">
                    <StatusBadge status={lead.websiteStatus} />
                  </div>
                  {lead.websiteUrl && (
                    <a 
                      href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-primary hover:underline font-medium block truncate mt-1 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 inline mr-1" />
                      {lead.websiteUrl}
                    </a>
                  )}
                </div>

                <div className="p-3 border border-border rounded-lg">
                  <span className="text-[10px] font-semibold text-muted uppercase block">Google Rating</span>
                  {lead.rating ? (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-text">{lead.rating}</span>
                      <span className="text-xs text-muted">({lead.reviewCount || 0} reviews)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted block mt-1.5">No reviews</span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Contact Details</h4>
                <div className="flex flex-col gap-2 p-3 border border-border rounded-xl">
                  <ContactBadge
                    email={lead.email}
                    phone={lead.phone}
                    socialLinks={lead.socialLinks}
                    bestContact={lead.bestContact}
                    emailVerifiedStatus={lead.emailVerifiedStatus}
                  />
                </div>
              </div>

              {/* CRM Lead Notes */}
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Lead Notes</h4>
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={4}
                    placeholder="Add manual notes about this lead (e.g. call summary, response details...)"
                    className="w-full rounded-md border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white placeholder:text-muted/50 text-text resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSaveNotes} 
                    loading={updateLead.isPending}
                    className="self-end animate-fade-in"
                  >
                    Save Notes
                  </Button>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Activity History</h4>
                <div className="relative border-l-2 border-border ml-2 pl-4 flex flex-col gap-5">
                  {timeline.map((item) => (
                    <div key={item.id} className="relative">
                      {/* Timeline dot */}
                      <div className={cn("absolute -left-[23px] top-1 w-3 h-3 rounded-full ring-4 ring-white shrink-0", item.iconColor)} />
                      
                      <div className="flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-semibold text-text">{item.label}</span>
                          <span className="text-[10px] text-muted whitespace-nowrap">
                            {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {item.details && (
                          <p className="text-xs text-muted mt-0.5">{item.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

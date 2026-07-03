"use client";

import { Button } from "@/components/ui/Button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Send, RefreshCw, ChevronRight, Plus } from "lucide-react";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { cn } from "@/lib/utils";
import { SequenceBuilder } from "@/components/campaigns/SequenceBuilder";

interface Lead { id: number; name: string; email: string | null; websiteStatus: string; category: string | null; }
interface Draft { id: number; leadId: number; subject: string; body: string; status: string; editedByUser: boolean; lead: { name: string; email: string | null; websiteStatus: string; category: string | null } }
interface EmailAccount { id: number; gmailAddress: string; isDefault: boolean; }
interface Campaign { id: number; name: string; status: string; }

export default function ComposePage() {
  const qc = useQueryClient();
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<number | null>(null);
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [emailAccountId, setEmailAccountId] = useState<number | null>(null);
  const [gmailAddress, setGmailAddress] = useState<string>("");
  const [campaignName, setCampaignName] = useState("");
  const [isSequence, setIsSequence] = useState(false);

  const { data: leadsData } = useQuery({ queryKey: ["leads", "compose"], queryFn: () => fetch("/api/leads?pageSize=200").then(r => r.json()) });
  const { data: accounts } = useQuery<EmailAccount[]>({ queryKey: ["email-accounts"], queryFn: () => fetch("/api/email-accounts").then(r => r.json()) });
  const { data: drafts, refetch: refetchDrafts } = useQuery<Draft[]>({
    queryKey: ["drafts", activeCampaign],
    queryFn: () => fetch(`/api/campaigns/${activeCampaign}/drafts`).then(r => r.json()),
    enabled: !!activeCampaign,
    refetchInterval: 3000,
  });

  const leads: Lead[] = leadsData?.items ?? [];

  const createCampaign = useMutation({
    mutationFn: () => fetch("/api/campaigns", {
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
    onSuccess: (c: Campaign) => setActiveCampaign(c.id),
  });

  const generateAll = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${activeCampaign}/generate`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => setTimeout(() => refetchDrafts(), 2000),
  });

  const sendAll = useMutation({
    mutationFn: () => fetch(`/api/campaigns/${activeCampaign}/send`, { method: "POST" }).then(r => r.json()),
  });

  const updateCampaignAccount = useMutation({
    mutationFn: (emailAccountId: number) => fetch(`/api/campaigns/${activeCampaign}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailAccountId }),
    }).then(r => r.json()),
  });

  const saveDraft = useMutation({
    mutationFn: ({ id, subject, body }: { id: number; subject: string; body: string }) =>
      fetch(`/api/drafts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, body }) }).then(r => r.json()),
    onSuccess: () => refetchDrafts(),
  });

  const regenerate = useMutation({
    mutationFn: (id: number) => fetch(`/api/drafts/${id}/regenerate`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => setTimeout(() => refetchDrafts(), 3000),
  });

  const pendingDrafts = drafts?.filter(d => d.status === "pending") ?? [];
  const sentDrafts = drafts?.filter(d => d.status === "sent") ?? [];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Left: Lead selection or campaign setup */}
      <div className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-border bg-white flex flex-col max-h-[40vh] md:max-h-full">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-text">Compose Campaign</h2>
        </div>

        {!activeCampaign ? (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <input
              className="h-9 w-full rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Campaign name (optional)"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
            />

            {accounts && accounts.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Send from</label>
                <select
                  className="w-full h-9 rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={emailAccountId ?? ""}
                  onChange={e => setEmailAccountId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select Gmail account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.gmailAddress}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Or enter Gmail address (must be connected in Settings first)</label>
              <input
                type="email"
                className="w-full h-9 rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="your@gmail.com"
                value={gmailAddress}
                onChange={e => setGmailAddress(e.target.value)}
              />
              <p className="text-xs text-muted mt-1">Note: You must connect this Gmail account in Settings first for sending to work.</p>
            </div>
            
            {activeCampaign && accounts && accounts.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Campaign Gmail Account</label>
                <select
                  className="w-full h-9 rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={drafts?.[0]?.campaign?.emailAccountId ?? ""}
                  onChange={e => updateCampaignAccount.mutate(Number(e.target.value))}
                >
                  <option value="">Select Gmail account</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.gmailAddress}</option>)}
                </select>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted">Select Leads ({selectedLeads.length})</label>
                <button onClick={() => setSelectedLeads(leads.filter(l => l.email).map(l => l.id))} className="text-xs text-primary cursor-pointer hover:underline">All with email</button>
              </div>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto border border-border rounded-md">
                {leads.filter(l => l.email).map(lead => (
                  <label key={lead.id} className="flex items-center gap-2 px-3 py-2 hover:bg-background cursor-pointer">
                    <input type="checkbox" className="accent-primary" checked={selectedLeads.includes(lead.id)} onChange={() => setSelectedLeads(s => s.includes(lead.id) ? s.filter(i => i !== lead.id) : [...s, lead.id])} />
                    <span className="text-sm text-text truncate flex-1">{lead.name}</span>
                    <StatusBadge status={lead.websiteStatus} />
                  </label>
                ))}
                {leads.filter(l => l.email).length === 0 && <p className="text-xs text-muted p-3">No leads with email yet. Crawl contact pages first.</p>}
              </div>
            </div>

             <div className="flex items-center gap-2 mt-2">
               <input type="checkbox" id="seq" checked={isSequence} onChange={e => setIsSequence(e.target.checked)} className="accent-primary" />
               <label htmlFor="seq" className="text-xs font-medium text-text cursor-pointer">Email Sequence (multi-step drip)</label>
             </div>
              <Button className="w-full" disabled={selectedLeads.length === 0 || (!emailAccountId && !gmailAddress)} onClick={() => createCampaign.mutate()} loading={createCampaign.isPending}>
                <ChevronRight className="w-4 h-4" />
                Create Campaign ({selectedLeads.length} leads)
              </Button>
              {!emailAccountId && !gmailAddress && (
                <p className="text-xs text-red-500 mt-1">Please select a Gmail account or enter your Gmail address</p>
              )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 bg-primary/5 border-b border-border flex items-center justify-between">
              <span className="text-xs text-primary font-medium">{pendingDrafts.length} pending · {sentDrafts.length} sent</span>
              <button onClick={() => setActiveCampaign(null)} className="text-xs text-muted hover:text-text cursor-pointer">← Back</button>
            </div>
            {drafts?.map(draft => (
              <button
                key={draft.id}
                onClick={() => setActiveDraft(draft)}
                className={cn("w-full text-left px-3 py-3 border-b border-border hover:bg-background transition-colors cursor-pointer", activeDraft?.id === draft.id && "bg-primary/5 border-l-2 border-l-primary")}
              >
                <p className="text-sm font-medium text-text truncate">{draft.lead.name}</p>
                <p className="text-xs text-muted truncate mt-0.5">{draft.subject || "No subject yet"}</p>
                <span className={cn("text-xs mt-1 inline-block", draft.status === "sent" ? "text-emerald-600" : draft.editedByUser ? "text-amber-600" : "text-muted")}>
                  {draft.status === "sent" ? "Sent" : draft.editedByUser ? "Edited" : "Draft"}
                </span>
              </button>
            ))}
          </div>
        )}

        {activeCampaign && (
           <div className="p-3 border-t border-border flex flex-col gap-2">
             {isSequence && <SequenceBuilder campaignId={activeCampaign} />}
             <Button variant="secondary" size="sm" className="w-full" onClick={() => generateAll.mutate()} loading={generateAll.isPending}>
               <Sparkles className="w-4 h-4" /> Generate All with AI
             </Button>
             <Button variant="cta" size="sm" className="w-full" onClick={() => sendAll.mutate()} loading={sendAll.isPending}>
               <Send className="w-4 h-4" /> Send All
             </Button>
           </div>
         )}
      </div>

      {/* Right: Draft editor */}
      <div className="flex-1 flex flex-col bg-background h-[60vh] md:h-full overflow-hidden">
        {activeDraft ? (
          <DraftEditor
            key={activeDraft.id}
            draft={activeDraft}
            onSave={(subject, body) => saveDraft.mutate({ id: activeDraft.id, subject, body })}
            onRegenerate={() => regenerate.mutate(activeDraft.id)}
            onSent={() => { refetchDrafts(); }}
            saving={saveDraft.isPending}
            regenerating={regenerate.isPending}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted">
            <div className="text-center">
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{activeCampaign ? "Select a lead to edit its draft" : "Create a campaign to start"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DraftEditor({ draft, onSave, onRegenerate, onSent, saving, regenerating }: {
  draft: Draft;
  onSave: (subject: string, body: string) => void;
  onRegenerate: () => void;
  onSent?: () => void;
  saving: boolean;
  regenerating: boolean;
}) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [rankResult, setRankResult] = useState<any>(null);
  const [toneResult, setToneResult] = useState<any>(null);
  const [analyzingTone, setAnalyzingTone] = useState(false);
  const [spamResult, setSpamResult] = useState<any>(null);
  const [checkingSpam, setCheckingSpam] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSendViaGmail = async () => {
    setSending(true);
    setSendError(null);
    onSave(subject, body);
    try {
      const res = await fetch(`/api/drafts/${draft.id}/send`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error || "Failed to send");
      } else {
        onSent?.();
      }
    } catch {
      setSendError("Network error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-text">{draft.lead.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={draft.lead.websiteStatus} />
            {draft.lead.email && <span className="text-xs text-muted">{draft.lead.email}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="secondary" size="sm" onClick={onRegenerate} loading={regenerating}>
             <RefreshCw className="w-3.5 h-3.5" /> Regenerate
           </Button>
           <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                setAnalyzingTone(true);
                const res = await fetch("/api/tools/analyze-tone", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subject, body }),
                });
                setToneResult(await res.json());
                setAnalyzingTone(false);
              }}
              loading={analyzingTone}
            >
              🎯 Analyze Tone
            </Button>
           <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                setCheckingSpam(true);
                setSpamResult(null);
                const res = await fetch("/api/tools/spam-score", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subject, body }),
                });
                setSpamResult(await res.json());
                setCheckingSpam(false);
              }}
              loading={checkingSpam}
            >
              🚫 Check Spam
            </Button>
          {draft.status !== "sent" && (
            <Button variant="cta" size="sm" onClick={handleSendViaGmail} loading={sending}>
              <Send className="w-3.5 h-3.5" /> Send via Gmail
            </Button>
          )}
          <Button size="sm" onClick={() => onSave(subject, body)} loading={saving}>
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
         <div>
           <label className="text-sm font-medium text-text block mb-1">Subject</label>
           <input
             className="w-full h-10 rounded-md border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
             value={subject}
             onChange={e => setSubject(e.target.value)}
           />
           {subject.includes("|||") && (
             <button
               onClick={async () => {
                 const subjects = subject.split("|||").map(s => s.trim());
                 const res = await fetch("/api/tools/rank-subjects", {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({ subjects, businessName: draft.lead.name }),
                 });
                 setRankResult(await res.json());
               }}
               className="text-xs text-primary hover:underline mt-1"
             >
               🏆 Rank these subject lines
             </button>
           )}
           {rankResult && (
             <div className="mt-2 bg-background border border-border rounded-lg p-3">
               <p className="text-xs font-semibold text-text mb-2">Subject Line Ranking</p>
               {rankResult.map((item: any, i: number) => (
                 <div key={i} className="mb-2 last:mb-0">
                   <div className="flex items-center gap-2">
                     <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                       {item.rank}
                     </span>
                     <span className="text-xs font-medium text-text">{item.subject}</span>
                   </div>
                   <p className="text-[10px] text-muted ml-7">{item.reason}</p>
                 </div>
               ))}
             </div>
           )}
         </div>
        <div className="flex-1 flex flex-col">
          <label className="text-sm font-medium text-text block mb-1">Body</label>
          <textarea
            className="flex-1 min-h-[300px] w-full rounded-md border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white resize-none"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>
         <p className="text-xs text-muted">
            Variables: <code className="bg-background px-1 rounded">{`{{name}}`}</code> · <code className="bg-background px-1 rounded">{`{{city}}`}</code> · <code className="bg-background px-1 rounded">{`{{category}}`}</code>
         </p>
          {toneResult && (
            <div className="mt-4 bg-background border border-border rounded-lg p-3">
              <p className="text-xs font-semibold text-text mb-2">Tone Analysis</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium">Score:</span>
                <span className={`text-xs font-bold ${
                  toneResult.score >= 75 ? 'text-emerald-600' : 
                  toneResult.score >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {toneResult.score}/100
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  toneResult.score >= 75 ? 'bg-emerald-100 text-emerald-800' : 
                  toneResult.score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {toneResult.verdict.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
              {toneResult.issues?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-text mb-1">Issues:</p>
                  <ul className="text-xs text-muted space-y-1">
                    {toneResult.issues.map((issue: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>⚠️</span> {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {toneResult.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text mb-1">Suggestions:</p>
                  <ul className="text-xs text-muted space-y-1">
                    {toneResult.suggestions.map((suggestion: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>💡</span> {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {sendError && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-medium text-red-700">Failed to send: {sendError}</p>
            </div>
          )}
          {spamResult && (
            <div className="mt-4 bg-background border border-border rounded-lg p-3">
              <p className="text-xs font-semibold text-text mb-2">Spam Score Check</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium">Risk Score:</span>
                <span className={`text-xs font-bold ${
                  spamResult.score <= 20 ? 'text-emerald-600' : 
                  spamResult.score <= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {spamResult.score}/100
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  spamResult.score <= 20 ? 'bg-emerald-100 text-emerald-800' : 
                  spamResult.score <= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {spamResult.score <= 20 ? 'LOW RISK' : spamResult.score <= 50 ? 'MEDIUM' : 'HIGH RISK'}
                </span>
              </div>
              {spamResult.flags?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-text mb-1">Flags:</p>
                  <ul className="text-xs text-muted space-y-1">
                    {spamResult.flags.map((flag: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>🚩</span> {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {spamResult.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text mb-1">Suggestions:</p>
                  <ul className="text-xs text-muted space-y-1">
                    {spamResult.suggestions.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>💡</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

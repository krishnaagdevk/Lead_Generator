"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Mail, Trash2, Star, ExternalLink, CheckCircle, AlertCircle, Copy, Key, RefreshCw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

interface EmailAccount { id: number; gmailAddress: string; dailyLimit: number; dailySent: number; isDefault: boolean; warmupStatus: string; warmupDay: number; }
interface User { id: number; email: string; plan: string; usageLeads: number; usageAiCalls: number; }
interface ApiKey { id: number; name: string; keyPrefix: string; lastUsed: string | null; createdAt: string; }

const PLAN_LIMITS: Record<string, { leads: number; ai: number }> = {
  free:    { leads: 50,    ai: 0 },
  starter: { leads: 1000,  ai: 500 },
  pro:     { leads: 10000, ai: 5000 },
  agency:  { leads: 99999, ai: 99999 },
};

function SettingsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const connected = params.get("connected");
  const error = params.get("error");
  const qc = useQueryClient();

  const { data: user } = useQuery<User & { 
    calendlyUrl?: string; slackBotToken?: string; slackChannelId?: string;
    webhookUrl?: string; webhookEnabled?: boolean;
    brandName?: string; brandLogo?: string; brandColor?: string; whiteLabel?: boolean;
  }>({ 
    queryKey: ["me"], 
    queryFn: () => fetch("/api/auth/me").then(r => r.json()) 
  });
  const { data: accounts } = useQuery<EmailAccount[]>({ queryKey: ["email-accounts"], queryFn: () => fetch("/api/email-accounts").then(r => r.json()) });

  // ── Profile ──
  const [profileEmail, setProfileEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePlan, setProfilePlan] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // ── Integrations ──
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const [slackBotToken, setSlackBotToken] = useState("");
  const [slackChannelId, setSlackChannelId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [integSuccess, setIntegSuccess] = useState("");

  // ── White-label ──
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [brandSuccess, setBrandSuccess] = useState("");

  // ── API Keys ──
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRaw, setNewKeyRaw] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");
  const { data: apiKeys, refetch: refetchKeys } = useQuery<ApiKey[]>({ queryKey: ["api-keys"], queryFn: () => fetch("/api/tools/api-keys").then(r => r.json()) });

  useEffect(() => {
    if (!user) return;
    setProfileEmail(user.email);
    setProfilePlan(user.plan);
    setCalendlyUrl((user as any).calendlyUrl ?? "");
    setSlackBotToken((user as any).slackBotToken ?? "");
    setSlackChannelId((user as any).slackChannelId ?? "");
    setWebhookUrl((user as any).webhookUrl ?? "");
    setWebhookEnabled((user as any).webhookEnabled ?? false);
    setBrandName((user as any).brandName ?? "");
    setBrandLogo((user as any).brandLogo ?? "");
    setBrandColor((user as any).brandColor ?? "");
    setWhiteLabel((user as any).whiteLabel ?? false);
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      setProfileError(""); setProfileSuccess("");
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profileEmail, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined, plan: profilePlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      return data;
    },
    onSuccess: () => { setProfileSuccess("Profile updated!"); setCurrentPassword(""); setNewPassword(""); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (err: any) => setProfileError(err.message),
  });

  const updateSettings = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  // ── Team ──
  const [teamEmail, setTeamEmail] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [teamError, setTeamError] = useState("");
  const { data: teamMembers, refetch: refetchTeam } = useQuery<any[]>({ queryKey: ["team-members"], queryFn: () => fetch("/api/team/members").then(r => r.json()), enabled: user?.plan === "agency" });

  const inviteMember = useMutation({
    mutationFn: async () => { setTeamError(""); const res = await fetch("/api/team/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: teamEmail, password: teamPassword }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Failed to invite"); return data; },
    onSuccess: () => { setTeamEmail(""); setTeamPassword(""); refetchTeam(); },
    onError: (err: any) => setTeamError(err.message),
  });

  const removeMember = useMutation({ mutationFn: async (id: number) => { const res = await fetch("/api/team/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); if (!res.ok) throw new Error("Failed to remove member"); }, onSuccess: () => refetchTeam() });

  const connectGmail = useMutation({ mutationFn: () => fetch("/api/email-accounts/connect").then(r => r.json()), onSuccess: (data: { authUrl: string }) => window.location.href = data.authUrl });
  const disconnect = useMutation({ mutationFn: (id: number) => fetch("/api/email-accounts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["email-accounts"] }) });

  const toggleWarmup = useMutation({ mutationFn: async ({ id, warmupStatus }: { id: number; warmupStatus: string }) => { const res = await fetch("/api/email-accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, warmupStatus }) }); if (!res.ok) throw new Error("Failed to update warmup settings"); return res.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["email-accounts"] }) });

  const limits = user ? PLAN_LIMITS[user.plan] ?? PLAN_LIMITS.free : null;

  return (
    <div className="p-6 max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-text">Settings</h1>
        <p className="text-sm text-muted mt-0.5">Manage your account, Gmail connections, integrations, and branding.</p>
      </div>

      {connected && <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm"><CheckCircle className="w-4 h-4 shrink-0" />Gmail account connected successfully.</div>}
      {error && <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />Gmail connection failed. Check your OAuth credentials.</div>}

      {/* Profile */}
      <section className="bg-white rounded-xl border border-border p-6 flex flex-col gap-6">
        <div><h2 className="text-base font-semibold text-text">Profile Settings</h2><p className="text-xs text-muted mt-1">Manage your account credentials, email address, and plan settings.</p></div>
        {profileSuccess && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 font-semibold">{profileSuccess}</div>}
        {profileError && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 font-semibold">{profileError}</div>}
        <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase">Email Address</label>
              <input type="email" required value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase">Current Plan</label>
              <select value={profilePlan} onChange={(e) => setProfilePlan(e.target.value)} className="h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text cursor-pointer">
                <option value="free">Free Plan</option>
                <option value="starter">Starter Plan</option>
                <option value="pro">Pro Plan</option>
                <option value="agency">Agency Plan</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase">Current Password (to confirm edits)</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted uppercase">New Password (optional)</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" className="h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" loading={updateProfile.isPending} className="px-6">Save Profile Edits</Button>
          </div>
        </form>
      </section>

      {/* Plan Usage */}
      {user && limits && (
        <section>
          <h2 className="text-base font-semibold text-text mb-3">Plan Usage</h2>
          <div className="bg-white rounded-xl border border-border p-4 flex flex-col gap-4">
            <UsageBar label="Leads this month" used={user.usageLeads} limit={limits.leads} />
            <UsageBar label="AI drafts this month" used={user.usageAiCalls} limit={limits.ai} />
            {user.plan === "free" && (
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted mb-2">Upgrade for more leads and AI generation</p>
                <div className="flex gap-2"><Button size="sm" onClick={() => router.push("/pricing")}>View Plans</Button></div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Gmail Accounts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text">Connected Gmail Accounts</h2>
          <Button size="sm" variant="secondary" onClick={() => connectGmail.mutate()} loading={connectGmail.isPending}><Mail className="w-4 h-4" /> Connect Gmail</Button>
        </div>
        {!accounts?.length && (
          <div className="bg-white rounded-xl border border-border border-dashed p-8 text-center text-muted">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No Gmail accounts connected</p>
            <p className="text-xs mt-1">Connect your Gmail to send cold emails directly.</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {accounts?.map(account => {
            const isWarmupActive = account.warmupStatus === "active";
            const isWarmupCompleted = account.warmupStatus === "completed";
            const effectiveLimit = isWarmupActive ? Math.min(account.dailyLimit, 5 + (account.warmupDay - 1) * 5) : account.dailyLimit;
            return (
              <div key={account.id} className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm shrink-0">{account.gmailAddress[0].toUpperCase()}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text">{account.gmailAddress}</p>
                      {account.isDefault && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    </div>
                    <div className="mt-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-background rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((account.dailySent / effectiveLimit) * 100, 100)}%` }} /></div>
                        <span className="text-xs text-muted">{account.dailySent}/{effectiveLimit} sent today {isWarmupActive && `(max ${account.dailyLimit})`}</span>
                      </div>
                      {isWarmupActive && <p className="text-[10px] font-bold text-amber-600">🔥 Warm-up Day {account.warmupDay}</p>}
                      {isWarmupCompleted && <p className="text-[10px] font-bold text-emerald-600">✅ Warm-up Completed</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button onClick={() => { const nextStatus = isWarmupActive ? "inactive" : "active"; toggleWarmup.mutate({ id: account.id, warmupStatus: nextStatus }); }} className={cn("px-2.5 py-1.5 rounded border text-xs font-semibold cursor-pointer transition-colors duration-150", isWarmupActive ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : isWarmupCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed opacity-80" : "bg-background text-muted border-border hover:bg-background/80")} disabled={isWarmupCompleted}>{isWarmupActive ? "Pause Warm-up" : isWarmupCompleted ? "Warm-up Done" : "Start Warm-up"}</button>
                  <button onClick={() => disconnect.mutate(account.id)} className="text-muted hover:text-red-500 cursor-pointer transition-colors p-1 border border-transparent rounded hover:border-border"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Integrations */}
      <section className="bg-white rounded-xl border border-border p-6 flex flex-col gap-6">
        <div><h2 className="text-base font-semibold text-text">Integrations</h2><p className="text-xs text-muted mt-1">Connect Calendly, Slack, and webhooks to extend LeadHunter.</p></div>
        {integSuccess && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 font-semibold">{integSuccess}</div>}

        {/* Calendly */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted uppercase">Calendly URL</label>
          <div className="flex gap-2">
            <input type="url" value={calendlyUrl} onChange={(e) => setCalendlyUrl(e.target.value)} placeholder="https://calendly.com/your-name" className="flex-1 h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
            <Button size="sm" onClick={() => { updateSettings.mutate({ calendlyUrl }); setIntegSuccess("Calendly URL saved!"); }}>Save</Button>
          </div>
          <p className="text-[10px] text-muted mt-0.5">Appears in AI-generated email signatures so leads can book you directly.</p>
        </div>

        {/* Slack */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-bold text-muted uppercase">Slack Notifications</label>
          <input type="password" value={slackBotToken} onChange={(e) => setSlackBotToken(e.target.value)} placeholder="xoxb-..." className="h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
          <input type="text" value={slackChannelId} onChange={(e) => setSlackChannelId(e.target.value)} placeholder="C0123ABC..." className="h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { updateSettings.mutate({ slackBotToken, slackChannelId }); setIntegSuccess("Slack settings saved!"); }}>Save Slack</Button>
          </div>
        </div>

        {/* Webhook */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-bold text-muted uppercase">Webhook URL</label>
          <div className="flex gap-2 items-center">
            <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." className="flex-1 h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={webhookEnabled} onChange={(e) => setWebhookEnabled(e.target.checked)} className="rounded border-border" />
              Enabled
            </label>
            <Button size="sm" onClick={() => { updateSettings.mutate({ webhookUrl, webhookEnabled }); setIntegSuccess("Webhook settings saved!"); }}>Save</Button>
          </div>
          <p className="text-[10px] text-muted">Fires on <code>leads.created</code> when new leads are discovered. Use with Zapier, Make, or n8n.</p>
        </div>
      </section>

      {/* API Keys */}
      <section className="bg-white rounded-xl border border-border p-6 flex flex-col gap-4">
        <div><h2 className="text-base font-semibold text-text">API Keys</h2><p className="text-xs text-muted mt-1">Create and manage API keys for programmatic access to your leads.</p></div>

        {newKeyRaw && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
            <p className="font-bold text-amber-800 mb-1">⚡ Save this key — it will not be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-amber-300 rounded px-3 py-2 text-xs font-mono break-all">{newKeyRaw}</code>
              <button onClick={() => { navigator.clipboard.writeText(newKeyRaw); }} className="text-amber-700 hover:text-amber-900 cursor-pointer p-1"><Copy className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {apiKeyError && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 font-semibold">{apiKeyError}</div>}

        <div className="flex gap-2">
          <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key name (e.g. CI/CD)" className="flex-1 h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
          <Button size="sm" onClick={async () => { try { setApiKeyError(""); setNewKeyRaw(""); const res = await fetch("/api/tools/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newKeyName }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setNewKeyRaw(data.raw); setNewKeyName(""); refetchKeys(); } catch (err: any) { setApiKeyError(err.message); } }} disabled={!newKeyName.trim()}>Generate Key</Button>
        </div>

        <div className="flex flex-col gap-2">
          {apiKeys?.map(key => (
            <div key={key.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text">{key.name}</p>
                <p className="text-xs text-muted font-mono">{key.keyPrefix}... · {key.lastUsed ? `Last used ${new Date(key.lastUsed).toLocaleDateString()}` : "Never used"} · Created {new Date(key.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={async () => { await fetch("/api/tools/api-keys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: key.id }) }); refetchKeys(); }} className="text-muted hover:text-red-500 cursor-pointer p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {apiKeys?.length === 0 && <p className="text-xs text-muted text-center py-4">No API keys created yet.</p>}
        </div>
      </section>

      {/* White-Label Branding */}
      <section className="bg-white rounded-xl border border-border p-6 flex flex-col gap-4">
        <div><h2 className="text-base font-semibold text-text">White-Label Branding</h2><p className="text-xs text-muted mt-1">Replace LeadHunter branding with your own agency name and logo.</p></div>
        {brandSuccess && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 font-semibold">{brandSuccess}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted uppercase">Brand Name</label>
            <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Your Agency Name" className="h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted uppercase">Brand Color (hex)</label>
            <div className="flex gap-2">
              <input type="color" value={brandColor || "#6366f1"} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-12 border border-border rounded-md cursor-pointer" />
              <input type="text" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#6366f1" className="flex-1 h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text font-mono" />
            </div>
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[10px] font-bold text-muted uppercase">Brand Logo URL</label>
            <input type="url" value={brandLogo} onChange={(e) => setBrandLogo(e.target.value)} placeholder="https://your-agency.com/logo.png" className="h-10 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
            <input type="checkbox" checked={whiteLabel} onChange={(e) => setWhiteLabel(e.target.checked)} className="rounded border-border" />
            Enable white-label mode
          </label>
          <Button size="sm" onClick={() => { updateSettings.mutate({ brandName, brandLogo, brandColor, whiteLabel }); setBrandSuccess("Branding saved!"); }}>Save Branding</Button>
        </div>
        {whiteLabel && brandName && (
          <div className="bg-background rounded-lg border border-border p-4 flex items-center gap-4">
            {brandLogo && <img src={brandLogo} alt={brandName} className="h-8 w-8 rounded object-contain" />}
            <div>
              <p className="text-sm font-bold text-text">Preview: {brandName}</p>
              <p className="text-xs text-muted">Sidebar will show "{brandName}" instead of "LeadHunter"</p>
            </div>
          </div>
        )}
      </section>

      {/* Team Seats */}
      {user?.plan === "agency" && (
        <section className="bg-white rounded-xl border border-border p-6 flex flex-col gap-6">
          <div><h2 className="text-base font-semibold text-text">Team Collaboration</h2><p className="text-xs text-muted mt-1">Manage team members who can access and collaborate on this agency account.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form onSubmit={(e) => { e.preventDefault(); inviteMember.mutate(); }} className="flex flex-col gap-3 p-4 border border-border rounded-xl md:col-span-1 bg-background/20">
              <h3 className="text-sm font-semibold text-text">Add Team Member</h3>
              {teamError && <p className="text-xs text-red-500 font-medium">{teamError}</p>}
              <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-muted uppercase">Email Address</label><input type="email" required value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} className="h-9 px-3 text-xs bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" placeholder="name@agency.com" /></div>
              <div className="flex flex-col gap-1"><label className="text-[10px] font-bold text-muted uppercase">Password</label><input type="password" required value={teamPassword} onChange={(e) => setTeamPassword(e.target.value)} className="h-9 px-3 text-xs bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-text" placeholder="••••••••" /></div>
              <Button type="submit" disabled={inviteMember.isPending} className="w-full h-9 text-xs font-semibold">{inviteMember.isPending ? "Inviting..." : "Add Member"}</Button>
            </form>
            <div className="flex flex-col gap-3 md:col-span-2">
              <h3 className="text-sm font-semibold text-text">Current Members ({teamMembers?.length || 1}/5)</h3>
              <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                {teamMembers?.map((m: any) => (
                  <div key={m.id} className="bg-white rounded-lg border border-border p-3 flex justify-between items-center text-xs">
                    <div><p className="font-semibold text-text">{m.email}</p><p className="text-[10px] text-muted capitalize font-medium">{m.role}</p></div>
                    {m.role !== "owner" && <button type="button" onClick={() => removeMember.mutate(m.id)} disabled={removeMember.isPending} className="text-muted hover:text-red-500 cursor-pointer p-1 rounded hover:bg-red-50/50"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text">{label}</span>
        <span className="text-muted">{limit === 99999 ? `${used} / Unlimited` : `${used} / ${limit.toLocaleString()}`}</span>
      </div>
      <div className="h-2 bg-background rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct > 80 ? "#ef4444" : "var(--color-primary)" }} /></div>
    </div>
  );
}

export default function SettingsPage() {
  return <Suspense><SettingsContent /></Suspense>;
}
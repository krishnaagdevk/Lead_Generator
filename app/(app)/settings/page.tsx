"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Mail, Trash2, Star, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface EmailAccount { id: number; gmailAddress: string; dailyLimit: number; dailySent: number; isDefault: boolean; }
interface User { id: number; email: string; plan: string; usageLeads: number; usageAiCalls: number; }

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

  const { data: user } = useQuery<User>({ queryKey: ["me"], queryFn: () => fetch("/api/auth/me").then(r => r.json()) });
  const { data: accounts } = useQuery<EmailAccount[]>({ queryKey: ["email-accounts"], queryFn: () => fetch("/api/email-accounts").then(r => r.json()) });

  const connectGmail = useMutation({
    mutationFn: () => fetch("/api/email-accounts/connect").then(r => r.json()),
    onSuccess: (data: { authUrl: string }) => window.location.href = data.authUrl,
  });

  const disconnect = useMutation({
    mutationFn: (id: number) => fetch("/api/email-accounts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-accounts"] }),
  });

  const limits = user ? PLAN_LIMITS[user.plan] ?? PLAN_LIMITS.free : null;

  return (
    <div className="p-6 max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-text">Settings</h1>
        <p className="text-sm text-muted mt-0.5">Manage your account, Gmail connections, and plan.</p>
      </div>

      {/* OAuth feedback */}
      {connected && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Gmail account connected successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Gmail connection failed. Check your OAuth credentials.
        </div>
      )}

      {/* Account Info */}
      <section>
        <h2 className="text-base font-semibold text-text mb-3">Account</h2>
        <div className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-primary/10 text-primary font-medium rounded-full px-2 py-0.5 capitalize">{user?.plan}</span>
            </div>
          </div>
        </div>
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
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => router.push("/pricing")}>View Plans</Button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Gmail Accounts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text">Connected Gmail Accounts</h2>
          <Button size="sm" variant="secondary" onClick={() => connectGmail.mutate()} loading={connectGmail.isPending}>
            <Mail className="w-4 h-4" /> Connect Gmail
          </Button>
        </div>

        {!accounts?.length && (
          <div className="bg-white rounded-xl border border-border border-dashed p-8 text-center text-muted">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No Gmail accounts connected</p>
            <p className="text-xs mt-1">Connect your Gmail to send cold emails directly.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {accounts?.map(account => (
            <div key={account.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm">
                  {account.gmailAddress[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text">{account.gmailAddress}</p>
                    {account.isDefault && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  </div>
                  <div className="mt-0.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-background rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((account.dailySent / account.dailyLimit) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs text-muted">{account.dailySent}/{account.dailyLimit} today</span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => disconnect.mutate(account.id)} className="text-muted hover:text-red-500 cursor-pointer transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* API Keys info */}
      <section>
        <h2 className="text-base font-semibold text-text mb-3">API Keys</h2>
        <div className="bg-white rounded-xl border border-border p-4 text-sm text-muted">
          <p>API keys are configured via the <code className="bg-background px-1 rounded text-xs">.env.local</code> file. See <code className="bg-background px-1 rounded text-xs">.env.example</code> for all required variables.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              { key: "GOOGLE_PLACES_API_KEY", label: "Google Places" },
              { key: "GOOGLE_OAUTH_CLIENT_ID", label: "Google OAuth" },
              { key: "GROQ_API_KEY", label: "Groq AI" },
              { key: "STRIPE_SECRET_KEY", label: "Stripe" },
            ].map(({ label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-background rounded px-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-muted/40" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>
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
      <div className="h-2 bg-background rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct > 80 ? "#ef4444" : "var(--color-primary)" }} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

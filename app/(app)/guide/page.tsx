"use client";

import { useState } from "react";
import {
  Map, Users, Mail, Layers, BarChart3, Settings, ChevronRight,
  Search, Sparkles, Send, Eye, RefreshCw, Download, UserPlus,
  Check, ArrowRight, Zap, Star, Phone, Globe, FileText, Filter,
  Clock, TrendingUp, Shield, BookOpen, PlayCircle, Lightbulb,
  Target, MessageCircle, AlertCircle, CheckCircle, Info
} from "lucide-react";

const SECTIONS = [
  { id: "overview",   label: "Overview",           icon: BookOpen },
  { id: "search",     label: "1. Search for Leads", icon: Map },
  { id: "leads",      label: "2. Manage Leads",    icon: Users },
  { id: "compose",    label: "3. Compose Campaigns", icon: Mail },
  { id: "pipeline",   label: "4. Pipeline CRM",    icon: Layers },
  { id: "analytics",  label: "5. Analytics",       icon: BarChart3 },
  { id: "settings",   label: "6. Settings & Account", icon: Settings },
  { id: "scenarios",  label: "Real-World Scenarios", icon: Lightbulb },
  { id: "tips",       label: "Pro Tips",            icon: Zap },
];

export default function GuidePage() {
  const [active, setActive] = useState("overview");

  function scrollTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar TOC */}
      <aside className="hidden lg:flex w-56 xl:w-64 shrink-0 flex-col h-full border-r border-border bg-white overflow-y-auto">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--color-primary)" }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-text">User Guide</p>
              <p className="text-[10px] text-muted">LeadHunter v2.0</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors text-left w-full ${
                active === id ? "text-white" : "text-muted hover:bg-background hover:text-text"
              }`}
              style={active === id ? { backgroundColor: "var(--color-primary)" } : {}}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-border">
          <a
            href="/search"
            className="flex items-center gap-2 text-xs font-semibold text-white rounded-lg px-3 py-2.5 transition-colors"
            style={{ backgroundColor: "var(--color-cta)" }}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Start Finding Leads
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-16">

          {/* ── Overview ─────────────────────────────────────────── */}
          <Section id="overview">
            <div className="relative rounded-2xl overflow-hidden p-8 text-white mb-6" style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)" }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Welcome to LeadHunter</h1>
                    <p className="text-white/70 text-sm">Your AI-powered cold outreach engine</p>
                  </div>
                </div>
                <p className="text-white/80 text-sm leading-relaxed max-w-xl">
                  LeadHunter helps web designers, agencies, and freelancers find businesses that need a website, generate personalized AI cold emails, and send them directly from Gmail — all in one place.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {["Find Local Leads", "AI Cold Emails", "Gmail Integration", "CRM Pipeline", "Analytics"].map(tag => (
                    <span key={tag} className="text-xs bg-white/20 rounded-full px-3 py-1 font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-text mb-4">How it works in 5 steps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
              {[
                { num: "1", label: "Search", desc: "Find businesses on Google Maps", icon: Search, color: "#6366f1" },
                { num: "2", label: "Save", desc: "Store leads in your CRM", icon: Users, color: "#3b82f6" },
                { num: "3", label: "Compose", desc: "AI writes cold emails", icon: Sparkles, color: "#8b5cf6" },
                { num: "4", label: "Send", desc: "Send via your Gmail", icon: Send, color: "#10b981" },
                { num: "5", label: "Track", desc: "Monitor opens & replies", icon: BarChart3, color: "#f59e0b" },
              ].map(({ num, label, desc, icon: Icon, color }) => (
                <div key={num} className="relative bg-white rounded-xl border border-border p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
                    {num}
                  </div>
                  <Icon className="w-4 h-4 text-muted" />
                  <p className="text-xs font-bold text-text">{label}</p>
                  <p className="text-[10px] text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <CalloutBox type="info" title="Who is this for?">
              LeadHunter is built for <strong>web designers, freelancers, and agencies</strong> who want to acquire more local business clients. It's ideal for anyone offering web design, SEO, or digital marketing services.
            </CalloutBox>
          </Section>

          {/* ── Search ───────────────────────────────────────────── */}
          <Section id="search">
            <SectionHeader icon={Map} color="#6366f1" title="Search for Leads" badge="Step 1" />
            <p className="text-sm text-muted leading-relaxed mb-5">
              The Search page is your lead discovery engine. Type any business type and city to find businesses on Google Maps — then filter for the most valuable prospects.
            </p>

            <h3 className="text-sm font-bold text-text mb-3">How to run your first search</h3>
            <StepList steps={[
              { label: "Enter a Business Type", detail: 'Type what kind of businesses you\'re targeting, e.g. "dentist", "restaurant", "plumber", "gym".' },
              { label: "Set Location", detail: 'Type a city or neighbourhood in the location field, e.g. "Austin, TX" or "downtown Chicago".' },
              { label: "Choose Search Mode", detail: "Use Radius mode to draw a circle around a point, or Polygon mode to hand-draw your service area directly on the map." },
              { label: "Click Search", detail: "LeadHunter will query Google Places and pull back businesses within your area. Results are scored 0–100 automatically." },
              { label: "View Results", detail: "You'll be redirected to your Leads page showing all discovered businesses with scores, contact info, and website status." },
            ]} />

            <div className="mt-5 bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-background">
                <p className="text-xs font-bold text-text">📍 Example Search</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <ExampleField label="Business Type" value='"dentist"' />
                <ExampleField label="Location" value='"Austin, TX"' />
                <ExampleField label="Search Mode" value="Radius — 5 km" />
                <ExampleField label="Expected result" value="~40–80 dental clinics" />
              </div>
              <div className="px-4 pb-4">
                <p className="text-xs text-muted">LeadHunter will score each clinic and flag those with no website or a broken one — these are your <span className="text-amber-600 font-semibold">hottest prospects</span>.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FeatureCard icon={Star} title="Lead Score" desc="0–100 score based on missing website, low ratings, email availability, and more." />
              <FeatureCard icon={Globe} title="Website Status" desc="Automatically checks if each business has a live, broken, or missing website." />
              <FeatureCard icon={Filter} title="Save Presets" desc="Save your search settings to quickly re-run the same search later." />
            </div>

            <CalloutBox type="tip" title="Best Practice">
              Target businesses tagged as <strong>No Website</strong> first — they're the easiest to close since they have a clear, obvious problem you can solve immediately.
            </CalloutBox>
          </Section>

          {/* ── Leads ────────────────────────────────────────────── */}
          <Section id="leads">
            <SectionHeader icon={Users} color="#3b82f6" title="Manage Your Leads" badge="Step 2" />
            <p className="text-sm text-muted leading-relaxed mb-5">
              The Leads page is your CRM database. Every business discovered via search is stored here. You can filter, sort, export, and deep-dive into each lead's details.
            </p>

            <h3 className="text-sm font-bold text-text mb-3">Leads table columns explained</h3>
            <div className="bg-white rounded-xl border border-border overflow-hidden mb-5">
              {[
                { col: "Score", desc: "AI-calculated priority score (0–100). Higher = better prospect." },
                { col: "Business", desc: "Business name, category, and address." },
                { col: "Website", desc: "Live (green), Broken (amber), or No Website (red badge)." },
                { col: "Contact", desc: "Email address and phone number with verification badges." },
                { col: "Rating", desc: "Google star rating and review count." },
                { col: "Links", desc: "Direct links to Google Maps and actions." },
              ].map(({ col, desc }, i) => (
                <div key={col} className={`flex items-start gap-3 px-4 py-3 ${i % 2 === 0 ? "bg-background/40" : "bg-white"}`}>
                  <span className="text-xs font-bold text-primary min-w-[80px]">{col}</span>
                  <span className="text-xs text-muted">{desc}</span>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-bold text-text mb-3">Click a lead row to open the Detail Drawer</h3>
            <p className="text-xs text-muted mb-3">The side drawer gives you complete info on any lead including:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {["Pipeline Stage", "Lead Notes", "Activity History", "Email Logs", "AI Reply Analysis", "WhatsApp Link"].map(item => (
                <div key={item} className="flex items-center gap-1.5 bg-white border border-border rounded-lg px-3 py-2">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-xs text-text">{item}</span>
                </div>
              ))}
            </div>

            <CalloutBox type="tip" title="Bulk Actions">
              Select multiple leads with checkboxes to <strong>bulk delete</strong> them, or use the <strong>Export</strong> dropdown to download as CSV, Excel, or push directly to Google Sheets.
            </CalloutBox>
          </Section>

          {/* ── Compose ──────────────────────────────────────────── */}
          <Section id="compose">
            <SectionHeader icon={Mail} color="#8b5cf6" title="Compose Email Campaigns" badge="Step 3" />
            <p className="text-sm text-muted leading-relaxed mb-5">
              The Compose page lets you create personalized AI-written email campaigns targeting multiple leads at once. Groq AI writes a unique email for each lead using their business name, category, and location.
            </p>

            <h3 className="text-sm font-bold text-text mb-3">Creating your first campaign</h3>
            <StepList steps={[
              { label: "Name your Campaign", detail: 'Give it a descriptive name, e.g. "Austin Dentists — July 2025".' },
              { label: "Select Email Account", detail: "Choose which connected Gmail account to send from." },
              { label: "Select Leads", detail: "Check the leads you want to target. Use \"All with email\" to auto-select every lead with an email address." },
              { label: "Click Create Campaign", detail: "LeadHunter creates a campaign record and generates draft slots for each selected lead." },
              { label: "Generate AI Drafts", detail: "Click \"Generate All with AI\" — Groq AI writes personalized emails for each lead simultaneously." },
              { label: "Review & Edit", detail: "Click any lead name on the left to open the draft editor. Read the email, make any edits." },
              { label: "Send All", detail: "When happy, click \"Send All\" to send emails from your connected Gmail with automatic rate limiting." },
            ]} />

            <div className="mt-5 bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-background">
                <p className="text-xs font-bold text-text">✉️ Dynamic Email Variables</p>
              </div>
              <p className="px-4 py-3 text-xs text-muted">These placeholders are automatically replaced per lead:</p>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                {[
                  { var: "{{name}}", desc: "Business name" },
                  { var: "{{city}}", desc: "City extracted from address" },
                  { var: "{{category}}", desc: "Business category / type" },
                  { var: "{{website}}", desc: "Their current website URL" },
                ].map(({ var: v, desc }) => (
                  <div key={v} className="flex items-center gap-2 bg-background rounded px-3 py-2">
                    <code className="text-primary text-xs font-bold">{v}</code>
                    <span className="text-xs text-muted">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-1">💡 A/B Testing Tip</p>
              <p className="text-xs text-amber-700/80">You can test two subject lines by separating them with <code className="bg-amber-100 px-1 rounded">|||</code>. Example: <code className="bg-amber-100 px-1 rounded">Quick Question ||| I noticed your business...</code> — LeadHunter alternates them across your leads automatically.</p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FeatureCard icon={RefreshCw} title="Regenerate" desc="Click Regenerate on any draft to get a fresh AI version if you don't like the first one." />
              <FeatureCard icon={Clock} title="Schedule Sends" desc="Set a future date/time for a campaign to be sent automatically via background jobs." />
            </div>
          </Section>

          {/* ── Pipeline ─────────────────────────────────────────── */}
          <Section id="pipeline">
            <SectionHeader icon={Layers} color="#f59e0b" title="Pipeline CRM" badge="Step 4" />
            <p className="text-sm text-muted leading-relaxed mb-5">
              The Pipeline page is a Kanban-style CRM board where you can visually track where each lead is in your sales process.
            </p>

            <h3 className="text-sm font-bold text-text mb-3">Pipeline stages</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {[
                { stage: "New", color: "#6366f1", desc: "Freshly discovered leads." },
                { stage: "Contacted", color: "#3b82f6", desc: "Email has been sent." },
                { stage: "Replied", color: "#f59e0b", desc: "Lead responded to your email." },
                { stage: "Negotiating", color: "#8b5cf6", desc: "In active conversation." },
                { stage: "Won", color: "#10b981", desc: "Deal closed! Client acquired." },
                { stage: "Lost", color: "#ef4444", desc: "Lead didn't convert." },
              ].map(({ stage, color, desc }) => (
                <div key={stage} className="bg-white border border-border rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs font-bold text-text">{stage}</span>
                  </div>
                  <p className="text-[10px] text-muted">{desc}</p>
                </div>
              ))}
            </div>

            <CalloutBox type="info" title="Drag & Drop">
              Drag any lead card from one column to another to instantly update its pipeline stage. The change is saved in real-time to your database — no save button needed.
            </CalloutBox>

            <div className="mt-4">
              <FeatureCard icon={Eye} title="Auto-stage Updates" desc="When a campaign email is sent, the lead moves to 'Contacted' automatically. When a reply is detected, it moves to 'Replied'." />
            </div>
          </Section>

          {/* ── Analytics ────────────────────────────────────────── */}
          <Section id="analytics">
            <SectionHeader icon={BarChart3} color="#10b981" title="Analytics & Reports" badge="Step 5" />
            <p className="text-sm text-muted leading-relaxed mb-5">
              The Analytics page shows you performance metrics across all your email campaigns — open rates, reply rates, and per-lead engagement history.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { metric: "Open Rate", desc: "% of emails opened by recipients", icon: Eye },
                { metric: "Reply Rate", desc: "% of leads who replied", icon: MessageCircle },
                { metric: "Sent Count", desc: "Total emails dispatched", icon: Send },
                { metric: "Conversion", desc: "Leads moved to Won stage", icon: TrendingUp },
              ].map(({ metric, desc, icon: Icon }) => (
                <div key={metric} className="bg-white border border-border rounded-xl p-3 text-center">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-2" />
                  <p className="text-xs font-bold text-text">{metric}</p>
                  <p className="text-[10px] text-muted mt-0.5">{desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-bold text-text mb-3">AI Reply Analyzer</h3>
            <p className="text-xs text-muted mb-3">When a lead replies to your email, LeadHunter's AI automatically reads the reply and classifies it:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {[
                { type: "Interested", color: "emerald", desc: "Lead wants to know more. AI suggests a follow-up pitch." },
                { type: "Not Interested", color: "red", desc: "Lead declined. Automatically moved to Lost." },
                { type: "Question", color: "amber", desc: "Lead has a query. AI suggests a helpful answer draft." },
              ].map(({ type, color, desc }) => (
                <div key={type} className={`rounded-lg border bg-${color}-50 border-${color}-200 px-3 py-2.5`}>
                  <p className={`text-xs font-bold text-${color}-700 mb-0.5`}>{type}</p>
                  <p className={`text-[10px] text-${color}-700/80`}>{desc}</p>
                </div>
              ))}
            </div>

            <FeatureCard icon={FileText} title="PDF Report Export" desc="Click 'PDF Report' on any campaign to generate a printable, professional performance report with funnel charts and email logs." />
          </Section>

          {/* ── Settings ─────────────────────────────────────────── */}
          <Section id="settings">
            <SectionHeader icon={Settings} color="#64748b" title="Settings & Account" badge="Step 6" />
            <p className="text-sm text-muted leading-relaxed mb-5">
              Settings is where you connect Gmail, manage your profile, upgrade your plan, and invite team members.
            </p>

            <div className="flex flex-col gap-4">
              {[
                {
                  title: "Connect Gmail",
                  icon: Mail,
                  color: "#ea4335",
                  steps: ["Click 'Connect Gmail Account'", "Sign in with your Google account", "Approve permissions — LeadHunter can now send emails as you", "Set it as your default sending account"],
                },
                {
                  title: "Gmail Warm-up Mode",
                  icon: TrendingUp,
                  color: "#f59e0b",
                  steps: ["Click 'Start Warm-up' next to any account", "Sending limits start at 5/day and increase each day to avoid spam flags", "After ~30 days you can send up to 100 emails/day safely", "Click 'Pause Warm-up' anytime to stop"],
                },
                {
                  title: "Profile Management",
                  icon: Shield,
                  color: "#6366f1",
                  steps: ["Update your email address in the Profile Settings form", "Change your password by entering your current one first", "Switch plans (Free / Starter / Pro / Agency) directly from settings"],
                },
                {
                  title: "Team Collaboration (Agency plan)",
                  icon: UserPlus,
                  color: "#10b981",
                  steps: ["Enter a team member's email and password under Team Collaboration", "They get their own login and instantly share your leads, campaigns, and email accounts", "Remove a member anytime with the Remove button", "Supports up to 5 team seats on Agency plan"],
                },
              ].map(({ title, icon: Icon, color, steps }) => (
                <div key={title} className="bg-white border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <p className="text-sm font-bold text-text">{title}</p>
                  </div>
                  <ul className="px-4 py-3 flex flex-col gap-1.5">
                    {steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 text-white" style={{ backgroundColor: color }}>{i + 1}</span>
                        <span className="text-xs text-muted">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Scenarios ────────────────────────────────────────── */}
          <Section id="scenarios">
            <SectionHeader icon={Lightbulb} color="#f59e0b" title="Real-World Scenarios" />
            <p className="text-sm text-muted leading-relaxed mb-6">
              Here's how actual users are using LeadHunter to grow their web design businesses.
            </p>

            <div className="flex flex-col gap-5">
              <ScenarioCard
                num="A"
                color="#6366f1"
                title="Freelancer targeting local restaurants"
                situation="Sarah is a freelance web designer in Chicago. She wants to find restaurants without websites and pitch her services."
                steps={[
                  "Search: Business Type = 'restaurant', Location = 'Chicago downtown'",
                  "Filter leads by 'No Website' status",
                  "Create a campaign named 'Chicago Restaurants — Summer 2025'",
                  "Generate AI emails referencing their restaurant name and neighbourhood",
                  "Send to 40 leads → gets 8 replies → 2 new clients",
                ]}
                outcome="2 new clients at $1,500 each = $3,000 from one afternoon of work"
              />

              <ScenarioCard
                num="B"
                color="#10b981"
                title="Agency running multi-city campaigns"
                situation="PixelCraft Agency in London wants to run simultaneous campaigns across 5 UK cities for dental clinics."
                steps={[
                  "Create 5 saved presets — one per city",
                  "Run each search, results auto-saved to leads CRM",
                  "Connect 3 Gmail accounts for higher daily volume",
                  "Invite 2 team members to review and edit drafts",
                  "Run campaigns in parallel — 200 emails per day",
                  "Track replies in Analytics, AI auto-classifies intent",
                ]}
                outcome="50+ qualified replies per week with team handling follow-ups together"
              />

              <ScenarioCard
                num="C"
                color="#8b5cf6"
                title="Following up with interested leads"
                situation="Mark sent 60 emails, 12 replied with interest. He wants to follow up with personalised messages within 3 days."
                steps={[
                  "Filter Leads by Pipeline Stage = 'Replied'",
                  "Open each lead's Detail Drawer to read the AI Reply Analysis",
                  "AI has already drafted a follow-up response for each reply",
                  "Edit and personalise the suggested follow-up",
                  "Send follow-up emails from the Compose page",
                  "Move prospects to 'Negotiating' stage in Pipeline",
                ]}
                outcome="12 interested leads → 5 discovery calls → 3 paying clients"
              />
            </div>
          </Section>

          {/* ── Tips ─────────────────────────────────────────────── */}
          <Section id="tips">
            <SectionHeader icon={Zap} color="#f59e0b" title="Pro Tips" />
            <p className="text-sm text-muted leading-relaxed mb-5">
              Strategies that experienced LeadHunter users use to get better results.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Target,
                  title: "Be hyper-specific",
                  tip: "Narrow searches work better than broad ones. 'Dentist in Austin TX 78701' beats 'dentist USA'.",
                  color: "#6366f1",
                },
                {
                  icon: Phone,
                  title: "Phone + Email = better close rate",
                  tip: "Filter for leads that have both phone and email. Multi-channel outreach gets 3× higher response rates.",
                  color: "#3b82f6",
                },
                {
                  icon: Star,
                  title: "Target low-rated businesses",
                  tip: "Businesses with 2–3 star ratings often blame their poor online presence. A new website could change their business.",
                  color: "#f59e0b",
                },
                {
                  icon: Clock,
                  title: "Schedule sends on weekday mornings",
                  tip: "Emails sent Tuesday–Thursday between 8–10 AM get significantly higher open rates than those sent on weekends.",
                  color: "#10b981",
                },
                {
                  icon: RefreshCw,
                  title: "Re-run searches monthly",
                  tip: "Use saved presets to re-run searches each month. New businesses open constantly — fresh leads appear every 30 days.",
                  color: "#8b5cf6",
                },
                {
                  icon: Shield,
                  title: "Warm up before blasting",
                  tip: "Enable Gmail Warm-up for 14+ days before sending large campaigns. This prevents spam filters and protects your sender reputation.",
                  color: "#ef4444",
                },
                {
                  icon: FileText,
                  title: "Review AI drafts before sending",
                  tip: "Always read at least a sample of AI drafts. Edit subject lines and opening lines to sound more personal and human.",
                  color: "#64748b",
                },
                {
                  icon: Download,
                  title: "Export before big decisions",
                  tip: "Export to Google Sheets for client reporting or to share lead lists with your team outside the app.",
                  color: "#0ea5e9",
                },
              ].map(({ icon: Icon, title, tip, color }) => (
                <div key={title} className="bg-white border border-border rounded-xl p-4 flex gap-3">
                  <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text mb-1">{title}</p>
                    <p className="text-xs text-muted leading-relaxed">{tip}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 rounded-2xl overflow-hidden text-white p-8 text-center" style={{ background: "linear-gradient(135deg, var(--color-cta) 0%, #7c3aed 100%)" }}>
              <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <h2 className="text-xl font-bold mb-2">Ready to find your next client?</h2>
              <p className="text-white/70 text-sm mb-5">Your first search takes less than 60 seconds.</p>
              <a
                href="/search"
                className="inline-flex items-center gap-2 bg-white font-bold rounded-lg px-6 py-2.5 text-sm transition-opacity hover:opacity-90"
                style={{ color: "var(--color-cta)" }}
              >
                <ArrowRight className="w-4 h-4" /> Start Finding Leads
              </a>
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      {children}
    </section>
  );
}

function SectionHeader({ icon: Icon, color, title, badge }: { icon: React.ElementType; color: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: color }}>
            {badge}
          </span>
        )}
        <h2 className="text-lg font-bold text-text">{title}</h2>
      </div>
    </div>
  );
}

function StepList({ steps }: { steps: { label: string; detail: string }[] }) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      {steps.map(({ label, detail }, i) => (
        <div key={i} className="flex gap-3 bg-white border border-border rounded-xl p-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: "var(--color-primary)" }}>
            {i + 1}
          </div>
          <div>
            <p className="text-xs font-bold text-text mb-0.5">{label}</p>
            <p className="text-xs text-muted">{detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-primary)", opacity: 0.85 }}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <div>
        <p className="text-xs font-bold text-text mb-0.5">{title}</p>
        <p className="text-xs text-muted leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ExampleField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-lg px-3 py-2">
      <p className="text-[10px] text-muted mb-0.5">{label}</p>
      <p className="text-xs font-bold text-primary">{value}</p>
    </div>
  );
}

function CalloutBox({ type, title, children }: { type: "info" | "tip" | "warning"; title: string; children: React.ReactNode }) {
  const styles = {
    info:    { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   icon: Info },
    tip:     { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: CheckCircle },
    warning: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  icon: AlertCircle },
  };
  const { bg, border, text, icon: Icon } = styles[type];
  return (
    <div className={`${bg} ${border} border rounded-xl px-4 py-3 flex gap-3 mt-4`}>
      <Icon className={`w-4 h-4 ${text} shrink-0 mt-0.5`} />
      <div>
        <p className={`text-xs font-bold ${text} mb-0.5`}>{title}</p>
        <p className={`text-xs ${text} opacity-80 leading-relaxed`}>{children}</p>
      </div>
    </div>
  );
}

function ScenarioCard({ num, color, title, situation, steps, outcome }: {
  num: string; color: string; title: string; situation: string; steps: string[]; outcome: string;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border" style={{ backgroundColor: `${color}08` }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: color }}>
          {num}
        </div>
        <h3 className="text-sm font-bold text-text">{title}</h3>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase text-muted tracking-wider mb-1.5">Situation</p>
          <p className="text-xs text-muted leading-relaxed">{situation}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-muted tracking-wider mb-2">Workflow</p>
          <div className="flex flex-col gap-1.5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" style={{ color }} />
                <span className="text-xs text-muted">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ backgroundColor: `${color}12` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color }}>Outcome</p>
          <p className="text-xs font-semibold" style={{ color }}>{outcome}</p>
        </div>
      </div>
    </div>
  );
}

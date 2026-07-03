"use client";

import {
  BookOpen, Search, Mail, Phone, DollarSign, BarChart2, MessageSquare, Zap,
  ChevronDown, CheckCircle2, Sparkles, Target, Rocket, ArrowRight, Play, X, Info, Shield
} from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

// ─── Data ──────────────────────────────────────────────────────────────────────

const STEPS = [
  { step: 1, title: "Connect your Gmail", description: "Link your Gmail in Settings so LeadHunter can send emails on your behalf.", href: "/settings", cta: "Open Settings" },
  { step: 2, title: "Find leads", description: "Search businesses by category and location. Filter by broken or missing websites.", href: "/search", cta: "Go to Search" },
  { step: 3, title: "Enrich contacts", description: "Select leads and click Find Emails to auto-discover verified contact info via Apollo.", href: "/leads", cta: "Manage Leads" },
  { step: 4, title: "Launch a campaign", description: "Create an email sequence with AI-generated drafts and let LeadHunter drip them automatically.", href: "/compose", cta: "Open Compose" },
  { step: 5, title: "Close deals", description: "Track replies in the Pipeline, assign deal values, and watch your revenue grow.", href: "/pipeline", cta: "View Pipeline" },
];

const FAQS = [
  { question: "How do I find emails for my leads?", answer: "Go to the Leads page, select leads using checkboxes, then click Find Emails. LeadHunter uses Apollo to discover verified email addresses automatically." },
  { question: "Can I send emails to multiple leads at once?", answer: "Yes! On the Compose page create an email sequence and select which leads to target. The campaign will drip emails over your configured schedule." },
  { question: "What does the lead score mean?", answer: "The lead score (0-100) is calculated from several factors: missing/broken website, number of reviews, star rating, phone/email presence, and website quality. Higher scores = better prospects." },
  { question: "How do I move leads through the pipeline?", answer: "On the Pipeline page, drag and drop Kanban cards between columns. You can also use the arrow buttons on each card. Changes are saved locally via IndexedDB and synced to the server automatically." },
  { question: "What is polygon draw mode in Search?", answer: "Polygon draw mode lets you click on the map to define a custom irregular area. After placing 3 or more points, the polygon is shown. You can then drag individual vertices to reshape it precisely." },
  { question: "How does offline sync work?", answer: "LeadHunter stores all changes (edits, stage moves, deletes) in your browser IndexedDB first. A debounced 5-second timer flushes the queue to the server. Actions are never lost even when offline." },
];

const TIPS = [
  { title: "Focus on no-website leads", tip: "Businesses with no website are the easiest sell. Filter by website status = none in your lead search." },
  { title: "Warm up before bulk sending", tip: "Start with 10-20 emails per day and increase gradually to avoid spam filters.", href: "/guide/deliverability" },
  { title: "Personalize with lead data", tip: "Use placeholders like business_name, category, and city in your email templates. LeadHunter injects real data per lead." },
  { title: "Follow up 5+ times", tip: "Most replies come after the 3rd or 4th email. Set up a 5-step sequence so you never forget to follow up." },
];

const FEATURES = [
  { emoji: "🔍", title: "Lead Discovery", description: "Find local businesses that need websites using Google Maps data", items: ["Search by type and location (radius, polygon, or city)", "Filter by website status: none, broken, or live", "Auto-score leads on 10+ quality factors"], href: "/search", bg: "bg-violet-50 border-violet-200", ico: "bg-violet-100 text-violet-700", txt: "text-violet-700" },
  { emoji: "📧", title: "Email Outreach", description: "Automated, personalized campaigns with AI assistance", items: ["Multi-step drip sequences", "AI-generated personalized email drafts", "Track opens and replies automatically"], href: "/compose", bg: "bg-blue-50 border-blue-200", ico: "bg-blue-100 text-blue-700", txt: "text-blue-700" },
  { emoji: "📱", title: "SMS Outreach", description: "Send automated SMS follow-ups via Twilio", items: ["Personalized SMS templates per lead", "Full SMS history per contact", "Combine with email for multi-channel outreach"], href: "/leads", bg: "bg-emerald-50 border-emerald-200", ico: "bg-emerald-100 text-emerald-700", txt: "text-emerald-700" },
  { emoji: "📞", title: "Call Scripts", description: "AI-generated phone scripts for each lead", items: ["Personalized pitch and objection handling", "Context-aware from lead data", "One-click printable scripts"], href: "/leads", bg: "bg-amber-50 border-amber-200", ico: "bg-amber-100 text-amber-700", txt: "text-amber-700" },
  { emoji: "💰", title: "Deal Tracking", description: "Track revenue potential across your pipeline", items: ["Assign deal values to leads", "Revenue dashboard by pipeline stage", "Projected MRR calculations"], href: "/analytics/revenue", bg: "bg-rose-50 border-rose-200", ico: "bg-rose-100 text-rose-700", txt: "text-rose-700" },
  { emoji: "📊", title: "Analytics", description: "Visualize lead generation and outreach performance", items: ["Search heatmap for lead density", "Weekly email summary reports", "Campaign performance metrics"], href: "/analytics", bg: "bg-indigo-50 border-indigo-200", ico: "bg-indigo-100 text-indigo-700", txt: "text-indigo-700" },
  { emoji: "🔗", title: "Integrations", description: "Connect LeadHunter with your existing tools", items: ["Slack notifications for replies", "Calendly booking link injection", "Zapier and webhook support"], href: "/settings", bg: "bg-cyan-50 border-cyan-200", ico: "bg-cyan-100 text-cyan-700", txt: "text-cyan-700" },
  { emoji: "✨", title: "AI Features", description: "Smarter outreach powered by AI", items: ["AI sales proposals PDF export", "Subject line optimizer", "Spam score checker"], href: "/leads", bg: "bg-purple-50 border-purple-200", ico: "bg-purple-100 text-purple-700", txt: "text-purple-700" },
];

// ─── Components ────────────────────────────────────────────────────────────────

function ProgressChecklist() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const toggle = (s: number) => setChecked((p) => ({ ...p, [s]: !p[s] }));
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-violet-50 border border-primary/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          Getting Started Checklist
        </h2>
        <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
          {done}/{STEPS.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white rounded-full border border-border mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500 rounded-full"
          style={{ width: `${(done / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {STEPS.map((s) => (
          <div
            key={s.step}
            onClick={() => toggle(s.step)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200",
              checked[s.step] ? "bg-emerald-50 border-emerald-200" : "bg-white border-border hover:border-primary/40 hover:shadow-sm"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
              checked[s.step] ? "bg-emerald-500 text-white" : "bg-background text-muted border border-border"
            )}>
              {checked[s.step] ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{s.step}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-semibold text-sm", checked[s.step] ? "line-through text-muted" : "text-text")}>{s.title}</p>
              <p className="text-xs text-muted mt-0.5">{s.description}</p>
            </div>
            <Link
              href={s.href}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors shrink-0",
                checked[s.step] ? "text-emerald-700 bg-emerald-100 hover:bg-emerald-200" : "text-primary bg-primary/10 hover:bg-primary/20"
              )}
            >
              {s.cta}
            </Link>
          </div>
        ))}
      </div>

      {done === STEPS.length && (
        <div className="mt-4 p-4 bg-emerald-500 text-white rounded-xl text-center font-bold animate-bounce">
          🎉 You are all set! Time to close some deals.
        </div>
      )}
    </div>
  );
}

function FeatureCard({ feature }: { feature: typeof FEATURES[0] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn(
      "border rounded-2xl overflow-hidden transition-all duration-300 bg-white",
      expanded ? "shadow-lg border-primary/30" : "border-border hover:shadow-md hover:border-primary/20"
    )}>
      <div className="flex items-center gap-3 p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0", feature.ico)}>
          {feature.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text leading-tight">{feature.title}</h3>
          <p className="text-xs text-muted mt-0.5 leading-snug">{feature.description}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted shrink-0 transition-transform duration-200", expanded && "rotate-180")} />
      </div>
      {expanded && (
        <div className={cn("border-t px-5 pb-5 pt-4", feature.bg)}>
          <ul className="space-y-2 mb-4">
            {feature.items.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className={cn("w-4 h-4 mt-0.5 shrink-0", feature.txt)} />
                <span className="text-sm text-text">{item}</span>
              </li>
            ))}
          </ul>
          <Link href={feature.href} className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", feature.txt)}>
            Explore {feature.title} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function FaqItem({ faq, isOpen, onToggle }: { faq: typeof FAQS[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-background transition-colors">
        <span className="font-semibold text-text text-sm pr-4">{faq.question}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border bg-background">
          <p className="text-sm text-muted leading-relaxed pt-3">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const featuresRef = useRef<HTMLDivElement>(null);

  const filteredFeatures = FEATURES.filter(
    (f) => !query || f.title.toLowerCase().includes(query.toLowerCase()) || f.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-violet-600 to-indigo-700 p-8 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Interactive User Guide
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Welcome to LeadHunter 🎯</h1>
          <p className="text-white/80 max-w-xl text-sm leading-relaxed mb-6">
            Your all-in-one lead generation platform. Find businesses, automate outreach, and close more deals — faster than ever.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/search" className="inline-flex items-center gap-2 bg-white text-primary font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors shadow-lg">
              <Play className="w-4 h-4" /> Start Finding Leads
            </Link>
            <button
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/30 transition-colors"
            >
              Explore Features →
            </button>
          </div>
        </div>
      </div>

      {/* ── Checklist ── */}
      <ProgressChecklist />

      {/* ── Features ── */}
      <div ref={featuresRef}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-text">Platform Features</h2>
            <p className="text-sm text-muted mt-0.5">Click any card to expand details</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search features…"
              className="h-9 pl-9 pr-8 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 w-52"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted" />
              </button>
            )}
          </div>
        </div>
        {filteredFeatures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFeatures.map((f) => <FeatureCard key={f.title} feature={f} />)}
          </div>
        ) : (
          <div className="text-center py-12 text-muted">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No features match that search</p>
          </div>
        )}
      </div>

      {/* ── Pro Tips ── */}
      <div>
        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Pro Tips
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIPS.map((tip, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all">
              <h3 className="font-semibold text-text text-sm mb-1">{tip.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{tip.tip}</p>
              {tip.href && (
                <Link href={tip.href} className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-2 hover:underline">
                  Learn more <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div>
        <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} faq={faq} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-1">
          <h3 className="font-bold text-text text-lg">Ready to find your first lead?</h3>
          <p className="text-sm text-muted mt-1">Head to the Search page, pick a business type and area, and start generating leads in seconds.</p>
        </div>
        <Link href="/search" className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shrink-0">
          Start Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

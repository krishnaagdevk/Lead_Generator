import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";
import Link from "next/link";
import { MapPin, Mail, Sparkles, BarChart3, ArrowRight, Check } from "lucide-react";

const FEATURES = [
  { icon: MapPin, title: "Find Local Leads", desc: "Search any business type in any area. Filter by businesses with no website or broken ones — the hottest prospects." },
  { icon: Sparkles, title: "AI Cold Emails", desc: "Groq AI writes personalized emails for each lead. Review, edit, and send — or bulk-send to hundreds at once." },
  { icon: Mail, title: "Send via Your Gmail", desc: "Connect your own Gmail account. High deliverability, real sender identity, built-in rate limiting." },
  { icon: BarChart3, title: "Track Everything", desc: "See who opened your emails, who replied. Leads auto-move through your CRM pipeline." },
];

const PLANS = [
  { name: "Free", price: "$0", features: ["50 leads/month", "1 Gmail account", "CSV export", "No AI drafts"] },
  { name: "Starter", price: "$29/mo", features: ["1,000 leads/month", "AI email drafts", "2 Gmail accounts", "CSV + Excel export"], highlight: true },
  { name: "Pro", price: "$99/mo", features: ["10,000 leads/month", "Unlimited AI drafts", "5 Gmail accounts", "Follow-up sequences", "Google Sheets export"] },
  { name: "Agency", price: "$299/mo", features: ["Unlimited leads", "Team seats", "White-label export", "Priority support", "PDF reports"] },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/search");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-primary)" }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span className="font-bold text-text">LeadHunter</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted hover:text-text transition-colors">Sign in</Link>
          <Link href="/signup" className="text-sm font-medium text-white px-3 py-1.5 md:px-4 md:py-2 rounded-md transition-colors" style={{ backgroundColor: "var(--color-primary)" }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-16 md:py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-3.5 h-3.5" /> AI-powered cold outreach for web designers
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-text leading-tight mb-5">
          Find businesses that<br />need a website.<br /><span style={{ color: "var(--color-primary)" }}>Email them in one click.</span>
        </h1>
        <p className="text-base md:text-xl text-muted mb-8 max-w-2xl mx-auto">
          Type a business type and area → get a filtered list of local businesses without websites → Groq AI writes personalized cold emails → send from your own Gmail.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/signup" className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3.5 rounded-lg text-base transition-colors" style={{ backgroundColor: "var(--color-cta)" }}>
            Start free — no credit card <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-text text-center mb-10">Everything you need to land web design clients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl border border-border p-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: "var(--color-primary)", opacity: 0.9 }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-text mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-text text-center mb-2">Simple, honest pricing</h2>
        <p className="text-muted text-center mb-10">Start free. Upgrade when you need more leads.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col ${plan.highlight ? "border-primary shadow-lg" : "border-border bg-white"}`}
              style={plan.highlight ? { borderColor: "var(--color-primary)", backgroundColor: "white" } : {}}
            >
              {plan.highlight && <span className="text-xs text-white font-medium rounded-full px-2 py-0.5 mb-3 self-start" style={{ backgroundColor: "var(--color-primary)" }}>Most popular</span>}
              <h3 className="font-bold text-text text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1 mb-4" style={{ color: "var(--color-primary)" }}>{plan.price}</p>
              <ul className="flex flex-col gap-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <Check className="w-4 h-4 text-cta shrink-0 mt-0.5" style={{ color: "var(--color-cta)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`mt-6 text-center text-sm font-medium py-2.5 rounded-lg transition-colors ${plan.highlight ? "text-white" : "border border-border text-text hover:bg-background"}`}
                style={plan.highlight ? { backgroundColor: "var(--color-primary)" } : {}}>
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border text-center py-8 text-sm text-muted">
        <p>LeadHunter — Built for freelance web designers.</p>
      </footer>
    </div>
  );
}

import { Check, X } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    desc: "Try the basics",
    leads: 50,
    ai: "—",
    features: [
      { label: "Lead discovery (Google Maps)", inc: true },
      { label: "AI draft generation", inc: false },
      { label: "Email campaigns & tracking", inc: true },
      { label: "SMS outreach", inc: false },
      { label: "CRM pipeline", inc: true },
      { label: "Email sequences", inc: false },
      { label: "Team seats", inc: false },
      { label: "Integrations", inc: false },
      { label: "White-label branding", inc: false },
    ],
    cta: "Get Started",
    href: "/signup",
    featured: false,
  },
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    desc: "For solo freelancers",
    leads: 1000,
    ai: 500,
    features: [
      { label: "Lead discovery (Google Maps)", inc: true },
      { label: "AI draft generation", inc: true },
      { label: "Email campaigns & tracking", inc: true },
      { label: "SMS outreach", inc: true },
      { label: "CRM pipeline", inc: true },
      { label: "Email sequences", inc: true },
      { label: "Team seats", inc: false },
      { label: "Integrations", inc: true },
      { label: "White-label branding", inc: false },
    ],
    cta: "Start Free Trial",
    href: "/signup",
    featured: true,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    desc: "For growing agencies",
    leads: 10000,
    ai: 5000,
    features: [
      { label: "Lead discovery (Google Maps)", inc: true },
      { label: "AI draft generation", inc: true },
      { label: "Email campaigns & tracking", inc: true },
      { label: "SMS outreach", inc: true },
      { label: "CRM pipeline", inc: true },
      { label: "Email sequences", inc: true },
      { label: "Team seats", inc: false },
      { label: "Integrations", inc: true },
      { label: "White-label branding", inc: true },
    ],
    cta: "Start Free Trial",
    href: "/signup",
    featured: false,
  },
  {
    name: "Agency",
    price: "$199",
    period: "/mo",
    desc: "For teams & white-label",
    leads: "Unlimited",
    ai: "Unlimited",
    features: [
      { label: "Lead discovery (Google Maps)", inc: true },
      { label: "AI draft generation", inc: true },
      { label: "Email campaigns & tracking", inc: true },
      { label: "SMS outreach", inc: true },
      { label: "CRM pipeline", inc: true },
      { label: "Email sequences", inc: true },
      { label: "Team seats (up to 5)", inc: true },
      { label: "Integrations", inc: true },
      { label: "White-label branding", inc: true },
    ],
    cta: "Contact Sales",
    href: "/signup",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-white">
      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center bg-primary">
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span className="text-text font-bold text-lg">LeadHunter</span>
        </Link>
        <Link href="/login" className="text-sm text-muted hover:text-text font-medium">Sign In</Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-text mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Start for free, upgrade when you need more leads and AI generation power.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border-2 p-6 flex flex-col transition-shadow duration-200 hover:shadow-lg ${
                plan.featured ? "border-primary shadow-md" : "border-border"
              }`}
            >
              {plan.featured && (
                <span className="text-[10px] font-bold uppercase text-primary bg-primary/5 px-2 py-0.5 rounded-full self-start mb-3">
                  Most Popular
                </span>
              )}
              <h2 className="text-lg font-bold text-text">{plan.name}</h2>
              <p className="text-sm text-muted mt-1 mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-text">{plan.price}</span>
                <span className="text-sm text-muted">{plan.period}</span>
              </div>

              <div className="flex flex-col gap-2 text-sm mb-6">
                <div className="flex justify-between border-b border-border pb-1.5">
                  <span className="text-muted">Leads / mo</span>
                  <span className="font-semibold text-text">{plan.leads}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-1.5">
                  <span className="text-muted">AI drafts / mo</span>
                  <span className="font-semibold text-text">{plan.ai}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map(f => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    {f.inc ? (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <span className={`text-sm ${f.inc ? "text-text" : "text-muted"}`}>{f.label}</span>
                  </div>
                ))}
              </div>

              <Link
                href={plan.href}
                className={`w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                  plan.featured
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-background text-text border border-border hover:bg-background/80"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center border-t border-border pt-12">
          <h2 className="text-xl font-bold text-text mb-4">Need a custom plan?</h2>
          <p className="text-sm text-muted mb-6 max-w-lg mx-auto">
            Running a large agency or need enterprise features? We offer custom pricing with dedicated support, onboarding, and SLA.
          </p>
          <Link href="/signup" className="text-sm font-semibold text-primary hover:underline">Contact us →</Link>
        </div>
      </div>
    </div>
  );
}
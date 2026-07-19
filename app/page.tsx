import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/auth";
import Link from "next/link";
import { MapPin, Mail, Sparkles, BarChart3, ArrowRight } from "lucide-react";
import { LandingPricing } from "@/components/landing/LandingPricing";

const FEATURES = [
  { icon: MapPin, title: "Find Local Leads", desc: "Search any business type in any area. Filter by businesses with no website or broken ones — the hottest prospects." },
  { icon: Sparkles, title: "AI Cold Emails", desc: "Groq AI writes personalized emails for each lead. Review, edit, and send — or bulk-send to hundreds at once." },
  { icon: Mail, title: "Send via Your Gmail", desc: "Connect your own Gmail account. High deliverability, real sender identity, built-in rate limiting." },
  { icon: BarChart3, title: "Track Everything", desc: "See who opened your emails, who replied. Leads auto-move through your CRM pipeline." },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/search");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-600 shadow-sm shadow-indigo-600/30">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 stroke-white fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">LeadHunter</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4.5 py-2 rounded-xl shadow shadow-indigo-600/10 transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pb-24">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-indigo-200/30 via-indigo-100/10 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full px-4.5 py-1.5 mb-8 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI-powered cold outreach for web designers
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.1] mb-6">
            Find local businesses that <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">need a new website.</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Search any business type and area to find hot design prospects. Let AI write highly-customized, high-converting cold emails and send them automatically from your Gmail.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 font-bold px-8 py-4 rounded-xl text-base shadow shadow-emerald-600/10 transition-all hover:-translate-y-0.5">
              Start Sourcing Free <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">No credit card required</span>
          </div>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-950 sm:text-4xl tracking-tight">
              Everything you need to land web design clients
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Ditch the generic outreach. Sells services to businesses that actually have broken websites or no website at all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 shrink-0">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-950 text-base mb-1.5">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Interactive Client Component) */}
      <LandingPricing />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-indigo-600">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-white fill-none" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span className="font-extrabold text-slate-950 tracking-tight text-sm">LeadHunter</span>
          </div>
          <p className="text-xs text-slate-500 md:order-last">
            &copy; {new Date().getFullYear()} LeadHunter. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs font-semibold text-slate-500">
            <Link href="/privacy" className="hover:text-slate-950 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-950 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

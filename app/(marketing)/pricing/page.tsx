import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-white">
      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center bg-indigo-600">
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span className="text-slate-900 font-bold text-lg">LeadHunter</span>
        </Link>
        <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 font-medium">Sign In</Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-950 mb-4 tracking-tight">100% Free, Unlimited outreach</h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Find unlimited business leads, generate high-converting AI cold emails, and launch automated campaigns. No hidden fees or paid tiers.
          </p>
        </div>

        <div className="bg-white rounded-3xl border-2 border-indigo-600/20 p-8 sm:p-12 shadow-lg flex flex-col md:flex-row gap-8 items-stretch relative overflow-hidden">
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-100/80 px-3 py-1 rounded-full">
              Full Suite Included
            </span>
            <h2 className="text-2xl font-bold text-slate-950 mt-4">Free Unlimited Plan</h2>
            <p className="text-slate-500 text-sm mt-2">Every feature is fully unlocked. Scaled for freelancers and agencies.</p>
            
            <div className="mt-6 border-t border-b border-slate-100 py-6 my-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Leads Limit</p>
                <p className="text-xl font-extrabold text-slate-950 mt-1">Unlimited</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">AI Email Drafts</p>
                <p className="text-xl font-extrabold text-slate-950 mt-1">Unlimited</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                "Google Maps lead discovery with polygon & radius search",
                "Automated email verification & deliverability checks",
                "Personalized email drafting powered by advanced LLMs",
                "Unlimited connected Gmail accounts and daily sending limits",
                "CRM pipeline integration with deals tracker",
                "Pixel tracking for email opens and reply logs",
                "Auto reply detection with AI sentiment classification",
                "White-labeled branding and color schemes for exports",
              ].map(f => (
                <div key={f} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full md:w-80 bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-col justify-between items-center text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pricing Model</p>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold text-slate-950">Rs 0</span>
                <span className="text-slate-500 text-sm font-medium">/ forever</span>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Supported entirely by non-intrusive display ads. No credit card required.
              </p>
            </div>

            <div className="w-full mt-8 md:mt-0 flex flex-col gap-3">
              <Link
                href="/signup"
                className="w-full text-center py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all"
              >
                Get Started Instantly
              </Link>
              <span className="text-[10px] text-slate-400 font-medium">Create your account in 30 seconds</span>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center border-t border-slate-200/60 pt-12">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Want to support the project?</h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            We keep this tool free by running clean, non-tracking ads. If you love using it, please share it with other web designers and agencies!
          </p>
        </div>
      </div>
    </div>
  );
}
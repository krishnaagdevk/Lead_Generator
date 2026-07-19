"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export function LandingPricing() {
  return (
    <section className="px-6 py-20 max-w-4xl mx-auto flex flex-col items-center">
      <div className="text-center max-w-3xl mb-12">
        <h2 className="text-3xl font-extrabold text-slate-950 sm:text-4xl tracking-tight">
          100% Free, Unlimited outreach
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Find leads, generate personalized AI drafts, and manage email campaigns with no paid tiers or monthly limits.
        </p>
      </div>

      {/* Single premium pricing card */}
      <div className="bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/30 rounded-3xl border-2 border-indigo-600/30 p-8 sm:p-10 w-full shadow-lg flex flex-col sm:flex-row gap-8 items-center justify-between relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold tracking-wider text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full uppercase">
              Full Suite Free Access
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-950 mt-4">Unlimited Plan</h3>
          <p className="mt-2 text-sm text-slate-500">Every single premium feature is unlocked for everyone.</p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-slate-950">Rs 0</span>
            <span className="text-slate-500 text-sm font-medium">/ forever</span>
          </div>

          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
            {[
              "Unlimited lead search & discovery",
              "Unlimited AI email drafts",
              "All geographic search modes",
              "Automated email verification",
              "Unlimited connected Gmail accounts",
              "CRM pipeline & open tracking",
              "Auto-reply & AI sentiment handler",
              "Priority sending & queue options",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-4 shrink-0 w-full sm:w-64 border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-6 sm:pt-0 sm:pl-8">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monetization</p>
            <p className="text-sm font-bold text-slate-700 mt-1">Supported by unobtrusive ads</p>
          </div>
          <Link 
            href="/signup" 
            className="w-full text-center text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-3.5 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            Create Your Free Account
          </Link>
          <p className="text-[10px] text-slate-400 text-center font-medium">No credit card required. Instant access.</p>
        </div>
      </div>
    </section>
  );
}

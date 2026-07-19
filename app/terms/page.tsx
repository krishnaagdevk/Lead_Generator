import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-2">Terms of Service</h1>
        <p className="text-xs text-muted-foreground mb-8">Last Updated: July 6, 2026</p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-950 mb-2">1. Terms</h2>
            <p>By accessing LeadHunter, you agree to comply with these terms, all applicable laws and regulations, and agree that you are responsible for compliance with any local laws.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 mb-2">2. Usage License</h2>
            <p>LeadHunter grant you a license to use our platform to source leads for business-to-business (B2B) outreach. You agree not to abuse the system limits or use it for spamming purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 mb-2">3. Subscription & Billing</h2>
            <p>Billing is managed via Razorpay. All fees are charged recurringly based on your selected monthly or annual subscription tier. Subscriptions can be cancelled at any time through your dashboard.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 mb-2">4. Disclaimers</h2>
            <p>The materials on LeadHunter are provided on an 'as is' basis. LeadHunter makes no warranties, expressed or implied, and hereby disclaims all other warranties.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

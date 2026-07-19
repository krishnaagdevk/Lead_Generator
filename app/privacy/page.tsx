import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-2">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mb-8">Last Updated: July 6, 2026</p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-950 mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when creating an account, such as your email address and credentials. We also store search configurations and leads collected programmatically on your behalf.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 mb-2">2. How We Use Information</h2>
            <p>We use the collected information to operate and maintain LeadHunter features (including lead searching, AI email generation, and email verification), process payments via Razorpay, and notify you about system alerts.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 mb-2">3. Google APIs Usage</h2>
            <p>LeadHunter's integration with Google OAuth and Gmail APIs is strictly used to send outbound campaign drafts and check for replies under your explicit direction. We do not sell or share Google user data.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-950 mb-2">4. Security</h2>
            <p>We implement industry-standard database encryption and rate limits to secure your account and data. However, no security measure is 100% impenetrable.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

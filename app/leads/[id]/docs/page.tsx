"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Printer, FileText, CheckCircle2, ShieldCheck, DollarSign, ListTodo, Edit3, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Milestone {
  name: string;
  percent: number;
  amount: number;
}

interface Lead {
  id: number;
  name: string;
  category?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  contractPrice?: number | null;
  contractType?: string | null;
  contractSignedAt?: string | null;
  contractMilestones?: Milestone[] | null;
}

export default function DocsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"edit" | "contract" | "invoice">("edit");
  const [contractPrice, setContractPrice] = useState<number>(500);
  const [contractType, setContractType] = useState<string>("website");
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: "Milestone 1: Project Setup, Wireframes & Mockups Approval", percent: 30, amount: 150 },
    { name: "Milestone 2: Design Prototype, Layout Complete & Interactive Demo", percent: 40, amount: 200 },
    { name: "Milestone 3: Final Launch, SEO Setup, Code Handover & Production Go-Live", percent: 30, amount: 150 },
  ]);

  const [signing, setSigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch lead data
  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["lead-docs", id],
    queryFn: () => fetch(`/api/leads/${id}`).then((r) => r.json()),
  });

  // Load from lead when fetched
  useEffect(() => {
    if (lead) {
      if (lead.contractPrice) {
        setContractPrice(lead.contractPrice);
      }
      if (lead.contractType) {
        setContractType(lead.contractType);
      }
      if (lead.contractMilestones && Array.isArray(lead.contractMilestones)) {
        setMilestones(lead.contractMilestones as Milestone[]);
      } else if (lead.contractPrice) {
        // Compute default amounts based on saved price
        const price = lead.contractPrice;
        setMilestones([
          { name: "Milestone 1: Project Setup, Wireframes & Mockups Approval", percent: 30, amount: Math.round(price * 0.3) },
          { name: "Milestone 2: Design Prototype, Layout Complete & Interactive Demo", percent: 40, amount: Math.round(price * 0.4) },
          { name: "Milestone 3: Final Launch, SEO Setup, Code Handover & Production Go-Live", percent: 30, amount: Math.round(price * 0.3) },
        ]);
      }
    }
  }, [lead]);

  // Sync milestone amounts when contract price changes
  const handlePriceChange = (val: number) => {
    setContractPrice(val);
    setMilestones((prev) =>
      prev.map((m) => ({
        ...m,
        amount: Math.round(val * (m.percent / 100)),
      }))
    );
  };

  const handleMilestonePercentChange = (index: number, percent: number) => {
    setMilestones((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        percent,
        amount: Math.round(contractPrice * (percent / 100)),
      };
      return copy;
    });
  };

  const handleMilestoneNameChange = (index: number, name: string) => {
    setMilestones((prev) => {
      const copy = [...prev];
      copy[index].name = name;
      return copy;
    });
  };

  const handleSave = async (signAgreement = false) => {
    if (signAgreement) setSigning(true);
    else setSaving(true);

    try {
      const res = await fetch(`/api/leads/${id}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractPrice,
          contractType,
          contractMilestones: milestones,
          signAgreement,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setToast(data.message);
        qc.invalidateQueries({ queryKey: ["lead-docs", id] });
        qc.invalidateQueries({ queryKey: ["leads"] });
        if (signAgreement) {
          setActiveTab("contract");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
      setSaving(false);
    }
  };

  // Toast clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-slate-500">Drafting documentation legalities...</span>
      </div>
    );
  }

  if (!lead || (lead as any).error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-border p-6 rounded-2xl max-w-sm text-center shadow-xl">
          <p className="text-red-500 font-bold">Failed to load lead details.</p>
          <Link href="/" className="text-xs text-primary hover:underline font-bold mt-4 block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isSigned = !!lead.contractSignedAt;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-12">
      {/* Top Controls Header (Hidden on Print) */}
      <header className="bg-white border-b border-border py-4 px-6 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-primary" /> Client Docs Studio
              </h1>
              <p className="text-[10px] text-muted font-medium">1-Click Agreements & Letterhead Invoices for {lead.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border">
            {(
              [
                { id: "edit", icon: Edit3, label: "Settings Form" },
                { id: "contract", icon: ShieldCheck, label: "Milestones Contract" },
                { id: "invoice", icon: DollarSign, label: "A4 Invoice" },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === t.id ? "bg-white text-primary shadow-xs" : "text-muted hover:text-text"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab !== "edit" && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          )}
        </div>
      </header>

      {/* Main Working Layout */}
      <main className="max-w-4xl mx-auto w-full px-4 pt-6 flex-1 flex flex-col">
        {/* Toast */}
        {toast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 px-4 shadow-xl fixed bottom-6 right-6 z-50 flex items-center gap-2 font-semibold text-xs animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {toast}
          </div>
        )}

        {activeTab === "edit" && (
          /* Form Editor (Hidden on Print) */
          <div className="bg-white border border-border rounded-3xl p-6 shadow-xl flex flex-col gap-6 max-w-2xl mx-auto w-full print:hidden">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Document Configuration Form
              </h2>
              <p className="text-xs text-muted mt-0.5">Define your deliverables, package price, and milestone schedules below.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Deliverable Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Service Focus</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="h-10 rounded-lg border border-border bg-slate-50/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="website">Custom Website Design & Setup</option>
                  <option value="app">Mobile Application Development</option>
                  <option value="both">Both Website & Mobile App Package</option>
                </select>
              </div>

              {/* Package Total Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Contract Price ($)</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={contractPrice}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="h-10 rounded-lg border border-border bg-slate-50/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                />
              </div>
            </div>

            {/* Milestones Splitter */}
            <div className="flex flex-col gap-4 border-t pt-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <ListTodo className="w-4 h-4 text-primary" /> Milestone Breakdown Schedule
              </h3>
              <div className="flex flex-col gap-3">
                {milestones.map((m, i) => (
                  <div key={i} className="p-4 bg-slate-50 border rounded-2xl flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex-1 w-full flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400">Milestone {i + 1} Name / Scope</span>
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => handleMilestoneNameChange(i, e.target.value)}
                        className="h-9 px-3 text-xs bg-white rounded-lg border border-border w-full font-medium"
                      />
                    </div>
                    <div className="w-full sm:w-20 shrink-0 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400">Split (%)</span>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={m.percent}
                        onChange={(e) => handleMilestonePercentChange(i, Number(e.target.value))}
                        className="h-9 px-3 text-xs bg-white rounded-lg border border-border w-full text-center font-bold"
                      />
                    </div>
                    <div className="w-full sm:w-28 shrink-0 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400">Due Amount</span>
                      <span className="h-9 flex items-center justify-center text-xs font-extrabold bg-slate-200 text-slate-700 rounded-lg">
                        ${m.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                loading={saving}
                onClick={() => handleSave(false)}
                className="font-bold text-xs h-10 px-5 cursor-pointer"
              >
                Save Form
              </Button>
              <Button
                loading={signing}
                onClick={() => handleSave(true)}
                disabled={isSigned}
                className="font-bold text-xs h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer flex items-center gap-1"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSigned ? "Contract Locked & Signed" : "Sign & Lock Agreement (+100 XP)"}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "contract" && (
          /* A4 Milestone Contract Page (Fully optimized for Print and Screen) */
          <div className="bg-white border border-border rounded-3xl p-8 sm:p-12 shadow-xl mx-auto w-full max-w-3xl text-slate-950 font-serif leading-relaxed relative print:border-0 print:shadow-none print:p-0 my-4 print:my-0">
            {/* Signed Stamp Overlay */}
            {isSigned && (
              <div className="absolute top-12 right-12 border-4 border-emerald-600 rounded-xl px-4 py-1.5 uppercase font-bold text-emerald-600 tracking-wider text-xs rotate-12 bg-white/95 backdrop-blur-md select-none pointer-events-none shadow-md border-double flex flex-col items-center">
                <span className="text-[10px] font-bold">DIGITALLY SIGNED</span>
                <span>LOCKED & SECURED</span>
                <span className="text-[8px] mt-0.5">{new Date(lead.contractSignedAt!).toLocaleDateString()}</span>
              </div>
            )}

            {/* Document Letterhead */}
            <div className="text-center border-b pb-6 mb-8 flex flex-col gap-2">
              <p className="font-sans font-black tracking-widest text-[10px] text-slate-500 uppercase">Milestone Client Design Agreement</p>
              <h2 className="text-2xl font-extrabold tracking-tight font-sans text-slate-900">STUDEV AGREEMENT FOR SERVICES</h2>
              <p className="text-xs font-sans text-slate-400">Created and generated securely via PocketGig Client Studio</p>
            </div>

            {/* Contract Body */}
            <div className="flex flex-col gap-6 text-sm">
              <p>
                This professional design and development agreement (the <strong>"Agreement"</strong>) is entered into effective as of{" "}
                <strong>{isSigned ? new Date(lead.contractSignedAt!).toLocaleDateString() : new Date().toLocaleDateString()}</strong> (the{" "}
                <strong>"Effective Date"</strong>), by and between:
              </p>

              <div className="grid grid-cols-2 gap-6 pl-4 border-l-2 my-2 py-1 font-sans text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wide">Developer</p>
                  <p className="font-extrabold text-slate-800 mt-1">Student Dev Contractor</p>
                  <p className="text-slate-500">Junior Full-Stack Web Engineer</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wide">Client Business</p>
                  <p className="font-extrabold text-slate-800 mt-1">{lead.name}</p>
                  <p className="text-slate-500">{lead.address || "Local physical merchant location"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-sans font-bold text-slate-900 border-b pb-1 mb-2 uppercase tracking-wide text-xs">1. Scope of Work & Services</h3>
                <p>
                  The Developer agrees to design, construct, test, and deploy a custom{" "}
                  <strong>{contractType === "website" ? "Website" : contractType === "app" ? "Mobile Application" : "Website & Mobile App Package"}</strong> for
                  the Client, optimized specifically for modern desktop/mobile web browsers, loading performance, local SEO rankings, and localized community trust.
                </p>
              </div>

              <div>
                <h3 className="font-sans font-bold text-slate-900 border-b pb-1 mb-2 uppercase tracking-wide text-xs">2. Milestone Payment Schedule</h3>
                <p className="mb-3">
                  In full consideration for the services performed, the Client agrees to pay the Developer a total fee of{" "}
                  <strong>${contractPrice} USD</strong> split strictly into the following milestone-based stages. Payments are due immediately upon milestone sign-off:
                </p>
                <div className="flex flex-col gap-2.5 font-sans">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex justify-between items-start bg-slate-50 border p-3 rounded-xl text-xs gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">Milestone {i + 1} ({m.percent}%)</p>
                        <p className="text-slate-500 mt-0.5 leading-snug">{m.name}</p>
                      </div>
                      <span className="font-black text-slate-800 bg-white border px-3 py-1 rounded-lg">
                        ${m.amount} USD
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-sans font-bold text-slate-900 border-b pb-1 mb-2 uppercase tracking-wide text-xs">3. Terms & Final Handoff</h3>
                <p>
                  Upon final milestone payment, ownership of all digital assets, hosting credentials, domain configurations, and code files will be transferred
                  permanently and directly to the Client. The Developer agrees to provide 30 days of complimentary bug support to ensure operations run smoothly.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t font-sans">
                <div className="flex flex-col gap-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Developer Signature</p>
                  {isSigned ? (
                    <p className="font-serif italic text-indigo-700 text-lg border-b border-dashed pb-2">Student Dev Contractor</p>
                  ) : (
                    <div className="h-8 border-b border-dashed" />
                  )}
                  <p className="text-xs font-semibold text-slate-500">Student Developer</p>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client Authorized Signature</p>
                  {isSigned ? (
                    <p className="font-serif italic text-emerald-700 text-lg border-b border-dashed pb-2">{lead.name} Representative</p>
                  ) : (
                    <div className="h-8 border-b border-dashed" />
                  )}
                  <p className="text-xs font-semibold text-slate-500">{lead.name}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "invoice" && (
          /* A4 Invoice Letterhead (Fully optimized for Print and Screen) */
          <div className="bg-white border border-border rounded-3xl p-8 sm:p-12 shadow-xl mx-auto w-full max-w-3xl text-slate-950 font-sans leading-relaxed relative print:border-0 print:shadow-none print:p-0 my-4 print:my-0">
            {/* Invoice Top Layout */}
            <div className="flex justify-between items-start border-b pb-8 mb-8 gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">INVOICE</h2>
                <p className="text-xs text-slate-400 mt-1">PocketGig Student Dev Contractor</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-extrabold text-slate-800">Invoice #: SG-INV-{lead.id}</p>
                <p className="text-slate-500 mt-0.5">Date: {new Date().toLocaleDateString()}</p>
                <p className="text-slate-500 mt-0.5">Due Date: Upon Completion</p>
              </div>
            </div>

            {/* Addresses split */}
            <div className="grid grid-cols-2 gap-6 text-xs mb-8">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wide">Billed By</p>
                <p className="font-extrabold text-slate-800 mt-1">Student Developer Contractor</p>
                <p className="text-slate-500 mt-0.5">Junior Developer & Local Site Consultant</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wide">Billed To</p>
                <p className="font-extrabold text-slate-800 mt-1">{lead.name}</p>
                <p className="text-slate-500 mt-0.5">{lead.address || "Local storefront"}</p>
              </div>
            </div>

            {/* Line items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-3 pl-4">Description</th>
                    <th className="p-3 text-center w-20">Qty</th>
                    <th className="p-3 text-right w-28 pr-4">Total Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700 font-medium">
                  {milestones.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 pl-4">
                        <p className="font-bold text-slate-800">Project Milestone Payment - Phase {i + 1}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{m.name}</p>
                      </td>
                      <td className="p-3 text-center">1</td>
                      <td className="p-3 text-right pr-4 font-bold text-slate-800">${m.amount}.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total summary */}
            <div className="flex justify-end text-xs mb-10">
              <div className="w-56 flex flex-col gap-2.5">
                <div className="flex justify-between items-center border-b pb-1.5 text-slate-500">
                  <span>Subtotal:</span>
                  <span>${contractPrice}.00</span>
                </div>
                <div className="flex justify-between items-center border-b pb-1.5 text-slate-500">
                  <span>Sales Tax (0%):</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold text-slate-950">
                  <span>Total Amount Due:</span>
                  <span>${contractPrice}.00 USD</span>
                </div>
              </div>
            </div>

            {/* Payment Details footer */}
            <div className="border-t pt-6 text-[11px] text-slate-400">
              <p className="font-bold text-slate-500 mb-1">How To Make Payment</p>
              <p>Please pay junior contractor directly via Bank Transfer or Venmo/CashApp on milestone completion.</p>
              <p className="mt-1">Bank: Pocket Student Fund • Routing: XXXX • Acc: XXX-XXXX-XXX</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

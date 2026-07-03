"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";

export default function LeadPitchPage() {
  const params = useParams();
  const leadId = Number(params.id);

  const { data: lead } = useQuery({
    queryKey: ["lead-details", leadId],
    queryFn: () => fetch(`/api/leads/${leadId}`).then(r => r.json()),
  });

  const { data: pitch } = useQuery({
    queryKey: ["lead-pitch", leadId],
    queryFn: () => fetch(`/api/leads/${leadId}/pitch`, { method: "POST" }).then(r => r.json()),
    enabled: !!lead,
  });

  if (!lead || !pitch) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Print button */}
      <button
        onClick={() => window.print()}
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <Printer className="w-5 h-5" />
      </button>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #pitch-proposal, #pitch-proposal * {
            visibility: visible;
          }
          #pitch-proposal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>

      <div id="pitch-proposal" className="bg-white">
        {/* Header */}
        <div className="border-b border-border pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary">LeadHunter Proposal</h1>
              <p className="text-sm text-muted mt-1">Generated {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-text">{lead.name}</h2>
              {lead.category && <p className="text-sm text-muted">{lead.category}</p>}
              {lead.address && <p className="text-sm text-muted">{lead.address}</p>}
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-text mb-4">{pitch.headline}</h2>
        </div>

        {/* Problem Section */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-text mb-3">The Challenge</h3>
          <p className="text-text leading-relaxed">{pitch.problem}</p>
        </section>

        {/* Solution Section */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-text mb-3">Our Solution</h3>
          <p className="text-text leading-relaxed">{pitch.solution}</p>
        </section>

        {/* Proof Section */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-text mb-3">Why Choose Us</h3>
          <p className="text-text leading-relaxed">{pitch.proof}</p>
        </section>

        {/* Pricing Section */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-text mb-3">Investment</h3>
          <p className="text-text leading-relaxed">{pitch.pricing}</p>
        </section>

        {/* CTA Section */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-text mb-3">Next Steps</h3>
          <p className="text-text leading-relaxed">{pitch.cta}</p>
        </section>

        {/* Footer */}
        <div className="border-t border-border pt-6 mt-8 text-center text-sm text-muted">
          <p>LeadHunter | Professional Web Design Services</p>
        </div>
      </div>
    </div>
  );
}
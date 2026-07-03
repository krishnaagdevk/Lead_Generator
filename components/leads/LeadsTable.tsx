"use client";

import { StatusBadge } from "./StatusBadge";
import { ContactBadge } from "./ContactBadge";
import { Star, ExternalLink, Loader2, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Lead {
  id: number;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  emailVerifiedStatus: string;
  leadScore: number;
  websiteUrl: string | null;
  websiteStatus: string;
  socialLinks: Record<string, string> | null;
  bestContact: string | null;
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string | null;
  pipelineStage: string;
}

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  selected: number[];
  onSelectChange: (ids: number[]) => void;
  onDeleteOne?: (id: number) => Promise<void>;
  onRowClick?: (id: number) => void;
}

function getScoreBadgeClass(score: number) {
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
  if (score >= 45) return "bg-amber-50 text-amber-700 border-amber-200/60";
  return "bg-slate-50 text-slate-600 border-slate-200/60";
}

export function LeadsTable({
  leads,
  loading,
  selected,
  onSelectChange,
  onDeleteOne,
  onRowClick,
}: LeadsTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const allSelected = leads.length > 0 && leads.every((l) => selected.includes(l.id));

  function toggleAll() {
    onSelectChange(allSelected ? [] : leads.map((l) => l.id));
  }

  function toggleOne(id: number) {
    onSelectChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted">
        <p className="font-medium">No leads yet</p>
        <p className="text-sm mt-1">Run a search to find businesses</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-white border-b border-border z-10">
          <tr>
            <th className="w-10 px-3 py-3">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-primary cursor-pointer" />
            </th>
            <th className="px-4 py-3 text-left font-semibold text-text w-16">Score</th>
            <th className="px-4 py-3 text-left font-semibold text-text">Business</th>
            <th className="px-4 py-3 text-left font-semibold text-text hidden sm:table-cell">Website</th>
            <th className="px-4 py-3 text-left font-semibold text-text">Contact</th>
            <th className="px-4 py-3 text-left font-semibold text-text hidden md:table-cell">Rating</th>
            <th className="px-4 py-3 text-left font-semibold text-text hidden lg:table-cell">Links</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onRowClick?.(lead.id)}
              className={cn(
                "border-b border-border hover:bg-background transition-colors duration-150 cursor-pointer",
                selected.includes(lead.id) && "bg-primary/5"
              )}
            >
              <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.includes(lead.id)}
                  onChange={() => toggleOne(lead.id)}
                  className="accent-primary cursor-pointer"
                />
              </td>
              <td className="px-4 py-3">
                <div className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold border text-xs", getScoreBadgeClass(lead.leadScore ?? 0))} title={`Lead Score: ${lead.leadScore ?? 0}/100`}>
                  {lead.leadScore ?? 0}
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-text">{lead.name}</p>
                {lead.category && <p className="text-xs text-muted mt-0.5">{lead.category}</p>}
                {lead.address && <p className="text-xs text-muted truncate max-w-[200px]">{lead.address}</p>}
                
                {/* Mobile-only Website Link / Badge */}
                <div className="sm:hidden mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={lead.websiteStatus} />
                  {lead.websiteUrl && (
                    <a 
                      href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-primary hover:underline truncate max-w-[120px] cursor-pointer"
                      title={lead.websiteUrl}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {lead.websiteUrl}
                    </a>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <StatusBadge status={lead.websiteStatus} />
                {lead.websiteUrl && (
                  <a 
                    href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block text-xs text-primary hover:underline mt-1 truncate max-w-[140px] cursor-pointer"
                    title={lead.websiteUrl}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {lead.websiteUrl}
                  </a>
                )}
              </td>
              <td className="px-4 py-3">
                <ContactBadge
                  email={lead.email}
                  phone={lead.phone}
                  socialLinks={lead.socialLinks}
                  bestContact={lead.bestContact}
                  emailVerifiedStatus={lead.emailVerifiedStatus}
                />
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                {lead.rating ? (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-text font-medium">{lead.rating}</span>
                    {lead.reviewCount && <span className="text-muted text-xs">({lead.reviewCount})</span>}
                  </div>
                ) : <span className="text-muted">—</span>}
              </td>
               <td className="px-4 py-3 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                 <div className="flex items-center gap-3">
                   {!lead.email && (
                     <button
                       onClick={async (e) => {
                         e.stopPropagation();
                         await fetch(`/api/leads/${lead.id}/enrich`, { method: "POST" });
                       }}
                       title="Find email via Hunter.io"
                       className="text-muted hover:text-primary transition-colors cursor-pointer"
                     >
                       <Search className="w-3.5 h-3.5" />
                     </button>
                   )}
                   {lead.mapsUrl && (
                     <a href={lead.mapsUrl} target="_blank" rel="noopener noreferrer" title="Open in Google Maps" className="text-muted hover:text-primary transition-colors cursor-pointer">
                       <ExternalLink className="w-3.5 h-3.5" />
                     </a>
                   )}
                   {onDeleteOne && (
                     <button
                       disabled={deletingId !== null}
                       onClick={async () => {
                         if (confirm(`Are you sure you want to delete "${lead.name}"?`)) {
                           setDeletingId(lead.id);
                           try {
                             await onDeleteOne(lead.id);
                           } catch (err) {
                             console.error(err);
                           } finally {
                             setDeletingId(null);
                           }
                         }
                       }}
                       className="text-muted hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                       title="Delete Lead"
                     >
                       {deletingId === lead.id ? (
                         <Loader2 className="w-3.5 h-3.5 animate-spin" />
                       ) : (
                         <Trash2 className="w-3.5 h-3.5" />
                       )}
                     </button>
                   )}
                 </div>
               </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

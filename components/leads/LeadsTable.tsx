"use client";

import { StatusBadge } from "./StatusBadge";
import { ContactBadge } from "./ContactBadge";
import { Star, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Lead {
  id: number;
  name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
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
}

export function LeadsTable({ leads, loading, selected, onSelectChange, onDeleteOne }: LeadsTableProps) {
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
            <th className="px-4 py-3 text-left font-semibold text-text">Business</th>
            <th className="px-4 py-3 text-left font-semibold text-text">Website</th>
            <th className="px-4 py-3 text-left font-semibold text-text">Contact</th>
            <th className="px-4 py-3 text-left font-semibold text-text">Rating</th>
            <th className="px-4 py-3 text-left font-semibold text-text">Links</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className={cn(
                "border-b border-border hover:bg-background transition-colors duration-150",
                selected.includes(lead.id) && "bg-primary/5"
              )}
            >
              <td className="px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={selected.includes(lead.id)}
                  onChange={() => toggleOne(lead.id)}
                  className="accent-primary cursor-pointer"
                />
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-text">{lead.name}</p>
                {lead.category && <p className="text-xs text-muted mt-0.5">{lead.category}</p>}
                {lead.address && <p className="text-xs text-muted truncate max-w-[200px]">{lead.address}</p>}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.websiteStatus} />
                {lead.websiteUrl && (
                  <p className="text-xs text-muted mt-1 truncate max-w-[140px]">{lead.websiteUrl}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <ContactBadge
                  email={lead.email}
                  phone={lead.phone}
                  socialLinks={lead.socialLinks}
                  bestContact={lead.bestContact}
                />
              </td>
              <td className="px-4 py-3">
                {lead.rating ? (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-text font-medium">{lead.rating}</span>
                    {lead.reviewCount && <span className="text-muted text-xs">({lead.reviewCount})</span>}
                  </div>
                ) : <span className="text-muted">—</span>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
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

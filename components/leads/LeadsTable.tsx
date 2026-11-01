"use client";

import { StatusBadge } from "./StatusBadge";
import { ContactBadge } from "./ContactBadge";
import { Star, ExternalLink, Loader2, Trash2, Search, Sparkles, MapPin, Users, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

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
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-500/10";
  if (score >= 45) return "bg-indigo-50 text-indigo-700 border-indigo-200/80 ring-1 ring-indigo-500/10";
  return "bg-slate-50 text-slate-600 border-slate-200/80";
}

const STAGE_CONFIG: Record<string, { label: string; badge: string }> = {
  new: { label: "New", badge: "bg-indigo-50 text-indigo-700 border-indigo-200/70" },
  contacted: { label: "Contacted", badge: "bg-blue-50 text-blue-700 border-blue-200/70" },
  replied: { label: "Replied", badge: "bg-amber-50 text-amber-700 border-amber-200/70" },
  negotiating: { label: "Negotiating", badge: "bg-purple-50 text-purple-700 border-purple-200/70" },
  won: { label: "Won", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/70" },
  lost: { label: "Lost", badge: "bg-slate-50 text-slate-500 border-slate-200/70" },
};

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
      <div className="bg-white rounded-2xl border border-border/80 shadow-xs p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading your leads...</p>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="bg-white rounded-2xl border border-border/80 shadow-xs p-16 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 text-indigo-600 shadow-xs">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No leads found</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
          No businesses match your active filter criteria. Try resetting filters or running a new search.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            Search New Leads
          </Link>
          <Link
            href="/startups"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Explore Tech Startups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="w-10 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all leads"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer w-4 h-4"
                />
              </th>
              <th className="px-3 py-3.5 text-left w-16">Score</th>
              <th className="px-4 py-3.5 text-left">Business Details</th>
              <th className="px-4 py-3.5 text-left hidden sm:table-cell">Website & Status</th>
              <th className="px-4 py-3.5 text-left">Contact Info</th>
              <th className="px-4 py-3.5 text-left hidden md:table-cell">Rating</th>
              <th className="px-4 py-3.5 text-left hidden lg:table-cell">Stage</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const isSelected = selected.includes(lead.id);
              const stageInfo = STAGE_CONFIG[lead.pipelineStage] ?? STAGE_CONFIG.new;

              return (
                <tr
                  key={lead.id}
                  onClick={() => onRowClick?.(lead.id)}
                  className={cn(
                    "group hover:bg-indigo-50/30 transition-colors duration-150 cursor-pointer",
                    isSelected && "bg-indigo-50/50"
                  )}
                >
                  {/* Select Checkbox */}
                  <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${lead.name}`}
                      checked={isSelected}
                      onChange={() => toggleOne(lead.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer w-4 h-4"
                    />
                  </td>

                  {/* Score */}
                  <td className="px-3 py-3.5">
                    <div
                      className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold border text-xs shadow-2xs",
                        getScoreBadgeClass(lead.leadScore ?? 0)
                      )}
                      title={`Lead Quality Score: ${lead.leadScore ?? 0}/100`}
                    >
                      {lead.leadScore ?? 0}
                    </div>
                  </td>

                  {/* Business Name & Address */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {lead.name}
                        </span>
                        {lead.category && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/60">
                            {lead.category}
                          </span>
                        )}
                      </div>
                      {lead.address && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-[240px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.address}</span>
                        </p>
                      )}

                      {/* Mobile-only website & stage */}
                      <div className="sm:hidden mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={lead.websiteStatus} />
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", stageInfo.badge)}>
                          {stageInfo.label}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Website & Status */}
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={lead.websiteStatus} />
                      {lead.websiteUrl ? (
                        <a
                          href={lead.websiteUrl.startsWith("http") ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium truncate max-w-[170px]"
                          title={lead.websiteUrl}
                        >
                          <span className="truncate">{lead.websiteUrl.replace(/^https?:\/\/(www\.)?/, "")}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </div>
                  </td>

                  {/* Contact Badge */}
                  <td className="px-4 py-3.5">
                    <ContactBadge
                      email={lead.email}
                      phone={lead.phone}
                      socialLinks={lead.socialLinks}
                      bestContact={lead.bestContact}
                      emailVerifiedStatus={lead.emailVerifiedStatus}
                    />
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    {lead.rating ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-slate-800">{lead.rating}</span>
                        </div>
                        {lead.reviewCount !== null && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            ({lead.reviewCount})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>

                  {/* Stage */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs", stageInfo.badge)}>
                      {stageInfo.label}
                    </span>
                  </td>

                  {/* Quick Actions */}
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* AI Pitch Page */}
                      <Link
                        href={`/leads/${lead.id}/pitch`}
                        title="Generate Custom AI Pitch"
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </Link>

                      {/* Hunter enrichment */}
                      {!lead.email && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await fetch(`/api/leads/${lead.id}/enrich`, { method: "POST" });
                          }}
                          title="Enrich Email via Hunter.io"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Google Maps link */}
                      {lead.mapsUrl && (
                        <a
                          href={lead.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Google Maps"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Delete */}
                      {onDeleteOne && (
                        <button
                          type="button"
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

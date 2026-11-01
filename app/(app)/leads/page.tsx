"use client";

import { LeadsTable } from "@/components/leads/LeadsTable";
import { FilterBar, Filters } from "@/components/leads/FilterBar";
import { ExportMenu } from "@/components/leads/ExportMenu";
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer";
import { useLeadsQuery, useOfflineDeleteLead, useOfflineBulkDeleteLeads } from "@/hooks/useLeads";
import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import { Users, Mail, Sparkles, AlertTriangle, Trash2, Globe, Layers, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LeadsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(50);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const params = new URLSearchParams();
  if (filters.websiteStatus) params.set("websiteStatus", filters.websiteStatus);
  if (filters.hasEmail !== undefined) params.set("hasEmail", String(filters.hasEmail));
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.minScore) params.set("minScore", String(filters.minScore));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.pipelineStage) params.set("pipelineStage", filters.pipelineStage);

  const { data, isLoading, isFetching } = useLeadsQuery(params.toString());

  const deleteOneMutation = useOfflineDeleteLead();
  const bulkDeleteMutation = useOfflineBulkDeleteLeads();
  const isBulkDeleting = bulkDeleteMutation.isPending;

  const handleDeleteOne = async (id: number) => {
    await deleteOneMutation.mutateAsync(id);
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (confirm(`Are you sure you want to delete the ${selected.length} selected lead(s)?`)) {
      try {
        await bulkDeleteMutation.mutateAsync(selected);
        setSelected([]);
        toast({ message: "Leads deleted successfully", type: "success" });
      } catch (err) {
        toast({ message: "Failed to delete leads: " + String(err), type: "error" });
      }
    }
  };

  const fetchedLeads = data?.items ?? [];
  const uniqueCategories = Array.from(
    new Set(fetchedLeads.map((l: any) => l.category).filter(Boolean))
  ).sort() as string[];

  // Quick overview stats
  const stats = useMemo(() => {
    let withEmail = 0;
    let highScore = 0;
    let needsWebsite = 0;
    for (const l of fetchedLeads) {
      if (l.email) withEmail++;
      if ((l.leadScore ?? 0) >= 70) highScore++;
      if (l.websiteStatus === "no_website" || l.websiteStatus === "broken") needsWebsite++;
    }
    return { total: fetchedLeads.length, withEmail, highScore, needsWebsite };
  }, [fetchedLeads]);

  // Instant, zero-latency in-memory filtering: never displays old/unfiltered leads while query syncs
  const allLeads = useMemo(() => {
    return fetchedLeads.filter((l: any) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchName = l.name?.toLowerCase().includes(q);
        const matchCategory = l.category?.toLowerCase().includes(q);
        const matchAddress = l.address?.toLowerCase().includes(q);
        const matchEmail = l.email?.toLowerCase().includes(q);
        if (!matchName && !matchCategory && !matchAddress && !matchEmail) return false;
      }
      if (filters.websiteStatus && l.websiteStatus !== filters.websiteStatus) return false;
      if (filters.hasEmail === true && !l.email) return false;
      if (filters.hasEmail === false && l.email) return false;
      if (filters.minRating && (l.rating ?? 0) < filters.minRating) return false;
      if (filters.minScore && (l.leadScore ?? 0) < filters.minScore) return false;
      if (filters.pipelineStage && l.pipelineStage !== filters.pipelineStage) return false;
      if (filters.category && l.category !== filters.category) return false;
      return true;
    });
  }, [fetchedLeads, filters]);

  const totalLeads = allLeads.length;
  const paginatedLeads = pageSize === "all" ? allLeads : allLeads.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = pageSize === "all" ? 1 : Math.ceil(totalLeads / (pageSize as number));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner (resembling Startups & Dashboard) */}
      <div className="bg-gradient-to-r from-indigo-950 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md shadow-xs">
                <Users className="w-6 h-6 text-indigo-300" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-200 bg-white/10 px-2.5 py-0.5 rounded-full">
                    Lead Management & Outreach
                  </span>
                  {isFetching && !isLoading && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" /> Syncing
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-white">
                  Verified Leads & Prospects
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
              >
                Find More Leads <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <p className="text-blue-100/80 text-sm max-w-3xl mb-5">
            View, filter, enrich, and convert high-intent businesses discovered across Google Maps and Startup radar. Generate instant AI pitches and launch multichannel campaigns.
          </p>

          {/* KPI Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" /> Total Leads
              </div>
              <div className="text-xl font-bold mt-1 text-white">{stats.total}</div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <Mail className="w-3.5 h-3.5" /> Email Ready
              </div>
              <div className="text-xl font-bold mt-1 text-emerald-400">{stats.withEmail}</div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-yellow-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> High Score (70+)
              </div>
              <div className="text-xl font-bold mt-1 text-yellow-300">{stats.highScore}</div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Needs Website
              </div>
              <div className="text-xl font-bold mt-1 text-rose-300">{stats.needsWebsite}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        filters={filters}
        categories={uniqueCategories}
        onChange={(f) => {
          setFilters(f);
          setPage(1);
        }}
      />

      {/* Action Toolbar & Bulk Operations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-border/80 shadow-xs px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">
            Showing {totalLeads} lead{totalLeads === 1 ? "" : "s"}
          </span>
          {selected.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {selected.length} selected
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selected.length > 0 && (
            <>
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/leads/enrich-bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids: selected }),
                  });
                  const resData = await res.json();
                  toast({
                    message: `Queued ${resData.queued} email enrichment jobs`,
                    type: "success",
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/70 transition-colors shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Find Emails ({selected.length})
              </button>

              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isBulkDeleting ? "Deleting..." : `Delete (${selected.length})`}
              </button>
            </>
          )}

          <ExportMenu selectedIds={selected} />

          <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === "all" ? "all" : Number(val));
                setPage(1);
              }}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
            >
              {[10, 20, 50, 100, 200].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Leads Table */}
      <LeadsTable
        leads={paginatedLeads}
        loading={isLoading}
        selected={selected}
        onSelectChange={setSelected}
        onDeleteOne={handleDeleteOne}
        onRowClick={(id) => setSelectedLeadId(id)}
      />

      {/* Pagination Footer */}
      {pageSize !== "all" && totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-border/80 shadow-xs px-5 py-3.5 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">
            Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({totalLeads} total leads)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}

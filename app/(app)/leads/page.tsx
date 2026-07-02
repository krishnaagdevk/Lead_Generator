"use client";

import { LeadsTable } from "@/components/leads/LeadsTable";
import { FilterBar } from "@/components/leads/FilterBar";
import { ExportMenu } from "@/components/leads/ExportMenu";
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Filters {
  websiteStatus?: string;
  hasEmail?: boolean;
  minRating?: number;
  minScore?: number;
  sortBy?: string;
  pipelineStage?: string;
  category?: string;
}

export default function LeadsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(50);
  const [selected, setSelected] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const params = new URLSearchParams();
  if (filters.websiteStatus) params.set("websiteStatus", filters.websiteStatus);
  if (filters.hasEmail !== undefined) params.set("hasEmail", String(filters.hasEmail));
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.minScore) params.set("minScore", String(filters.minScore));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.pipelineStage) params.set("pipelineStage", filters.pipelineStage);

  const { data, isLoading } = useQuery({
    queryKey: ["leads", params.toString()],
    queryFn: () => fetch(`/api/leads?${params}`).then((r) => r.json()),
  });

  const deleteOneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");
      return res.json();
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      setSelected((prev) => prev.filter((sId) => sId !== id));
    },
  });

  const handleDeleteOne = async (id: number) => {
    await deleteOneMutation.mutateAsync(id);
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (confirm(`Are you sure you want to delete the ${selected.length} selected lead(s)?`)) {
      setIsBulkDeleting(true);
      try {
        const res = await fetch("/api/leads", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selected }),
        });
        if (!res.ok) throw new Error("Bulk delete failed");
        qc.invalidateQueries({ queryKey: ["leads"] });
        setSelected([]);
      } catch (err) {
        alert("Failed to delete leads: " + String(err));
      } finally {
        setIsBulkDeleting(false);
      }
    }
  };

  const fetchedLeads = data?.items ?? [];
  const uniqueCategories = Array.from(new Set(fetchedLeads.map((l: any) => l.category).filter(Boolean))).sort() as string[];
  
  const allLeads = fetchedLeads.filter((l: any) => !filters.category || l.category === filters.category);
  const totalLeads = allLeads.length;
  const paginatedLeads = pageSize === "all" ? allLeads : allLeads.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-4 border-b border-border bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text">Leads</h1>
          <p className="text-sm text-muted mt-0.5">
            {totalLeads} total leads
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === "all" ? "all" : Number(val));
                setPage(1);
              }}
              className="h-8 px-2 rounded-md border border-border bg-white text-text font-medium text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              {[10, 20, 50, 100, 200].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
              <option value="all">Show All</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <button
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer transition-colors duration-150"
              >
                {isBulkDeleting ? "Deleting..." : `Delete Selected (${selected.length})`}
              </button>
            )}
            <ExportMenu selectedIds={selected} />
          </div>
        </div>
      </div>

      <FilterBar filters={filters} categories={uniqueCategories} onChange={(f) => { setFilters(f); setPage(1); }} />

      <div className="flex-1 overflow-auto">
        <LeadsTable
          leads={paginatedLeads}
          loading={isLoading}
          selected={selected}
          onSelectChange={setSelected}
          onDeleteOne={handleDeleteOne}
          onRowClick={(id) => setSelectedLeadId(id)}
        />
      </div>

      {data && pageSize !== "all" && totalLeads > pageSize && (
        <div className="border-t border-border bg-white px-6 py-3 flex items-center justify-between text-sm text-muted">
          <span>Page {page} of {Math.ceil(totalLeads / (pageSize as number))}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-border disabled:opacity-40 cursor-pointer hover:bg-background transition-colors">Prev</button>
            <button disabled={page >= Math.ceil(totalLeads / (pageSize as number))} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-border disabled:opacity-40 cursor-pointer hover:bg-background transition-colors">Next</button>
          </div>
        </div>
      )}

      <LeadDetailDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}

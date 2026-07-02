"use client";

import { cn } from "@/lib/utils";

interface Filters {
  websiteStatus?: string;
  hasEmail?: boolean;
  minRating?: number;
  minScore?: number;
  sortBy?: string;
  pipelineStage?: string;
  category?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "no_website", label: "No Website" },
  { value: "broken", label: "Broken" },
  { value: "live", label: "Has Website" },
];

const STAGE_OPTIONS = [
  { value: "", label: "Any Stage" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "negotiating", label: "Negotiating" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export function FilterBar({ filters, categories = [], onChange }: { filters: Filters; categories?: string[]; onChange: (f: Filters) => void }) {
  return (
    <div className="bg-white border-b border-border px-6 py-2 flex items-center gap-4 overflow-x-auto">
      {/* Website status pills */}
      <div className="flex items-center gap-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, websiteStatus: opt.value || undefined })}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap",
              (filters.websiteStatus ?? "") === opt.value
                ? "text-white"
                : "bg-background text-muted hover:bg-background/80"
            )}
            style={(filters.websiteStatus ?? "") === opt.value ? { backgroundColor: "var(--color-primary)" } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Has email toggle */}
      <button
        onClick={() => onChange({ ...filters, hasEmail: filters.hasEmail === true ? undefined : true })}
        className={cn(
          "px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors whitespace-nowrap",
          filters.hasEmail === true ? "text-white" : "bg-background text-muted"
        )}
        style={filters.hasEmail === true ? { backgroundColor: "var(--color-primary)" } : {}}
      >
        Has Email
      </button>

      <div className="h-4 w-px bg-border" />

      {/* Pipeline stage */}
      <select
        value={filters.pipelineStage ?? ""}
        onChange={(e) => onChange({ ...filters, pipelineStage: e.target.value || undefined })}
        className="text-xs border border-border rounded-md px-2 py-1 bg-white text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      >
        {STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Category filter */}
      {categories.length > 0 && (
        <select
          value={filters.category ?? ""}
          onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
          className="text-xs border border-border rounded-md px-2 py-1 bg-white text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer max-w-[150px]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {/* Rating filter */}
      <select
        value={filters.minRating ?? ""}
        onChange={(e) => onChange({ ...filters, minRating: e.target.value ? Number(e.target.value) : undefined })}
        className="text-xs border border-border rounded-md px-2 py-1 bg-white text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      >
        <option value="">Any Rating</option>
        <option value="4">4+ Stars</option>
        <option value="3">3+ Stars</option>
      </select>

      {/* Lead Score filter */}
      <select
        value={filters.minScore ?? ""}
        onChange={(e) => onChange({ ...filters, minScore: e.target.value ? Number(e.target.value) : undefined })}
        className="text-xs border border-border rounded-md px-2 py-1 bg-white text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      >
        <option value="">Any Score</option>
        <option value="80">High Score (80+)</option>
        <option value="50">Medium Score (50+)</option>
      </select>

      {/* Sort options */}
      <select
        value={filters.sortBy ?? ""}
        onChange={(e) => onChange({ ...filters, sortBy: e.target.value || undefined })}
        className="text-xs border border-border rounded-md px-2 py-1 bg-white text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
      >
        <option value="">Sort by Date</option>
        <option value="score">Sort by Score</option>
        <option value="rating">Sort by Rating</option>
      </select>

      {/* Clear filters */}
      {Object.values(filters).some(Boolean) && (
        <button onClick={() => onChange({})} className="text-xs text-red-500 hover:underline cursor-pointer whitespace-nowrap ml-auto">
          Clear filters
        </button>
      )}
    </div>
  );
}

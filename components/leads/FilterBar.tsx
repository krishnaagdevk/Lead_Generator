"use client";

import { cn } from "@/lib/utils";
import { Search, RotateCcw, Mail, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export interface Filters {
  searchQuery?: string;
  websiteStatus?: string;
  hasEmail?: boolean;
  minRating?: number;
  minScore?: number;
  sortBy?: string;
  pipelineStage?: string;
  category?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "live", label: "Has Website" },
  { value: "broken", label: "Broken Link" },
  { value: "no_website", label: "No Website" },
];

const STAGE_OPTIONS = [
  { value: "", label: "All Stages" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "negotiating", label: "Negotiating" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

interface FilterBarProps {
  filters: Filters;
  categories?: string[];
  onChange: (f: Filters) => void;
}

export function FilterBar({ filters, categories = [], onChange }: FilterBarProps) {
  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.websiteStatus ||
    filters.hasEmail ||
    filters.minRating ||
    filters.minScore ||
    filters.sortBy ||
    filters.pipelineStage ||
    filters.category
  );

  return (
    <div className="bg-white rounded-2xl border border-border/80 shadow-xs p-4 flex flex-col gap-3">
      {/* Top row: Search input + Status Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads by name, category, or address…"
            value={filters.searchQuery ?? ""}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value || undefined })}
            className="w-full h-9.5 pl-9 pr-3 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200/80 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all font-medium"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: undefined })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Website status pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {STATUS_OPTIONS.map((opt) => {
            const active = (filters.websiteStatus ?? "") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...filters, websiteStatus: opt.value || undefined })}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap",
                  active
                    ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                )}
              >
                {opt.label}
              </button>
            );
          })}

          {/* Has Email toggle pill */}
          <button
            type="button"
            onClick={() => onChange({ ...filters, hasEmail: filters.hasEmail === true ? undefined : true })}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap",
              filters.hasEmail === true
                ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            )}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Has Email</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Refined dropdown filters */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
          <SlidersHorizontal className="w-3 h-3" /> Filters
        </span>

        {/* Pipeline Stage */}
        <select
          value={filters.pipelineStage ?? ""}
          onChange={(e) => onChange({ ...filters, pipelineStage: e.target.value || undefined })}
          aria-label="Filter by Pipeline Stage"
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
        >
          {STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Categories */}
        {categories.length > 0 && (
          <select
            value={filters.category ?? ""}
            onChange={(e) => onChange({ ...filters, category: e.target.value || undefined })}
            aria-label="Filter by Category"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[170px] truncate shadow-2xs"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Rating */}
        <select
          value={filters.minRating ?? ""}
          onChange={(e) => onChange({ ...filters, minRating: e.target.value ? Number(e.target.value) : undefined })}
          aria-label="Filter by Minimum Rating"
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
        >
          <option value="">Any Rating</option>
          <option value="4.5">4.5+ ★ Stars</option>
          <option value="4">4.0+ ★ Stars</option>
          <option value="3">3.0+ ★ Stars</option>
        </select>

        {/* Lead Score */}
        <select
          value={filters.minScore ?? ""}
          onChange={(e) => onChange({ ...filters, minScore: e.target.value ? Number(e.target.value) : undefined })}
          aria-label="Filter by Minimum Score"
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
        >
          <option value="">Any Score</option>
          <option value="80">High Score (80+)</option>
          <option value="50">Medium Score (50+)</option>
        </select>

        {/* Sort by */}
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
          <select
            value={filters.sortBy ?? ""}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value || undefined })}
            aria-label="Sort Leads By"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
          >
            <option value="">Sort by Newest</option>
            <option value="score">Sort by Score</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

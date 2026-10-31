"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Rocket,
  Search,
  ExternalLink,
  Code2,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Flame,
  ArrowRight,
  RefreshCw,
  Loader2,
  Users,
  Briefcase,
  MapPin,
  Clock,
  Bookmark,
  Play,
  Pause,
  Trash2,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface DiscoveredStartup {
  id: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  source: "producthunt" | "hackernews" | "linkedin" | "unstop";
  sourceUrl?: string;
  authorOrMaker?: string;
  publishedAt: string;
  techStack: string[];
  isNoCode: boolean;
  hasMobileApp: boolean;
  techNeedScore: number;
  urgency: "Critical" | "High" | "Moderate" | "Low";
  signals: string[];
  pitchHook: string;
  suggestedServices: string[];
  hiringRole?: string;
  location?: string;
  experienceLevel?: string;
}

interface SavedSearchRecord {
  id: number;
  name: string;
  businessType: string;
  createdAt: string;
  geoQuery: {
    type: "startup";
    query?: string;
    role: string;
    location: string;
    source: "all" | "producthunt" | "hackernews" | "linkedin" | "unstop";
    intervalHours: number;
    lastRunAt?: string;
    nextRunAt?: string;
    autoImport: boolean;
    totalImported: number;
    status: "active" | "paused";
  };
}

const PRESET_ROLES = [
  "Full Stack Engineer",
  "React Developer",
  "Mobile Engineer",
  "AI Engineer",
  "Node.js Developer",
  "DevOps Engineer",
  "Python Developer",
];

export default function StartupsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("Full Stack Engineer");
  const [locationInput, setLocationInput] = useState("remote");
  const [sourceFilter, setSourceFilter] = useState<"all" | "linkedin" | "producthunt" | "hackernews" | "unstop">("all");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "critical" | "nocode">("all");
  const [importedMap, setImportedMap] = useState<Record<string, boolean>>({});

  // Saved Searches state
  const [showSavedSearches, setShowSavedSearches] = useState(true);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [saveIntervalHours, setSaveIntervalHours] = useState(2);
  const [saveAutoImport, setSaveAutoImport] = useState(true);

  // Query discovered startups & hiring companies
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<{ ok: boolean; count: number; startups: DiscoveredStartup[] }>({
    queryKey: ["discovered-startups", sourceFilter, selectedRole, locationInput],
    queryFn: async () => {
      const q = searchQuery || selectedRole;
      const res = await fetch(
        `/api/startups/discover?source=${sourceFilter}&query=${encodeURIComponent(q)}&role=${encodeURIComponent(
          selectedRole
        )}&location=${encodeURIComponent(locationInput)}&limit=30`
      );
      if (!res.ok) throw new Error("Failed to discover leads");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  // Query saved searches
  const {
    data: savedData,
    refetch: refetchSaved,
  } = useQuery<{ ok: boolean; searches: SavedSearchRecord[] }>({
    queryKey: ["startup-saved-searches"],
    queryFn: async () => {
      const res = await fetch("/api/startups/saved-searches");
      if (!res.ok) throw new Error("Failed to fetch saved searches");
      return res.json();
    },
  });

  const savedSearches = savedData?.searches || [];
  const startups = data?.startups || [];

  // Filtered
  const filtered = startups.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchDesc = s.tagline.toLowerCase().includes(q);
      const matchStack = s.techStack.some((tech) => tech.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchStack) return false;
    }
    if (urgencyFilter === "critical" && s.techNeedScore < 80) return false;
    if (urgencyFilter === "nocode" && !s.isNoCode) return false;
    return true;
  });

  const noCodeCount = startups.filter((s) => s.isNoCode).length;
  const hiringCount = startups.filter((s) => s.source === "linkedin" || s.source === "unstop").length;
  const criticalCount = startups.filter((s) => s.techNeedScore >= 75).length;

  // Single Lead Import
  const importMutation = useMutation({
    mutationFn: async (startup: DiscoveredStartup) => {
      const res = await fetch("/api/startups/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startup }),
      });
      if (!res.ok) throw new Error("Failed to import startup");
      return res.json();
    },
    onSuccess: (_, startup) => {
      setImportedMap((prev) => ({ ...prev, [startup.id]: true }));
      toast({
        message: `Imported "${startup.name}" into Leads CRM!`,
        type: "success",
      });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: any) => {
      toast({
        message: err?.message || "Failed to import lead",
        type: "error",
      });
    },
  });

  // Bulk Import
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const handleBulkImport = async () => {
    if (filtered.length === 0) return;
    setIsBulkImporting(true);
    try {
      const res = await fetch("/api/startups/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startups: filtered }),
      });
      if (!res.ok) throw new Error("Failed to bulk import");
      const result = await res.json();

      const updatedMap = { ...importedMap };
      filtered.forEach((s) => {
        updatedMap[s.id] = true;
      });
      setImportedMap(updatedMap);

      toast({
        message: `Imported ${result.importedCount || filtered.length} leads into CRM database!`,
        type: "success",
      });
      qc.invalidateQueries({ queryKey: ["leads"] });
    } catch (err: any) {
      toast({ message: err?.message || "Bulk import failed", type: "error" });
    } finally {
      setIsBulkImporting(false);
    }
  };

  // Create Saved Search Mutation
  const createSavedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/startups/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveSearchName || `${selectedRole} in ${locationInput || "remote"}`,
          role: selectedRole,
          query: searchQuery,
          location: locationInput,
          source: sourceFilter,
          intervalHours: saveIntervalHours,
          autoImport: saveAutoImport,
        }),
      });
      if (!res.ok) throw new Error("Failed to save search");
      return res.json();
    },
    onSuccess: (resData) => {
      setIsSaveModalOpen(false);
      refetchSaved();
      toast({
        message: `Saved search "${saveSearchName || selectedRole}" scheduled every ${saveIntervalHours} hours! Initial leads saved to database.`,
        type: "success",
      });
      qc.invalidateQueries({ queryKey: ["leads"] });
      refetch();
    },
    onError: (err: any) => {
      toast({ message: err?.message || "Failed to create saved search", type: "error" });
    },
  });

  // Run Saved Search Now Mutation
  const [runningSearchId, setRunningSearchId] = useState<number | null>(null);
  const runNowMutation = useMutation({
    mutationFn: async (id: number) => {
      setRunningSearchId(id);
      const res = await fetch(`/api/startups/saved-searches/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Execution failed");
      return res.json();
    },
    onSuccess: (resData) => {
      refetchSaved();
      toast({
        message: `Search refreshed! ${resData.result?.newlyImported ?? 0} new leads saved into database.`,
        type: "success",
      });
      qc.invalidateQueries({ queryKey: ["leads"] });
      refetch();
    },
    onError: (err: any) => {
      toast({ message: err?.message || "Run failed", type: "error" });
    },
    onSettled: () => {
      setRunningSearchId(null);
    },
  });

  // Toggle Pause/Active
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "active" | "paused" }) => {
      const res = await fetch(`/api/startups/saved-searches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Status update failed");
      return res.json();
    },
    onSuccess: () => {
      refetchSaved();
    },
  });

  // Delete Saved Search
  const deleteSavedMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/startups/saved-searches/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      refetchSaved();
      toast({ message: "Saved search removed", type: "success" });
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Rocket className="w-6 h-6 text-yellow-400" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full">
              Tech-as-a-Service • Automated Leads Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Target Startups & Tech Hiring in Real-Time
          </h1>
          <p className="text-blue-100/90 text-sm md:text-base max-w-3xl mt-1">
            Automate scans every 2 or 3 hours across <strong>LinkedIn Guest Jobs</strong>, <strong>Unstop</strong>, <strong>Product Hunt</strong>, and <strong>Show HN</strong>.
            New high-intent leads are automatically evaluated and saved directly to your database.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-blue-200">Discovered Opportunities</div>
              <div className="text-xl font-bold mt-0.5">{startups.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-emerald-200">Actively Hiring Tech Leads</div>
              <div className="text-xl font-bold mt-0.5 text-emerald-300">{hiringCount}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-amber-200">No-Code MVPs (Bubble/Webflow)</div>
              <div className="text-xl font-bold mt-0.5 text-amber-300">{noCodeCount}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="text-xs text-red-200">Critical Intent (Score ≥ 80)</div>
              <div className="text-xl font-bold mt-0.5 text-red-300">{criticalCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Saved Searches Section */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-text">Automated 2-3h Background Search Trackers</span>
            <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
              {savedSearches.length} Saved
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSaveSearchName(`${selectedRole} (${locationInput || "Remote"})`);
                setIsSaveModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs h-8"
            >
              <Bookmark className="w-3.5 h-3.5 text-primary" />
              <span>Save & Automate Current Search</span>
            </Button>
            <button
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="p-1.5 text-muted hover:text-text rounded-md hover:bg-slate-200/50 cursor-pointer transition"
              aria-label="Toggle saved searches"
            >
              {showSavedSearches ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showSavedSearches && (
          <div className="p-4">
            {savedSearches.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted">
                <Bookmark className="w-6 h-6 text-muted/40 mx-auto mb-1.5" />
                <p className="font-medium text-text">No automated searches running yet.</p>
                <p className="mt-0.5">Click &quot;Save & Automate Current Search&quot; to scan every 2 or 3 hours and auto-save fresh leads directly into your database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedSearches.map((s) => {
                  const q = s.geoQuery;
                  const isRunning = runningSearchId === s.id;
                  const isPaused = q.status === "paused";

                  return (
                    <div
                      key={s.id}
                      className={`p-3.5 rounded-xl border transition ${
                        isPaused ? "bg-slate-50 border-slate-200 opacity-75" : "bg-white border-border shadow-xs hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-text flex items-center gap-1.5">
                            <span>{s.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                isPaused ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isPaused ? "Paused" : "Active"}
                            </span>
                          </div>
                          <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span>{q.role}</span>
                            <span>•</span>
                            <MapPin className="w-3 h-3" />
                            <span>{q.location || "Remote"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: s.id,
                                status: isPaused ? "active" : "paused",
                              })
                            }
                            className="p-1 text-muted hover:text-text rounded hover:bg-slate-100 cursor-pointer"
                            title={isPaused ? "Resume schedule" : "Pause schedule"}
                          >
                            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete saved search "${s.name}"?`)) {
                                deleteSavedMutation.mutate(s.id);
                              }
                            }}
                            className="p-1 text-muted hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Schedule info & stats */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary" />
                            <span>Interval: <strong>Every {q.intervalHours || 2}h</strong></span>
                          </div>
                          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                            <Database className="w-3 h-3" />
                            <span>{q.totalImported || 0} leads saved to DB</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => runNowMutation.mutate(s.id)}
                          disabled={isRunning}
                          className="text-[11px] h-7 px-2.5 flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRunning ? "animate-spin text-primary" : ""}`} />
                          <span>Run Now</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-muted shrink-0 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />
          Target Tech Role:
        </span>
        {PRESET_ROLES.map((r) => {
          const active = selectedRole === r;
          return (
            <button
              key={r}
              onClick={() => {
                setSelectedRole(r);
                setSearchQuery("");
              }}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap border ${
                active
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-muted border-border hover:border-text hover:text-text"
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search keyword (e.g. React, Next.js, AI, Bubble)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full"
            />
          </div>
          <div className="relative sm:w-48">
            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Location (e.g. remote, US)..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="pl-10 h-10 w-full"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Source Tabs */}
          <div className="inline-flex rounded-lg border border-border bg-slate-50 p-1 text-xs">
            <button
              onClick={() => setSourceFilter("all")}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                sourceFilter === "all" ? "bg-white shadow text-primary" : "text-muted hover:text-text"
              }`}
            >
              All Sources
            </button>
            <button
              onClick={() => setSourceFilter("linkedin")}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                sourceFilter === "linkedin" ? "bg-white shadow text-blue-700 font-semibold" : "text-muted hover:text-text"
              }`}
            >
              LinkedIn Hiring
            </button>
            <button
              onClick={() => setSourceFilter("unstop")}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                sourceFilter === "unstop" ? "bg-white shadow text-indigo-700 font-semibold" : "text-muted hover:text-text"
              }`}
            >
              Unstop
            </button>
            <button
              onClick={() => setSourceFilter("producthunt")}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                sourceFilter === "producthunt" ? "bg-white shadow text-orange-600 font-semibold" : "text-muted hover:text-text"
              }`}
            >
              Product Hunt
            </button>
            <button
              onClick={() => setSourceFilter("hackernews")}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                sourceFilter === "hackernews" ? "bg-white shadow text-amber-700 font-semibold" : "text-muted hover:text-text"
              }`}
            >
              Show HN
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {filtered.length > 0 && (
            <Button
              size="sm"
              onClick={handleBulkImport}
              disabled={isBulkImporting}
              className="flex items-center gap-1.5 bg-primary text-white"
            >
              {isBulkImporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Users className="w-3.5 h-3.5" />
              )}
              Import All Filtered ({filtered.length})
            </Button>
          )}
        </div>
      </div>

      {/* Results View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium text-text">Scanning live hiring boards & startup launches...</p>
          <p className="text-xs text-muted mt-1">Crawling LinkedIn guest APIs, Unstop, Product Hunt, and Hacker News</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-border p-6">
          <Rocket className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-semibold text-text">No Leads Discovered</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1">
            Try choosing a different role preset, location, or source above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {filtered.map((startup, idx) => {
              const isImported = importedMap[startup.id];
              const itemKey = `${startup.source}_${startup.id}_${idx}`;
              const scoreColor =
                startup.techNeedScore >= 85
                  ? "bg-red-50 text-red-700 border-red-200"
                  : startup.techNeedScore >= 70
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-blue-50 text-blue-700 border-blue-200";

              return (
                <motion.div
                  key={itemKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-text hover:text-primary transition">
                            {startup.name}
                          </h3>
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                              startup.source === "linkedin"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : startup.source === "unstop"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : startup.source === "producthunt"
                                ? "bg-orange-50 text-orange-600 border-orange-200"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}
                          >
                            {startup.source === "linkedin"
                              ? "LinkedIn Hiring"
                              : startup.source === "unstop"
                              ? "Unstop"
                              : startup.source === "producthunt"
                              ? "Product Hunt"
                              : "Show HN"}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-1 font-medium flex items-center gap-1.5">
                          {startup.location && (
                            <span className="flex items-center gap-0.5 text-slate-500">
                              <MapPin className="w-3 h-3" />
                              {startup.location}
                            </span>
                          )}
                          <span>•</span>
                          <span>{startup.tagline}</span>
                        </p>
                      </div>

                      {/* Tech Need Gauge */}
                      <div className={`shrink-0 px-3 py-1.5 rounded-xl border text-center ${scoreColor}`}>
                        <div className="text-[10px] font-bold uppercase tracking-wider">Tech Intent</div>
                        <div className="text-lg font-extrabold flex items-center justify-center gap-0.5">
                          {startup.techNeedScore}
                          <span className="text-[10px] font-normal text-muted">/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Tech Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {startup.techStack.map((tech) => {
                        const isNoCodeTech = ["Bubble.io", "Webflow", "Framer", "WordPress", "Carrd"].includes(tech);
                        const isHiring = tech.includes("Hiring") || tech.includes("Developer") || tech.includes("Engineer");
                        return (
                          <span
                            key={tech}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isNoCodeTech
                                ? "bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                                : isHiring
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            <Code2 className="w-3 h-3" />
                            {tech}
                          </span>
                        );
                      })}

                      {!startup.hasMobileApp && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          No Mobile App
                        </span>
                      )}
                    </div>

                    {/* Buying Signals */}
                    <div className="mt-3.5 space-y-1.5 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <div className="text-[11px] font-semibold text-text flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        Buying Signals for Tech Services:
                      </div>
                      <ul className="text-xs text-muted space-y-1 pl-4 list-disc">
                        {startup.signals.map((sig, sIdx) => (
                          <li key={sIdx} className="leading-relaxed">
                            {sig}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggested Pitch Hook */}
                    <div className="mt-3 bg-blue-50/60 rounded-lg p-2.5 border border-blue-100">
                      <div className="text-[11px] font-semibold text-blue-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        High-Converting Tech-as-a-Service Pitch Hook:
                      </div>
                      <p className="text-xs text-blue-800 mt-1 italic leading-relaxed">
                        &quot;{startup.pitchHook}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <a
                      href={startup.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <span>View Listing / Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isImported ? "secondary" : "primary"}
                        onClick={() => importMutation.mutate(startup)}
                        disabled={importMutation.isPending || isImported}
                        className="flex items-center gap-1.5 text-xs h-8"
                      >
                        {isImported ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>In CRM</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3.5 h-3.5" />
                            <span>1-Click Lead Import</span>
                          </>
                        )}
                      </Button>

                      {isImported && (
                        <Link href="/compose">
                          <Button size="sm" variant="secondary" className="text-xs h-8 flex items-center gap-1 text-primary">
                            <span>Draft Email</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Save Search Modal */}
      <Modal
        open={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Automate Search & Save to Database"
      >
        <div className="space-y-4 p-5">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Search Name
            </label>
            <Input
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="e.g. Remote Full Stack Engineers"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Target Role
              </label>
              <div className="text-xs bg-slate-50 border border-border p-2 rounded-lg font-medium text-text">
                {selectedRole}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Location
              </label>
              <div className="text-xs bg-slate-50 border border-border p-2 rounded-lg font-medium text-text">
                {locationInput || "Remote"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Recurring Sync Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSaveIntervalHours(2)}
                className={`py-2 px-3 text-xs rounded-lg border font-semibold transition cursor-pointer ${
                  saveIntervalHours === 2
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-muted border-border hover:border-text"
                }`}
              >
                Every 2 Hours (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setSaveIntervalHours(3)}
                className={`py-2 px-3 text-xs rounded-lg border font-semibold transition cursor-pointer ${
                  saveIntervalHours === 3
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-muted border-border hover:border-text"
                }`}
              >
                Every 3 Hours
              </button>
              <button
                type="button"
                onClick={() => setSaveIntervalHours(6)}
                className={`py-2 px-3 text-xs rounded-lg border font-semibold transition cursor-pointer ${
                  saveIntervalHours === 6
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white text-muted border-border hover:border-text"
                }`}
              >
                Every 6 Hours
              </button>
            </div>
            <p className="text-[11px] text-muted mt-1.5">
              The engine will automatically execute this search every {saveIntervalHours} hours and persist all newly discovered leads.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text">
              <input
                type="checkbox"
                checked={saveAutoImport}
                onChange={(e) => setSaveAutoImport(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              <span>Automatically save discovered leads directly to CRM database</span>
            </label>
            <p className="text-[11px] text-muted ml-6 mt-0.5">
              Prevents duplicate work and eliminates manual reloads. All leads appear automatically in your CRM Leads and Kanban pipeline.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSaveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => createSavedMutation.mutate()}
              disabled={createSavedMutation.isPending}
              className="flex items-center gap-1.5"
            >
              {createSavedMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Start Automated Tracker</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

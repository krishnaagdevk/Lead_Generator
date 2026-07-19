"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation, Compass, MapPin, Eye, Star, Info, CheckCircle2, ChevronRight, Filter, ShieldAlert, Zap, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer";
import Link from "next/link";

interface Lead {
  id: number;
  name: string;
  category?: string | null;
  address?: string | null;
  websiteStatus: string;
  rating?: number | null;
  reviewCount?: number | null;
  pipelineStage: string;
  physicalVisits: number;
  lastVisitedAt?: string | null;
}

export default function ScoutPage() {
  const qc = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<"all" | "no_website" | "broken" | "won">("all");
  const [radarActive, setRadarActive] = useState(true);
  const [loggingVisitId, setLoggingVisitId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [drawerLeadId, setDrawerLeadId] = useState<number | null>(null);

  // Fetch leads
  const { data, isLoading } = useQuery<{ items: Lead[] }>({
    queryKey: ["leads-scout"],
    queryFn: () => fetch("/api/leads").then((r) => r.json()),
  });

  const leads = data?.items || [];

  // Filter leads
  const filteredLeads = leads.filter((l) => {
    if (filter === "all") return true;
    if (filter === "no_website") return l.websiteStatus === "no_website";
    if (filter === "broken") return l.websiteStatus === "broken";
    if (filter === "won") return l.pipelineStage === "won";
    return true;
  });

  // Simple hash function to generate stable deterministic XY coordinate scatter offsets for radar
  const getCoordinates = (name: string, index: number) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
    // Map leads to distances from center (between 25% and 85%)
    const distance = 25 + (Math.abs(hash >> 3) % 60); 
    
    const x = 50 + Math.cos(angle) * distance * 0.45;
    const y = 50 + Math.sin(angle) * distance * 0.45;
    return { x, y };
  };

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleLogVisit = async (leadId: number) => {
    setLoggingVisitId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/visit`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setToastMessage(json.message);
        // Refresh scout list and the drawer
        qc.invalidateQueries({ queryKey: ["leads-scout"] });
        qc.invalidateQueries({ queryKey: ["lead-details", leadId] });
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead((prev) =>
            prev
              ? {
                  ...prev,
                  physicalVisits: prev.physicalVisits + 1,
                  lastVisitedAt: new Date().toISOString(),
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingVisitId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans pb-10">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-400 animate-pulse" /> Street-Scout Walking Mode
              </h1>
              <p className="text-[11px] text-slate-400">Walk your local high street, check business storefronts, and pitch in-person.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center gap-1.5 shadow-2xs">
              <Compass className={`w-3.5 h-3.5 ${radarActive ? "animate-spin" : ""}`} /> Active Radar
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="max-w-5xl mx-auto w-full px-4 pt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start flex-1">
        {/* Left Hand: Controls & List */}
        <div className="md:col-span-4 flex flex-col gap-4">
          {/* Radar Options & Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-3">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Storefronts
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "all", label: "All Leads", color: "bg-slate-800 text-slate-300" },
                  { id: "no_website", label: "No Website 🔴", color: "bg-red-500/10 text-red-400" },
                  { id: "broken", label: "Broken Web 🟡", color: "bg-amber-500/10 text-amber-400" },
                  { id: "won", label: "Closed Deals 🟢", color: "bg-emerald-500/10 text-emerald-400" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    filter === f.id
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-xs"
                      : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Radar Sweeper Screen</span>
              <button
                onClick={() => setRadarActive(!radarActive)}
                className="text-[10px] text-indigo-400 hover:underline cursor-pointer font-bold"
              >
                {radarActive ? "Disable Radar Sweeping" : "Enable Radar Sweeping"}
              </button>
            </div>
          </div>

          {/* List of Scout Leads */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3 max-h-[380px] overflow-y-auto">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              🚀 Local Scouting targets ({filteredLeads.length})
            </h2>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-xs">Scanning frequencies...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-10">No targets fit this sweep criteria.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredLeads.map((l, i) => {
                  const isSelected = selectedLead?.id === l.id;
                  const isNoWeb = l.websiteStatus === "no_website";
                  const isBroken = l.websiteStatus === "broken";
                  const isWon = l.pipelineStage === "won";
                  
                  let dotColor = "bg-slate-400";
                  if (isNoWeb) dotColor = "bg-red-500";
                  else if (isBroken) dotColor = "bg-amber-500";
                  else if (isWon) dotColor = "bg-emerald-500";

                  return (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLead(l)}
                      className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20"
                          : "bg-slate-900 hover:bg-slate-850 border-slate-800"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-slate-200 truncate">{l.name}</h3>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{l.category ?? "Storefront"}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded">
                            Visits: {l.physicalVisits}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 self-center" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right Hand: Radar Map and Target Info Panel */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-6">
          {/* Radar HUD Screen */}
          <div className="sm:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-6 flex flex-col items-center justify-center min-h-[400px] shadow-2xl relative">
            {/* Glowing Scan Wave Circle */}
            <div className="relative w-72 h-72 rounded-full border border-indigo-500/20 flex items-center justify-center bg-slate-950/60 shadow-[inset_0_0_40px_rgba(79,70,229,0.05)]">
              {/* Core radar sweeps */}
              <div className="absolute inset-4 rounded-full border border-indigo-500/10 flex items-center justify-center">
                <div className="absolute inset-12 rounded-full border border-indigo-500/5 flex items-center justify-center">
                  <div className="absolute inset-16 rounded-full border border-indigo-500/5" />
                </div>
              </div>

              {/* Polar Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:16px_16px] rounded-full" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-indigo-500/10" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-indigo-500/10" />

              {/* Sweeper Glow Arc */}
              {radarActive && (
                <div className="absolute inset-0 rounded-full bg-conic-gradient from-indigo-500/10 via-transparent to-transparent animate-[spin_4s_linear_infinite] pointer-events-none" />
              )}

              {/* Active Radar Targets */}
              {filteredLeads.map((l, i) => {
                const { x, y } = getCoordinates(l.name, i);
                const isSelected = selectedLead?.id === l.id;
                const isNoWeb = l.websiteStatus === "no_website";
                const isBroken = l.websiteStatus === "broken";
                const isWon = l.pipelineStage === "won";

                let dotColor = "bg-slate-400 shadow-slate-400/40";
                if (isNoWeb) dotColor = "bg-red-500 shadow-red-500/50";
                else if (isBroken) dotColor = "bg-amber-500 shadow-amber-500/40";
                else if (isWon) dotColor = "bg-emerald-500 shadow-emerald-500/40";

                return (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLead(l)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? "w-7 h-7 bg-indigo-500/20 border border-indigo-400 flex items-center justify-center z-20 scale-125"
                        : "w-4 h-4 bg-transparent hover:bg-slate-800 border border-slate-700 flex items-center justify-center z-10"
                    }`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={l.name}
                  >
                    <span className={`w-2 h-2 rounded-full shadow-lg ${dotColor} ${radarActive ? "animate-pulse" : ""}`} />
                  </button>
                );
              })}

              {/* Center Home Dot */}
              <div className="absolute w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center z-30">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
              </div>
            </div>

            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-4">Scout HUD Crosshair</p>
          </div>

          {/* Scout Target Profile HUD Card */}
          <div className="sm:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 min-h-[400px] shadow-2xl">
            {selectedLead ? (
              <div className="flex flex-col gap-4 flex-1">
                {/* Profile Header */}
                <div>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block mb-1">Target Profile Locked</span>
                  <h3 className="font-extrabold text-base leading-tight text-white">{selectedLead.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{selectedLead.category ?? "Physical Local Business"}</p>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2.5 text-xs">
                  {/* Website Status & Badge */}
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800/50">
                    <span className="text-slate-400">Web Presence:</span>
                    <StatusBadge status={selectedLead.websiteStatus} />
                  </div>

                  {/* Google Maps Rating */}
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800/50">
                    <span className="text-slate-400">Google Rating:</span>
                    {selectedLead.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-bold text-white">{selectedLead.rating}</span>
                        <span className="text-[10px] text-slate-500">({selectedLead.reviewCount})</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-medium">None</span>
                    )}
                  </div>

                  {/* Physical Address */}
                  {selectedLead.address && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Storefront Address</p>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        {selectedLead.address}
                      </p>
                    </div>
                  )}
                </div>

                {/* In Person Checklist */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/50 flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">🚶‍♂️ In-Store Recon Checklist</p>
                  <ul className="flex flex-col gap-1.5 text-[11px] text-slate-400">
                    <li className="flex items-center gap-2">
                      <input type="checkbox" className="rounded bg-slate-900 border-slate-800" />
                      <span>Has paper/laminated food menu</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" className="rounded bg-slate-900 border-slate-800" />
                      <span>No QR codes or mobile checkout tools</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" className="rounded bg-slate-900 border-slate-800" />
                      <span>Store is moderately busy/active</span>
                    </li>
                  </ul>
                </div>

                {/* Hustle Action Buttons */}
                <div className="flex flex-col gap-2 mt-auto">
                  <Button
                    onClick={() => handleLogVisit(selectedLead.id)}
                    loading={loggingVisitId === selectedLead.id}
                    className="w-full h-10 font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Log Physical Visit (+10 XP)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDrawerLeadId(selectedLead.id)}
                    className="w-full h-10 font-bold text-xs border-slate-800 hover:bg-slate-800 text-slate-300 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> Open CRM Workspace
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-10">
                <Compass className="w-10 h-10 text-slate-700 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-slate-400">No Storefront Locked</p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">Tap a glowing target marker on the radar screen to load its pitching profile.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating CRM Drawer workspace */}
      <AnimatePresence>
        {drawerLeadId && (
          <LeadDetailDrawer
            leadId={drawerLeadId}
            onClose={() => {
              setDrawerLeadId(null);
              qc.invalidateQueries({ queryKey: ["leads-scout"] });
            }}
          />
        )}
      </AnimatePresence>

      {/* Interactive Floating Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/30 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 text-xs font-semibold text-emerald-400 ring-4 ring-emerald-500/10"
          >
            <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Target, Award, Star, Zap, GraduationCap, Flame, ArrowRight, Save, Sparkles, Loader2, Landmark, Compass, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface UserProfile {
  id: number;
  email: string;
  hustleTargetName: string;
  hustleTargetPrice: number;
  studentMajor?: string | null;
  studentUniversity?: string | null;
}

interface ProfileResponse {
  user: UserProfile;
  earnings: number;
  totalXp: number;
  stats: {
    totalLeads: number;
    physicalVisits: number;
    closedDeals: number;
  };
}

export default function HustleHubPage() {
  const qc = useQueryClient();
  const [targetName, setTargetName] = useState("Build My Dev Setup");
  const [targetPrice, setTargetPrice] = useState<number>(1000);
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch student profile stats
  const { data, isLoading } = useQuery<ProfileResponse>({
    queryKey: ["student-profile"],
    queryFn: () => fetch("/api/user/profile").then((r) => r.json()),
  });

  // Load state when data is ready
  useEffect(() => {
    if (data?.user) {
      setTargetName(data.user.hustleTargetName);
      setTargetPrice(data.user.hustleTargetPrice);
      setUniversity(data.user.studentUniversity || "");
      setMajor(data.user.studentMajor || "");
    }
  }, [data]);

  // Mutation to save profile
  const saveProfile = useMutation({
    mutationFn: (updates: Partial<UserProfile>) =>
      fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) {
        setToast("Hustle goals and student info locked in! 🚀");
        qc.invalidateQueries({ queryKey: ["student-profile"] });
      }
    },
  });

  const handleSaveProfile = () => {
    setSaving(true);
    saveProfile.mutate({
      hustleTargetName: targetName,
      hustleTargetPrice: targetPrice,
      studentUniversity: university,
      studentMajor: major,
    });
    setTimeout(() => setSaving(false), 800);
  };

  // Toast clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold text-slate-400">Loading your hustle portfolio...</span>
      </div>
    );
  }

  const earnings = data?.earnings || 0;
  const xp = data?.totalXp || 0;
  const stats = data?.stats || { totalLeads: 0, physicalVisits: 0, closedDeals: 0 };

  // Calculate Level based on XP
  let level = 1;
  let title = "Street Scout";
  let minXp = 0;
  let maxXp = 150;

  if (xp >= 2500) {
    level = 5;
    title = "Agency Founder";
    minXp = 2500;
    maxXp = 5000;
  } else if (xp >= 1200) {
    level = 4;
    title = "Agile Hustler";
    minXp = 1200;
    maxXp = 2500;
  } else if (xp >= 500) {
    level = 3;
    title = "Local Consultant";
    minXp = 500;
    maxXp = 1200;
  } else if (xp >= 150) {
    level = 2;
    title = "Rookie Developer";
    minXp = 150;
    maxXp = 500;
  }

  const percentToNextLevel = Math.min(100, Math.max(0, ((xp - minXp) / (maxXp - minXp)) * 100));
  const percentToTarget = Math.min(100, (earnings / targetPrice) * 100);

  // Motivational Achievement Badges
  const badges = [
    {
      id: "first_visit",
      name: "First Steps",
      desc: "Log your first in-person storefront scan",
      unlocked: stats.physicalVisits > 0,
      icon: Compass,
      color: "from-sky-500 to-blue-600",
    },
    {
      id: "first_deal",
      name: "Ink Signed",
      desc: "Get your first milestone contract digitally signed",
      unlocked: stats.closedDeals > 0,
      icon: Award,
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: "xp_hustler",
      name: "Agile Grinder",
      desc: "Reach Level 3: Local Consultant",
      unlocked: level >= 3,
      icon: Flame,
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "target_smashed",
      name: "Goal Destroyer",
      desc: "Reach your physical financial target",
      unlocked: earnings >= targetPrice,
      icon: Trophy,
      color: "from-purple-500 to-indigo-600",
    },
  ];

  // Local physical leaders simulation
  const leaders = [
    { rank: 1, name: "Liam @ UCL", major: "Computer Science", level: 5, xp: 3420, won: "$1,850" },
    { rank: 2, name: "Sarah @ Imperial", major: "Design & UX", level: 4, xp: 2110, won: "$1,200" },
    { rank: 3, name: "Alex @ KCL", major: "Economics", level: 3, xp: 950, won: "$800" },
    { rank: 4, name: "You", major: major || "Student Developer", level, xp, won: `$${earnings}` },
    { rank: 5, name: "Chloe @ Bristol", major: "Physics & Eng", level: 2, xp: 420, won: "$350" },
  ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-indigo-500/30 text-indigo-400 rounded-2xl p-4 shadow-2xl flex items-center gap-3 z-50 text-xs font-semibold ring-4 ring-indigo-500/10 animate-bounce">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400 animate-pulse" /> The Hustle Hub
            </h1>
            <p className="text-[11px] text-slate-400">Your gamified pocket workspace. Scout, pitch, lock milestones, and fund your dev stack.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/scout"
              className="inline-flex h-9 items-center justify-center px-4 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all gap-1.5"
            >
              <Compass className="w-4 h-4" /> Walking Radar Mode
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 pt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Gamified progression (Ring & Profile) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Target Ring circular visual */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Background grid dots */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:12px_12px] opacity-40 pointer-events-none" />

            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mb-4">
              <Target className="w-4 h-4 text-indigo-400" /> Goal Tracker
            </h2>

            {/* Circular Ring */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="68" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="stroke-indigo-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 68}
                  strokeDashoffset={2 * Math.PI * 68 * (1 - percentToTarget / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">${earnings}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Raised</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-bold mt-4 leading-snug">
              Funding: <span className="text-indigo-400">"{targetName}"</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Goal: ${targetPrice} USD • {percentToTarget.toFixed(0)}% Smashed</p>
          </div>

          {/* Student Profile Info Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-400" /> Student Credentials
            </h2>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">University</span>
                <input
                  type="text"
                  placeholder="e.g. Imperial College London"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Major / Field of Study</span>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Hustle Target Goal Name</span>
                <input
                  type="text"
                  placeholder="e.g. New Mac Studio"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Goal Price ($)</span>
                <input
                  type="number"
                  placeholder="1000"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                loading={saving}
                className="h-9 mt-2 font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save Credentials
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Gamified Stats, Badges, & Leaderboard */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Level Tracker progression panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden">
            {/* Corner visual flare */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-black text-lg text-indigo-400">
                  {level}
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Current Rank Class</span>
                  <h3 className="font-extrabold text-base leading-tight text-white">{title}</h3>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Experience Points</span>
                <p className="font-black text-sm text-indigo-400">{xp} <span className="text-xs text-slate-500 font-medium">/ {maxXp} XP</span></p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentToNextLevel}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium mt-1.5">
                <span>Lvl {level}</span>
                <span>{(maxXp - xp) <= 0 ? "Max Level Reached" : `${maxXp - xp} XP to Level ${level + 1}`}</span>
                <span>Lvl {level + 1}</span>
              </div>
            </div>
          </div>

          {/* Activity Statistics Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Leads Scanned", val: stats.totalLeads, desc: "+5 XP per lead" },
              { label: "Physical Visits", val: stats.physicalVisits, desc: "+10 XP per visit" },
              { label: "Closed Deals", val: stats.closedDeals, desc: "+100 XP per deal" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-center flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</span>
                <p className="text-xl font-black text-white my-1.5">{s.val}</p>
                <span className="text-[9px] text-indigo-400/80 font-semibold">{s.desc}</span>
              </div>
            ))}
          </div>

          {/* Badges and Leaderboard side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Achievement Badges */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" /> Milestone Badges
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {badges.map((b) => {
                  const Icon = b.icon;
                  return (
                    <div
                      key={b.id}
                      className={`p-3 border rounded-2xl flex flex-col items-center text-center gap-2 transition-all select-none ${
                        b.unlocked
                          ? "bg-slate-900 border-slate-700/80 shadow-md opacity-100"
                          : "bg-slate-950/40 border-slate-900/60 opacity-40 grayscale"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${b.color} flex items-center justify-center text-white shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-200">{b.name}</h4>
                        <p className="text-[8px] text-slate-500 mt-0.5 leading-snug">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hustlers Leaderboard */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-indigo-400" /> Local Hustlers League
              </h2>

              <div className="flex flex-col gap-2.5">
                {leaders.map((l, i) => {
                  const isUser = l.name === "You";
                  return (
                    <div
                      key={i}
                      className={`flex justify-between items-center p-2.5 rounded-xl border text-xs gap-3 ${
                        isUser
                          ? "bg-indigo-950/20 border-indigo-500/50 text-indigo-300 font-bold"
                          : "bg-slate-950/40 border-slate-900/60 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-extrabold w-4 text-center text-[10px] text-slate-500">
                          #{i + 1}
                        </span>
                        <div className="truncate">
                          <p className="font-black text-slate-200 truncate">{l.name}</p>
                          <p className="text-[9px] text-slate-500 truncate mt-0.5">{l.major}</p>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                          {l.xp} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

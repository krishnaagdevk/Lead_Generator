"use client";

import React, { useState } from "react";
import { Laptop, Smartphone, Tablet, ExternalLink, Sparkles, RefreshCw, Layers, Palette, CheckCircle2, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";

interface MockupData {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  features: Array<{ title: string; desc: string; icon: string }>;
  services: Array<{ name: string; price: string; desc: string }>;
  about: string;
}

interface MockupPreviewProps {
  businessName: string;
  mockupData: MockupData;
}

export function MockupPreview({ businessName, mockupData }: MockupPreviewProps) {
  const [device, setDevice] = useState<"mobile" | "tablet" | "clean">("mobile");
  const [palette, setPalette] = useState<"ai" | "ocean" | "sunset" | "charcoal">("ai");

  // Dynamic colors mapper
  const getPaletteColors = () => {
    switch (palette) {
      case "ocean":
        return { primary: "#0284c7", secondary: "#0ea5e9", background: "#f0f9ff", accent: "#0369a1" };
      case "sunset":
        return { primary: "#db2777", secondary: "#f43f5e", background: "#fff1f2", accent: "#be185d" };
      case "charcoal":
        return { primary: "#1e293b", secondary: "#475569", background: "#f8fafc", accent: "#0f172a" };
      case "ai":
      default:
        // Parse AI generated colors (normalize tailwind or hex)
        const prim = mockupData.colors.primary.startsWith("#") ? mockupData.colors.primary : "#4f46e5";
        const sec = mockupData.colors.secondary.startsWith("#") ? mockupData.colors.secondary : "#6366f1";
        const bg = mockupData.colors.background.startsWith("#") ? mockupData.colors.background : "#f5f3ff";
        const acc = mockupData.colors.accent.startsWith("#") ? mockupData.colors.accent : "#4338ca";
        return { primary: prim, secondary: sec, background: bg, accent: acc };
    }
  };

  const colors = getPaletteColors();

  // Helper to render Lucide icon dynamically
  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Sparkles;
    return <IconComponent className="w-5 h-5 shrink-0" style={{ color: colors.primary }} />;
  };

  return (
    <div className="flex flex-col gap-4 border border-border bg-slate-50/50 rounded-2xl p-4">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-border rounded-xl p-3 shadow-xs">
        {/* Device Toggles */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {(
            [
              { id: "mobile", icon: Smartphone, label: "Mobile" },
              { id: "tablet", icon: Tablet, label: "Tablet" },
              { id: "clean", icon: Laptop, label: "Full Card" },
            ] as const
          ).map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  device === d.id ? "bg-white text-primary shadow-xs" : "text-muted hover:text-text"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{d.label}</span>
              </button>
            );
          })}
        </div>

        {/* Color Palette Presets */}
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-muted" />
          <div className="flex gap-1.5">
            {(
              [
                { id: "ai", color: colors.primary, label: "AI Suggested" },
                { id: "ocean", color: "#0284c7", label: "Ocean Sky" },
                { id: "sunset", color: "#db2777", label: "Pink Sunset" },
                { id: "charcoal", color: "#1e293b", label: "Dark Onyx" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                title={p.label}
                className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                  palette === p.id ? "border-slate-400 scale-110 shadow-xs" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: p.color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Device Shell Wrapper */}
      <div className="flex justify-center items-center py-4 bg-slate-100 rounded-xl border border-border/60 relative overflow-hidden min-h-[450px]">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        {device === "mobile" && (
          /* Mobile Phone Shell */
          <div className="w-[280px] h-[520px] rounded-[36px] bg-slate-950 border-[10px] border-slate-900 shadow-2xl relative flex flex-col overflow-hidden ring-4 ring-slate-800/10 z-10 shrink-0">
            {/* Speaker / Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-slate-950 rounded-b-xl z-30 flex items-center justify-center gap-1.5">
              <div className="w-10 h-1 rounded bg-slate-800" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-800" />
            </div>

            {/* Mobile Browser Window */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden pt-4 text-slate-800">
              {/* Browser Address Bar */}
              <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 text-[10px] flex items-center justify-between text-muted shrink-0 select-none">
                <span className="truncate w-40 font-medium">{businessName.toLowerCase().replace(/\s+/g, "")}.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </div>

              {/* Dynamic Scrollable Content */}
              <div className="flex-1 overflow-y-auto" style={{ backgroundColor: colors.background }}>
                {/* Header */}
                <header className="px-4 py-3 border-b border-slate-200/50 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20 shrink-0">
                  <span className="font-bold text-xs" style={{ color: colors.primary }}>{businessName}</span>
                  <div className="w-4.5 h-3.5 flex flex-col justify-between cursor-pointer gap-0.5">
                    <span className="h-0.5 w-full rounded bg-slate-800" />
                    <span className="h-0.5 w-full rounded bg-slate-800" />
                    <span className="h-0.5 w-full rounded bg-slate-800" />
                  </div>
                </header>

                {/* Hero */}
                <section className="px-4 py-8 text-center flex flex-col gap-3 relative overflow-hidden bg-white">
                  <h1 className="text-sm font-extrabold tracking-tight leading-snug" style={{ color: colors.accent }}>{mockupData.hero.title}</h1>
                  <p className="text-[10px] text-muted leading-relaxed px-1">{mockupData.hero.subtitle}</p>
                  <button className="px-4 py-2 rounded-lg text-[10px] font-bold self-center shadow-xs transition-transform active:scale-95" style={{ backgroundColor: colors.primary, color: "#ffffff" }}>
                    {mockupData.hero.ctaText}
                  </button>
                </section>

                {/* Features */}
                <section className="px-4 py-6 flex flex-col gap-4">
                  <h2 className="text-xs font-bold text-center uppercase tracking-wider text-muted">Why Choose Us</h2>
                  <div className="flex flex-col gap-3">
                    {mockupData.features.map((f, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-slate-200/40 shadow-2xs flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                          {renderIcon(f.icon)}
                        </div>
                        <div>
                          <h3 className="text-[10px] font-bold text-slate-800">{f.title}</h3>
                          <p className="text-[9px] text-muted mt-0.5 leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Services */}
                <section className="px-4 py-6 bg-white border-y border-slate-200/40">
                  <h2 className="text-xs font-bold text-center uppercase tracking-wider text-muted mb-4">Our Services</h2>
                  <div className="flex flex-col gap-3">
                    {mockupData.services.map((s, i) => (
                      <div key={i} className="flex justify-between items-start gap-4 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex-1">
                          <h3 className="text-[10px] font-semibold text-slate-800">{s.name}</h3>
                          <p className="text-[9px] text-muted mt-0.5 leading-snug">{s.desc}</p>
                        </div>
                        <span className="text-[10px] font-bold whitespace-nowrap bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                          {s.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* About Section */}
                <section className="px-4 py-6 text-center bg-slate-50 flex flex-col gap-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted">About Our Story</h2>
                  <p className="text-[10px] text-muted leading-relaxed whitespace-pre-wrap px-1">{mockupData.about}</p>
                </section>

                {/* Footer */}
                <footer className="py-6 text-center border-t border-slate-200/40 bg-white">
                  <p className="text-[8px] text-muted">&copy; {new Date().getFullYear()} {businessName}. Built with ❤️ locally.</p>
                </footer>
              </div>
            </div>
          </div>
        )}

        {device === "tablet" && (
          /* Tablet Shell */
          <div className="w-[420px] h-[560px] rounded-[28px] bg-slate-950 border-[12px] border-slate-900 shadow-2xl relative flex flex-col overflow-hidden ring-4 ring-slate-800/10 z-10 shrink-0">
            {/* Camera dot */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-900 z-30" />

            {/* Tablet Browser Window */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden text-slate-800">
              {/* Browser Address Bar */}
              <div className="px-4 py-1.5 bg-slate-100 border-b border-slate-200 text-xs flex items-center justify-between text-muted shrink-0 select-none">
                <span className="truncate font-medium">{businessName.toLowerCase().replace(/\s+/g, "")}.com</span>
                <ExternalLink className="w-3 h-3" />
              </div>

              {/* Dynamic Scrollable Content */}
              <div className="flex-1 overflow-y-auto" style={{ backgroundColor: colors.background }}>
                {/* Header */}
                <header className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-20 shrink-0">
                  <span className="font-extrabold text-sm" style={{ color: colors.primary }}>{businessName}</span>
                  <div className="flex gap-4 text-xs font-semibold text-slate-600">
                    <span className="text-slate-800 border-b-2 font-bold" style={{ borderColor: colors.primary }}>Home</span>
                    <span>Services</span>
                    <span>About</span>
                  </div>
                </header>

                {/* Hero */}
                <section className="px-6 py-12 text-center flex flex-col gap-4 bg-white border-b border-slate-200/40">
                  <h1 className="text-lg font-black tracking-tight leading-snug max-w-sm mx-auto" style={{ color: colors.accent }}>{mockupData.hero.title}</h1>
                  <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto px-1">{mockupData.hero.subtitle}</p>
                  <button className="px-6 py-2.5 rounded-lg text-xs font-bold self-center shadow-md transition-transform active:scale-95" style={{ backgroundColor: colors.primary, color: "#ffffff" }}>
                    {mockupData.hero.ctaText}
                  </button>
                </section>

                {/* Features Grid */}
                <section className="px-6 py-8 flex flex-col gap-6">
                  <h2 className="text-xs font-bold text-center uppercase tracking-wider text-muted">Why People Love {businessName}</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {mockupData.features.map((f, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-slate-200/40 shadow-2xs flex flex-col items-center text-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                          {renderIcon(f.icon)}
                        </div>
                        <div>
                          <h3 className="text-[10px] font-bold text-slate-800">{f.title}</h3>
                          <p className="text-[9px] text-muted mt-0.5 leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Services Section */}
                <section className="px-6 py-8 bg-white border-y border-slate-200/40">
                  <h2 className="text-xs font-bold text-center uppercase tracking-wider text-muted mb-6">Featured Services</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {mockupData.services.map((s, i) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200/40 flex flex-col justify-between gap-3 shadow-2xs">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="text-xs font-semibold text-slate-800 leading-snug">{s.name}</h3>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                              {s.price}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted leading-relaxed">{s.desc}</p>
                        </div>
                        <button className="flex items-center text-[10px] font-bold justify-end gap-0.5" style={{ color: colors.primary }}>
                          Book Now <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* About Story */}
                <section className="px-6 py-8 text-center bg-slate-50 flex flex-col gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted">About Us</h2>
                  <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto whitespace-pre-wrap">{mockupData.about}</p>
                </section>

                {/* Footer */}
                <footer className="py-8 text-center border-t border-slate-200/40 bg-white">
                  <p className="text-[10px] text-muted">&copy; {new Date().getFullYear()} {businessName}. Crafted for excellence.</p>
                </footer>
              </div>
            </div>
          </div>
        )}

        {device === "clean" && (
          /* Clean Full-Card Component Preview */
          <div className="w-[90%] max-w-md bg-white border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col text-slate-800 z-10 relative">
            {/* Header banner */}
            <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" /> 100% Custom AI Website Specifications
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Ready to Pitch
              </span>
            </div>

            <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[460px]" style={{ backgroundColor: colors.background }}>
              {/* Value Proposition */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Pitch Title Headline</p>
                <h3 className="font-extrabold text-base leading-snug" style={{ color: colors.accent }}>{mockupData.hero.title}</h3>
                <p className="text-xs text-muted mt-2 leading-relaxed">{mockupData.hero.subtitle}</p>
                <div className="flex gap-2 mt-4 items-center">
                  <span className="text-xs font-semibold text-slate-500">CTA button:</span>
                  <span className="text-xs font-extrabold px-3 py-1 rounded text-white shadow-2xs" style={{ backgroundColor: colors.primary }}>
                    {mockupData.hero.ctaText}
                  </span>
                </div>
              </div>

              {/* Theme colors layout */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col gap-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Theme Palette Spectrum</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Primary", val: colors.primary },
                    { label: "Secondary", val: colors.secondary },
                    { label: "Accent", val: colors.accent },
                    { label: "Background", val: colors.background },
                  ].map((c) => (
                    <div key={c.label} className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-lg border shadow-3xs" style={{ backgroundColor: c.val }} />
                      <span className="text-[8px] font-bold text-slate-500">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service specs */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">Service & Menu Packages</p>
                <div className="flex flex-col gap-2.5">
                  {mockupData.services.map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-200/40 p-2.5 rounded-lg">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-800">{s.name}</span>
                        <p className="text-[9px] text-muted mt-0.5 leading-snug">{s.desc}</p>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {s.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom community bio */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Localized Biography Segment</p>
                <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap">{mockupData.about}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

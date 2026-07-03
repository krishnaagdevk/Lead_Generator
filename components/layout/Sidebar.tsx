"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Layers, LogOut, Mail, Map, Settings, Users, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/search",    icon: Map,       label: "Search" },
  { href: "/leads",     icon: Users,     label: "Leads" },
  { href: "/compose",   icon: Mail,      label: "Compose" },
  { href: "/pipeline",  icon: Layers,    label: "Pipeline" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/guide",     icon: BookOpen,  label: "Guide" },
  { href: "/settings",  icon: Settings,  label: "Settings" },
];

export function Sidebar({ brandName, brandLogo, brandColor }: { brandName?: string | null; brandLogo?: string | null; brandColor?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: brandColor || "var(--color-primary)" }}>
            {brandLogo ? (
              <img src={brandLogo} alt={brandName ?? ""} className="w-4 h-4 rounded object-contain" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            )}
          </div>
          <span className="text-white font-bold text-base">{brandName || "LeadHunter"}</span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-white hover:text-white/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto" aria-label="Main navigation">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer",
                active ? "text-white" : "hover:bg-white/10 hover:text-white"
              )}
              style={active ? { backgroundColor: "var(--color-primary)" } : { color: "var(--color-sidebar-text)" }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium hover:bg-white/10 hover:text-white transition-colors duration-200 cursor-pointer"
          style={{ color: "var(--color-sidebar-text)" }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30 h-14 border-b border-white/10 w-full shrink-0"
        style={{ backgroundColor: "var(--color-sidebar)" }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white hover:text-white/80 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: brandColor || "var(--color-primary)" }}>
            {brandLogo ? (
              <img src={brandLogo} alt={brandName ?? ""} className="w-3.5 h-3.5 rounded object-contain" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-white fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            )}
          </div>
          <span className="text-white font-bold text-sm">{brandName || "LeadHunter"}</span>
        </div>
        <div className="w-6 h-6" />
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 transition-opacity duration-300"
          />
          <aside
            className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col h-full shadow-xl"
            style={{ backgroundColor: "var(--color-sidebar)" }}
          >
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex w-56 shrink-0 flex-col h-screen sticky top-0"
        style={{ backgroundColor: "var(--color-sidebar)" }}
      >
        {navContent}
      </aside>
    </>
  );
}

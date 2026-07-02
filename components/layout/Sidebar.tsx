"use client";

import { cn } from "@/lib/utils";
import { BarChart3, Layers, LogOut, Mail, Map, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/search",    icon: Map,      label: "Search" },
  { href: "/leads",     icon: Users,    label: "Leads" },
  { href: "/compose",   icon: Mail,     label: "Compose" },
  { href: "/pipeline",  icon: Layers,   label: "Pipeline" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/settings",  icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0" style={{ backgroundColor: "var(--color-sidebar)" }}>
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-primary)" }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span className="text-white font-bold text-base">LeadHunter</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1" aria-label="Main navigation">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
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

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium hover:bg-white/10 hover:text-white transition-colors duration-200 cursor-pointer"
          style={{ color: "var(--color-sidebar-text)" }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}

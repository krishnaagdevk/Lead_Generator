"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExportMenu({ selectedIds }: { selectedIds: number[] }) {
  const [open, setOpen] = useState(false);

  function download(format: "csv" | "xlsx") {
    window.location.href = `/api/leads/export/${format}`;
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-medium text-muted hover:bg-background transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 bg-white border border-border rounded-lg shadow-dropdown py-1 min-w-[140px]">
          <button onClick={() => download("csv")} className="w-full text-left px-4 py-2 text-sm text-text hover:bg-background cursor-pointer transition-colors">
            Export CSV
          </button>
          <button onClick={() => download("xlsx")} className="w-full text-left px-4 py-2 text-sm text-text hover:bg-background cursor-pointer transition-colors">
            Export Excel (.xlsx)
          </button>
        </div>
      )}
    </div>
  );
}

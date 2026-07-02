"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExportMenu({ selectedIds }: { selectedIds: number[] }) {
  const [open, setOpen] = useState(false);
  const [exportingSheets, setExportingSheets] = useState(false);

  function download(format: "csv" | "xlsx") {
    const idsQuery = selectedIds.length > 0 ? `?ids=${selectedIds.join(",")}` : "";
    window.location.href = `/api/leads/export/${format}${idsQuery}`;
    setOpen(false);
  }

  async function handleGoogleSheetsExport() {
    setExportingSheets(true);
    setOpen(false);
    try {
      const res = await fetch("/api/leads/export/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to export to Google Sheets");
      }
      window.open(data.url, "_blank");
    } catch (err: any) {
      alert(err.message || "Google Sheets export failed");
    } finally {
      setExportingSheets(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-medium text-muted hover:bg-background transition-colors cursor-pointer"
        disabled={exportingSheets}
      >
        <Download className="w-4 h-4" />
        {exportingSheets ? "Exporting..." : "Export"}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 bg-white border border-border rounded-lg shadow-dropdown py-1 min-w-[180px]">
          <button onClick={() => download("csv")} className="w-full text-left px-4 py-2 text-sm text-text hover:bg-background cursor-pointer transition-colors">
            Export CSV
          </button>
          <button onClick={() => download("xlsx")} className="w-full text-left px-4 py-2 text-sm text-text hover:bg-background cursor-pointer transition-colors">
            Export Excel (.xlsx)
          </button>
          <button onClick={handleGoogleSheetsExport} className="w-full text-left px-4 py-2 text-sm text-text hover:bg-background cursor-pointer transition-colors">
            Export to Google Sheets
          </button>
        </div>
      )}
    </div>
  );
}

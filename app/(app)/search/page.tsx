"use client";

import { SearchPanel } from "@/components/search/SearchPanel";

export default function SearchPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-4 border-b border-border bg-white">
        <h1 className="text-xl font-bold text-text">Search Leads</h1>
        <p className="text-sm text-muted mt-0.5">Find local businesses that need a website.</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <SearchPanel />
      </div>
    </div>
  );
}

import React from "react";

export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 bg-border rounded-lg" />
          <div className="h-4 w-72 bg-border/60 rounded" />
        </div>
        <div className="h-10 w-32 bg-border rounded-lg shrink-0" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white rounded-xl border border-border flex flex-col gap-3">
            <div className="h-4 w-24 bg-border/60 rounded" />
            <div className="h-8 w-16 bg-border rounded-lg" />
            <div className="h-3 w-32 bg-border/40 rounded" />
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="bg-white rounded-xl border border-border p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="h-5 w-32 bg-border rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-border rounded" />
            <div className="h-8 w-24 bg-border rounded" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="h-10 w-10 bg-border/50 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-1/3 bg-border rounded" />
                <div className="h-3 w-1/4 bg-border/60 rounded" />
              </div>
              <div className="h-6 w-16 bg-border/40 rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { syncImmediately, subscribeToSyncStatus } from "@/lib/client/sync";
import { Wifi, WifiOff, CloudLightning, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface OfflineSyncContextType {
  isOnline: boolean;
  syncStatus: "idle" | "syncing" | "error";
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isOnline: true,
  syncStatus: "idle",
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle");
  const [showSyncedNotification, setShowSyncedNotification] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(window.navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncImmediately();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        syncImmediately(); // Flush changes when leaving page
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial sync check
    syncImmediately();

    // Subscribe to status updates from sync manager
    const unsubscribe = subscribeToSyncStatus((newStatus) => {
      setSyncStatus((prevStatus) => {
        if (prevStatus === "syncing" && newStatus === "idle") {
          // Show "all saved" temporarily when transitioning from syncing to idle
          setShowSyncedNotification(true);
          const t = setTimeout(() => setShowSyncedNotification(false), 3000);
          return newStatus;
        }
        return newStatus;
      });
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribe();
    };
  }, []);

  return (
    <OfflineSyncContext.Provider value={{ isOnline, syncStatus }}>
      {children}

      {/* Floating Status Indicator for Premium Feedback */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none flex flex-col items-end gap-2">
        {/* Offline Badge */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-200/50 bg-amber-50/90 text-amber-700 text-xs font-medium shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline - Changes saved locally</span>
          </div>
        )}

        {/* Syncing Badge */}
        {syncStatus === "syncing" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium shadow-lg backdrop-blur-md animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing with server...</span>
          </div>
        )}

        {/* Sync Error Badge */}
        {syncStatus === "error" && isOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-200/50 bg-red-50/90 text-red-700 text-xs font-medium shadow-lg backdrop-blur-md animate-bounce">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Sync error - retrying soon</span>
          </div>
        )}

        {/* Synced Success Notification */}
        {showSyncedNotification && isOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200/50 bg-emerald-50/90 text-emerald-700 text-xs font-medium shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300 fade-out slide-out-to-bottom-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All changes synced</span>
          </div>
        )}
      </div>
    </OfflineSyncContext.Provider>
  );
}

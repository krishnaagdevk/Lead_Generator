import { getPendingMutations, deletePendingMutation, PendingMutation } from "./db";

let isSyncing = false;
let syncTimeout: NodeJS.Timeout | null = null;
const listeners = new Set<(status: "idle" | "syncing" | "error") => void>();

export function subscribeToSyncStatus(listener: (status: "idle" | "syncing" | "error") => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(status: "idle" | "syncing" | "error") {
  listeners.forEach((l) => l(status));
}

export async function syncImmediately(): Promise<void> {
  if (isSyncing) return;
  if (typeof window === "undefined" || !window.navigator.onLine) {
    return;
  }

  const queue = await getPendingMutations();
  if (queue.length === 0) {
    notifyListeners("idle");
    return;
  }

  isSyncing = true;
  notifyListeners("syncing");

  try {
    for (const mutation of queue) {
      if (mutation.id === undefined) continue;

      let success = false;
      try {
        success = await processMutation(mutation);
      } catch (err) {
        console.error("Failed to process mutation during sync:", err);
        // Network error - stop queue execution and retry later
        notifyListeners("error");
        isSyncing = false;
        return;
      }

      if (success) {
        await deletePendingMutation(mutation.id);
      } else {
        // Non-recoverable error (e.g. 400 Bad Request, 404 Not Found)
        // We delete it from queue to avoid blocking other mutations
        await deletePendingMutation(mutation.id);
      }
    }
    notifyListeners("idle");
  } catch (err) {
    console.error("Critical error in sync loop:", err);
    notifyListeners("error");
  } finally {
    isSyncing = false;
  }
}

async function processMutation(mutation: PendingMutation): Promise<boolean> {
  const { action, leadId, payload } = mutation;

  let url = "";
  let method = "";
  let body: any = null;

  if (action === "update" && leadId !== undefined) {
    url = `/api/leads/${leadId}`;
    method = "PATCH";
    body = payload;
  } else if (action === "delete" && leadId !== undefined) {
    url = `/api/leads/${leadId}`;
    method = "DELETE";
  } else if (action === "bulk-delete") {
    url = "/api/leads";
    method = "DELETE";
    body = payload;
  } else {
    // Invalid action, drop it
    return false;
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (response.ok) {
    return true;
  }

  // If server returns 4xx client errors (e.g. 404, 400), we cannot recover.
  // We return false so it gets dropped.
  // If it's a 5xx server error, we throw so the loop stops and retries later.
  if (response.status >= 500) {
    throw new Error(`Server error during sync: ${response.statusText}`);
  }

  return false;
}

export function triggerSync(): void {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    syncImmediately();
  }, 5000); // 5-second debounce
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Lead,
  getLocalLeads,
  saveLocalLeads,
  updateLocalLead,
  deleteLocalLead,
  bulkDeleteLocalLeads,
  queueMutation,
} from "@/lib/client/db";
import { triggerSync } from "@/lib/client/sync";

// Helper to optimistically update all "leads" caches in TanStack Query
function updateLeadsCache(qc: any, updater: (leads: Lead[]) => Lead[]) {
  const queries = qc.getQueryCache().findAll({ queryKey: ["leads"] });
  queries.forEach((query: any) => {
    const queryKey = query.queryKey;
    qc.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      if (Array.isArray(oldData)) {
        return updater(oldData);
      }
      if (oldData.items && Array.isArray(oldData.items)) {
        return {
          ...oldData,
          items: updater(oldData.items),
        };
      }
      return oldData;
    });
  });
}

export function useLeadsQuery(queryString = "") {
  const qc = useQueryClient();
  const [localData, setLocalData] = useState<Lead[] | null>(null);

  // Load from IndexedDB on mount to support instant render & offline
  useEffect(() => {
    getLocalLeads().then((leads) => {
      if (leads && leads.length > 0) {
        setLocalData(leads);
      }
    });
  }, []);

  const queryKey = ["leads", queryString];
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/leads?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      
      // Save fresh data to local cache
      const items = data.items || [];
      if (items.length > 0) {
        await saveLocalLeads(items);
      }
      return data;
    },
    // Use IndexedDB data as placeholder data
    placeholderData: localData ? { items: localData } : undefined,
  });

  return query;
}

export function useOfflineUpdateLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Lead> }) => {
      // 1. Update browser DB first
      await updateLocalLead(id, updates);

      // 2. Queue mutation for online sync
      await queueMutation("update", id, updates);

      // 3. Trigger debounced sync check
      triggerSync();

      return { id, updates };
    },
    onMutate: async ({ id, updates }) => {
      // Optimistic UI updates
      await qc.cancelQueries({ queryKey: ["leads"] });
      updateLeadsCache(qc, (leads) =>
        leads.map((l) => (l.id === id ? { ...l, ...updates } : l))
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useOfflineDeleteLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // 1. Update browser DB first
      await deleteLocalLead(id);

      // 2. Queue mutation
      await queueMutation("delete", id);

      // 3. Trigger sync
      triggerSync();

      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      updateLeadsCache(qc, (leads) => leads.filter((l) => l.id !== id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useOfflineBulkDeleteLeads() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      // 1. Update browser DB first
      await bulkDeleteLocalLeads(ids);

      // 2. Queue mutation
      await queueMutation("bulk-delete", undefined, { ids });

      // 3. Trigger sync
      triggerSync();

      return ids;
    },
    onMutate: async (ids) => {
      const idsSet = new Set(ids);
      await qc.cancelQueries({ queryKey: ["leads"] });
      updateLeadsCache(qc, (leads) => leads.filter((l) => !idsSet.has(l.id)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

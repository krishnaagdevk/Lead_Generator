export interface Lead {
  id: number;
  name: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  websiteStatus: string;
  bestContact: string | null;
  pipelineStage: string;
  dealValue: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface PendingMutation {
  id?: number;
  action: "update" | "delete" | "bulk-delete";
  leadId?: number; // For single-lead mutations
  payload: any;
  timestamp: number;
}

const DB_NAME = "leadhunter-offline";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported on this platform"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains("leads")) {
        db.createObjectStore("leads", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_mutations")) {
        db.createObjectStore("pending_mutations", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

// ── Lead Operations ───────────────────────────────────────────────────────────

export async function getLocalLeads(): Promise<Lead[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("leads", "readonly");
      const store = transaction.objectStore("leads");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as Lead[]);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB error getting leads:", err);
    return [];
  }
}

export async function getLocalLead(id: number): Promise<Lead | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("leads", "readonly");
      const store = transaction.objectStore("leads");
      const request = store.get(id);

      request.onsuccess = () => resolve((request.result as Lead) || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`IndexedDB error getting lead ${id}:`, err);
    return null;
  }
}

export async function saveLocalLeads(leads: Lead[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("leads", "readwrite");
      const store = transaction.objectStore("leads");

      leads.forEach((lead) => {
        store.put(lead);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error("IndexedDB error saving leads:", err);
  }
}

export async function updateLocalLead(id: number, updates: Partial<Lead>): Promise<void> {
  try {
    const lead = await getLocalLead(id);
    if (!lead) return;

    const updatedLead = { ...lead, ...updates };
    await saveLocalLeads([updatedLead]);
  } catch (err) {
    console.error(`IndexedDB error updating lead ${id}:`, err);
  }
}

export async function deleteLocalLead(id: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("leads", "readwrite");
      const store = transaction.objectStore("leads");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`IndexedDB error deleting lead ${id}:`, err);
  }
}

export async function bulkDeleteLocalLeads(ids: number[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("leads", "readwrite");
      const store = transaction.objectStore("leads");

      ids.forEach((id) => {
        store.delete(id);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error("IndexedDB error bulk deleting leads:", err);
  }
}

// ── Mutation Queue Operations ──────────────────────────────────────────────────

export async function getPendingMutations(): Promise<PendingMutation[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("pending_mutations", "readonly");
      const store = transaction.objectStore("pending_mutations");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as PendingMutation[]);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB error getting mutations:", err);
    return [];
  }
}

export async function queueMutation(
  action: "update" | "delete" | "bulk-delete",
  leadId?: number,
  payload?: any
): Promise<void> {
  try {
    const db = await openDB();
    const mutations = await getPendingMutations();

    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction("pending_mutations", "readwrite");
      const store = transaction.objectStore("pending_mutations");

      // ── Optimization: Merging & Collapsing Mutations ──
      if (action === "update" && leadId !== undefined) {
        // If there's an existing update mutation for the same lead, merge them
        const existingUpdate = mutations.find((m) => m.action === "update" && m.leadId === leadId);
        if (existingUpdate) {
          existingUpdate.payload = { ...existingUpdate.payload, ...payload };
          existingUpdate.timestamp = Date.now();
          store.put(existingUpdate);
          transaction.oncomplete = () => resolve();
          return;
        }

        // If there is an existing delete mutation for this lead, ignore this update
        const existingDelete = mutations.find((m) => m.action === "delete" && m.leadId === leadId);
        if (existingDelete) {
          resolve();
          return;
        }
      } else if (action === "delete" && leadId !== undefined) {
        // If we are deleting a lead, we can drop any pending updates for this lead
        const updatesToDelete = mutations.filter((m) => m.action === "update" && m.leadId === leadId);
        for (const update of updatesToDelete) {
          if (update.id !== undefined) {
            store.delete(update.id);
          }
        }
      }

      const newMutation: PendingMutation = {
        action,
        leadId,
        payload,
        timestamp: Date.now(),
      };

      store.add(newMutation);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error("IndexedDB error queuing mutation:", err);
  }
}

export async function deletePendingMutation(id: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("pending_mutations", "readwrite");
      const store = transaction.objectStore("pending_mutations");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`IndexedDB error deleting mutation ${id}:`, err);
  }
}

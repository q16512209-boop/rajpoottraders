import { AppStore } from "./store";

const LOCAL_STORAGE_KEY = "rajpoot_live_db_snapshot_v1";

export interface SyncStatus {
  connected: boolean;
  lastSyncedAt?: string;
  isSyncing: boolean;
  error?: string;
}

let syncStatusListeners: ((status: SyncStatus) => void)[] = [];
let currentSyncStatus: SyncStatus = {
  connected: false,
  isSyncing: false,
};

export function subscribeToSyncStatus(cb: (status: SyncStatus) => void) {
  syncStatusListeners.push(cb);
  cb(currentSyncStatus);
  return () => {
    syncStatusListeners = syncStatusListeners.filter((l) => l !== cb);
  };
}

function updateStatus(newStatus: Partial<SyncStatus>) {
  currentSyncStatus = { ...currentSyncStatus, ...newStatus };
  syncStatusListeners.forEach((cb) => cb(currentSyncStatus));
}

// Asynchronously dispatch entity upsert to MongoDB & save to local cache
export async function syncEntityToCloud(collection: string, data: any, action: "UPSERT" | "DELETE" = "UPSERT") {
  if (typeof window === "undefined") return;

  // 1. Save local snapshot immediately
  saveLocalSnapshot();

  // 2. Push to MongoDB API
  try {
    updateStatus({ isSyncing: true });
    const res = await fetch("/api/db/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        collection,
        data,
      }),
    });

    const result = await res.json();
    if (result.success) {
      updateStatus({
        connected: true,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        error: undefined,
      });
    } else {
      updateStatus({
        connected: false,
        isSyncing: false,
        error: result.error || "Sync failed",
      });
    }
  } catch (err: any) {
    updateStatus({
      connected: false,
      isSyncing: false,
      error: err.message || "Network error while syncing",
    });
  }
}

// Push all store state to MongoDB in one go
export async function pushFullStoreToMongo(store: AppStore): Promise<{ success: boolean; error?: string; message?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Client-only" };

  try {
    updateStatus({ isSyncing: true });
    const fullState = store.exportFullState();
    const res = await fetch("/api/db/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "FULL_SYNC",
        fullStore: fullState,
      }),
    });

    const result = await res.json();
    if (result.success) {
      saveLocalSnapshot();
      updateStatus({
        connected: true,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        error: undefined,
      });
      return { success: true, message: result.message };
    } else {
      updateStatus({
        connected: false,
        isSyncing: false,
        error: result.error,
      });
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    updateStatus({
      connected: false,
      isSyncing: false,
      error: err.message,
    });
    return { success: false, error: err.message };
  }
}

// Pull fresh database snapshot from MongoDB and hydrate store
export async function pullStoreFromMongo(store: AppStore): Promise<{ success: boolean; error?: string; counts?: any }> {
  if (typeof window === "undefined") return { success: false, error: "Client-only" };

  try {
    updateStatus({ isSyncing: true });
    const res = await fetch("/api/db/sync", { method: "GET" });
    const result = await res.json();

    if (result.success && result.data) {
      store.importFullState(result.data);
      saveLocalSnapshot();
      updateStatus({
        connected: true,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        error: undefined,
      });
      return { success: true, counts: result.counts };
    } else {
      updateStatus({
        connected: false,
        isSyncing: false,
        error: result.error || "Failed to fetch from MongoDB",
      });
      return { success: false, error: result.error };
    }
  } catch (err: any) {
    updateStatus({
      connected: false,
      isSyncing: false,
      error: err.message,
    });
    return { success: false, error: err.message };
  }
}

// Save browser localStorage snapshot
export function saveLocalSnapshot() {
  if (typeof window === "undefined") return;
  try {
    const { store } = require("./store");
    const state = store.exportFullState();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore localStorage quota limits
  }
}

// Hydrate from localStorage on initial page load
export function loadLocalSnapshot(store: AppStore): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      store.importFullState(parsed);
      return true;
    }
  } catch (e) {
    console.warn("Could not load local snapshot:", e);
  }
  return false;
}

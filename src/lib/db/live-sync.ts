import { AppStore } from "./store";

const LOCAL_STORAGE_KEY = "rajpoot_live_db_snapshot_v1";
const PENDING_QUEUE_KEY = "rajpoot_pending_cloud_queue_v1";

export interface SyncStatus {
  connected: boolean;
  lastSyncedAt?: string;
  isSyncing: boolean;
  pendingQueueCount: number;
  error?: string;
}

let syncStatusListeners: ((status: SyncStatus) => void)[] = [];
let currentSyncStatus: SyncStatus = {
  connected: true,
  isSyncing: false,
  pendingQueueCount: 0,
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

// Clear all localStorage cache completely after successful cloud push
export function clearLocalStorageCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(PENDING_QUEUE_KEY);
    updateStatus({ pendingQueueCount: 0 });
    console.log("[LiveSync] LocalStorage cache emptied to prevent duplicates.");
  } catch (e) {}
}

// Live save directly to MongoDB
export async function syncEntityToCloud(collection: string, data: any, action: "UPSERT" | "DELETE" = "UPSERT") {
  if (typeof window === "undefined") return;

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
      // Empty localstorage after successful push to prevent duplicates
      clearLocalStorageCache();
    } else {
      updateStatus({
        connected: false,
        isSyncing: false,
        error: result.error,
      });
    }
  } catch (err: any) {
    updateStatus({
      connected: false,
      isSyncing: false,
      error: err.message,
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
      updateStatus({
        connected: true,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        error: undefined,
      });
      // Empty localstorage immediately on successful push
      clearLocalStorageCache();
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

// Live fetch directly from MongoDB and hydrate store
export async function pullStoreFromMongo(store: AppStore): Promise<{ success: boolean; error?: string; counts?: any }> {
  if (typeof window === "undefined") return { success: false, error: "Client-only" };

  try {
    updateStatus({ isSyncing: true });
    const res = await fetch("/api/db/sync", { method: "GET" });
    const result = await res.json();

    if (result.success && result.data) {
      store.importFullState(result.data);
      // Empty localstorage so memory holds clean live database state only
      clearLocalStorageCache();
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

// Auto-sync worker: fetches live MongoDB data on start and syncs periodically
let autoSyncInterval: any = null;
export function startBackgroundAutoSync(store: AppStore) {
  if (typeof window === "undefined") return;
  if (autoSyncInterval) return;

  // Clear any old stale localStorage immediately
  clearLocalStorageCache();

  // 1. Live Fetch from MongoDB immediately on load
  pullStoreFromMongo(store).catch(() => {});

  // 2. Poll every 15 seconds for live real-time sync across devices
  autoSyncInterval = setInterval(() => {
    pullStoreFromMongo(store).catch(() => {});
  }, 15000);
}

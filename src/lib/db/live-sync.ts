import { AppStore } from "./store";

export const OFFLINE_QUEUE_KEY = "offline_recovery_queue";

export interface SyncStatus {
  connected: boolean;
  lastSyncedAt?: string;
  isSyncing: boolean;
  pendingOfflineCount?: number;
  pendingQueueCount?: number;
  error?: string;
}

let syncStatusListeners: ((status: SyncStatus) => void)[] = [];
let currentSyncStatus: SyncStatus = {
  connected: true,
  isSyncing: false,
  pendingOfflineCount: 0,
  pendingQueueCount: 0,
};

export function getOfflineQueueCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function subscribeToSyncStatus(cb: (status: SyncStatus) => void) {
  syncStatusListeners.push(cb);
  currentSyncStatus.pendingOfflineCount = getOfflineQueueCount();
  cb(currentSyncStatus);
  return () => {
    syncStatusListeners = syncStatusListeners.filter((l) => l !== cb);
  };
}

export function updateStatus(newStatus: Partial<SyncStatus>) {
  currentSyncStatus = { ...currentSyncStatus, ...newStatus };
  currentSyncStatus.pendingOfflineCount = getOfflineQueueCount();
  currentSyncStatus.pendingQueueCount = currentSyncStatus.pendingOfflineCount;
  syncStatusListeners.forEach((cb) => cb(currentSyncStatus));
}

// Clear all local cache and pending buffers completely
export function clearLocalStorageCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("rajpoot_live_db_snapshot_v1");
    localStorage.removeItem("rajpoot_pending_cloud_queue_v1");
    localStorage.removeItem("rt_offline_queue");
    updateStatus({ pendingOfflineCount: getOfflineQueueCount() });
  } catch (e) {}
}

// 1-Click Cloud Sync Protocol for Offline Recovery Queue
export async function syncOfflineQueueToMongo(store?: AppStore): Promise<{
  success: boolean;
  message: string;
  syncedCount: number;
  duplicateCount?: number;
  totalAmountSynced?: number;
}> {
  if (typeof window === "undefined") {
    return { success: false, message: "Client-side only", syncedCount: 0 };
  }

  const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return { success: true, message: "Koi offline record baqi nahi hai.", syncedCount: 0 };
  }

  let queue: any[] = [];
  try {
    queue = JSON.parse(raw);
  } catch (e) {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return { success: false, message: "Invalid queue format.", syncedCount: 0 };
  }

  if (!Array.isArray(queue) || queue.length === 0) {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return { success: true, message: "Koi offline record baqi nahi hai.", syncedCount: 0 };
  }

  try {
    updateStatus({ isSyncing: true });
    const res = await fetch("/api/recovery/sync-offline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queue }),
    });

    const result = await res.json();

    if (result.success) {
      // 1. Completely WIPE the local offline buffer upon HTTP 200 OK
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      localStorage.removeItem("rt_offline_queue");

      updateStatus({
        connected: true,
        isSyncing: false,
        pendingOfflineCount: 0,
        lastSyncedAt: new Date().toISOString(),
        error: undefined,
      });

      // 2. Refresh store if provided
      if (store) {
        await pullStoreFromMongo(store);
      }

      return {
        success: true,
        message: result.message || "Tamam offline records MongoDB cloud par sync ho chukay hain.",
        syncedCount: result.syncedCount || 0,
        duplicateCount: result.duplicateCount || 0,
        totalAmountSynced: result.totalAmountSynced || 0,
      };
    } else {
      updateStatus({
        connected: false,
        isSyncing: false,
        error: result.error || "Offline sync failed",
      });
      return {
        success: false,
        message: result.error || "Sync failed",
        syncedCount: 0,
      };
    }
  } catch (err: any) {
    updateStatus({
      connected: false,
      isSyncing: false,
      error: err.message,
    });
    return {
      success: false,
      message: err.message || "Network error during sync",
      syncedCount: 0,
    };
  }
}

// Live save directly to MongoDB for single entity
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

  clearLocalStorageCache();

  pullStoreFromMongo(store).catch(() => {});

  autoSyncInterval = setInterval(() => {
    pullStoreFromMongo(store).catch(() => {});
  }, 15000);
}

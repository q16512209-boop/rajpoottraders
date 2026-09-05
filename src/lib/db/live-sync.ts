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
  connected: false,
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

// Queue management for offline / auto-retry resilience
function getPendingQueue(): { collection: string; data: any; action: string; timestamp: number }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function savePendingQueue(queue: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    updateStatus({ pendingQueueCount: queue.length });
  } catch (e) {}
}

function enqueuePendingItem(collection: string, data: any, action: "UPSERT" | "DELETE" = "UPSERT") {
  const queue = getPendingQueue();
  const id = data.id || data.planNumber || data.cnic || data.hash;
  // Remove existing duplicate for same id if already in queue
  const filtered = queue.filter((item) => (item.data.id || item.data.planNumber) !== id);
  filtered.push({ collection, data, action, timestamp: Date.now() });
  savePendingQueue(filtered);
}

// Process pending queue automatically in background
export async function processPendingQueue() {
  if (typeof window === "undefined") return;
  const queue = getPendingQueue();
  if (queue.length === 0) return;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      const res = await fetch("/api/db/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: item.action,
          collection: item.collection,
          data: item.data,
        }),
      });
      const result = await res.json();
      if (result.success) {
        // Remove item from queue
        const currentQ = getPendingQueue();
        const updatedQ = currentQ.filter((x) => x.timestamp !== item.timestamp);
        savePendingQueue(updatedQ);
        updateStatus({
          connected: true,
          lastSyncedAt: new Date().toISOString(),
          error: undefined,
        });
      } else {
        // Still not connected / auth error, break and retry on next interval
        break;
      }
    } catch (err) {
      break;
    }
  }
}

// Auto-sync entity to cloud (Runs on every add/edit anywhere in app)
export async function syncEntityToCloud(collection: string, data: any, action: "UPSERT" | "DELETE" = "UPSERT") {
  if (typeof window === "undefined") return;

  // 1. Save local snapshot immediately for 100% zero data loss
  saveLocalSnapshot();

  // 2. Add to pending queue
  enqueuePendingItem(collection, data, action);

  // 3. Immediately attempt push to MongoDB
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
      // Remove from pending queue
      const queue = getPendingQueue();
      const id = data.id || data.planNumber;
      const updatedQ = queue.filter((x) => (x.data.id || x.data.planNumber) !== id);
      savePendingQueue(updatedQ);

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
        error: result.error || "MongoDB syncing in queue",
      });
    }
  } catch (err: any) {
    updateStatus({
      connected: false,
      isSyncing: false,
      error: err.message || "Network offline, queued for auto-push",
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
      savePendingQueue([]);
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
      // Check if MongoDB actually has records
      const totalDocs = Object.values(result.counts || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0);
      if (Number(totalDocs) > 0) {
        store.importFullState(result.data);
        saveLocalSnapshot();
      } else {
        // If MongoDB is empty, automatically push local state to initialize cloud
        pushFullStoreToMongo(store);
      }

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
  } catch (e) {}
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

// Global Background Auto-Sync Worker (runs every 20 seconds in browser)
let autoSyncInterval: any = null;
export function startBackgroundAutoSync(store: AppStore) {
  if (typeof window === "undefined") return;
  if (autoSyncInterval) return;

  // 1. Initial pull on app launch
  pullStoreFromMongo(store).catch(() => {});

  // 2. Periodic queue processing and health ping
  autoSyncInterval = setInterval(() => {
    processPendingQueue().catch(() => {});
  }, 20000);
}

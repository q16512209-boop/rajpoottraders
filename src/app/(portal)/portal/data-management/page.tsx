"use client";

import React, { useState, useEffect } from "react";
import { store } from "@/lib/db/store";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  pushFullStoreToMongo,
  pullStoreFromMongo,
  subscribeToSyncStatus,
  SyncStatus,
} from "@/lib/db/live-sync";
import {
  Database,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CloudUpload,
  CloudDownload,
  Server,
  KeyRound,
  ShieldCheck,
  Check,
  Zap,
  Activity,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface MongoDiagnostic {
  connected: boolean;
  pingTimeMs: number;
  uriMasked: string;
  database: string;
  collections?: { name: string; count: number }[];
  error?: string;
}

export default function DataManagementPage() {
  const { currentTenant, currentUser } = useAuth();
  const [isClean, setIsClean] = useState(() => store.isCleanMode());
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // MongoDB Diagnostics
  const [dbStatus, setDbStatus] = useState<MongoDiagnostic | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ connected: false, isSyncing: false, pendingQueueCount: 0 });

  // Custom URI Update
  const [customUriInput, setCustomUriInput] = useState("");
  const [updatingUri, setUpdatingUri] = useState(false);

  // Action loaders
  const [pushingData, setPushingData] = useState(false);
  const [pullingData, setPullingData] = useState(false);

  const checkStatus = async () => {
    setCheckingDb(true);
    try {
      const res = await fetch("/api/db/status");
      const data = await res.json();
      setDbStatus(data.details);
    } catch (e: any) {
      setDbStatus({
        connected: false,
        pingTimeMs: 0,
        uriMasked: "mongodb+srv://...",
        database: "rajpoot_traders_db",
        error: e.message || "Failed to reach backend health endpoint",
      });
    } finally {
      setCheckingDb(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const unsub = subscribeToSyncStatus((s) => setSyncStatus(s));
    return () => unsub();
  }, []);

  const handleUpdateUri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUriInput.trim()) return;
    setUpdatingUri(true);
    setMsg(null);

    try {
      const res = await fetch("/api/db/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mongoUri: customUriInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({
          type: "success",
          text: "MongoDB Atlas connection updated and verified successfully! Your live database is now connected.",
        });
        setCustomUriInput("");
        checkStatus();
      } else {
        setMsg({
          type: "error",
          text: data.error || "Failed to verify MongoDB connection string. Please check username & password in Atlas.",
        });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Network error while testing MongoDB connection" });
    } finally {
      setUpdatingUri(false);
    }
  };

  const handlePushAllToMongo = async () => {
    setPushingData(true);
    setMsg(null);
    try {
      const res = await pushFullStoreToMongo(store);
      if (res.success) {
        setMsg({
          type: "success",
          text: "All local customers, installment plans, staff, and ledger records successfully pushed & saved to MongoDB Atlas cloud!",
        });
        checkStatus();
      } else {
        setMsg({
          type: "error",
          text: res.error || "Could not push data to MongoDB. Please check MongoDB connection status below.",
        });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message || "Error pushing data" });
    } finally {
      setPushingData(false);
    }
  };

  const handlePullAllFromMongo = async () => {
    setPullingData(true);
    setMsg(null);
    try {
      const res = await pullStoreFromMongo(store);
      if (res.success) {
        setMsg({
          type: "success",
          text: "Live database state successfully loaded and synced from MongoDB Atlas!",
        });
        checkStatus();
      } else {
        setMsg({
          type: "error",
          text: res.error || "Could not fetch data from MongoDB.",
        });
      }
    } catch (e: any) {
      setMsg({ type: "error", text: e.message || "Error fetching data" });
    } finally {
      setPullingData(false);
    }
  };

  const handleResetToClean = () => {
    if (confirm("Are you sure you want to clear demo data and start with a clean production database?")) {
      store.resetToCleanProduction(currentTenant.id);
      setIsClean(true);
      setMsg({
        type: "success",
        text: "Clean Production Slate Activated! You can now onboard real customers.",
      });
    }
  };

  const handleRestoreDemo = () => {
    if (confirm("Restore sample Pakistani demo dataset?")) {
      store.resetToDemoData();
      setIsClean(false);
      setMsg({
        type: "success",
        text: "Sample demo dataset restored successfully.",
      });
    }
  };

  const isSuperAdminOrOwner = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "OWNER";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-600 text-emerald-50 px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>MongoDB Atlas & Cloud Persistence</span>
            </span>
            <UrduSpeaker
              customText="مونگو ڈی بی کلاؤڈ ڈیٹا بیس کنٹرولر۔ یہاں سے آپ لائیو ڈیٹا بیس کا کنکشن چیک کر سکتے ہیں، نیا پاس ورڈ یا کنکشن سٹرنگ درج کر سکتے ہیں، اور تمام کھاتے کلاؤڈ پر محفوظ کر سکتے ہیں۔"
              size="sm"
              showLabel
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Database & Cloud Sync Controller
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            مونگو ڈی بی (MongoDB Atlas) کلاؤڈ ڈیٹا بیس کی لائیو ہم آہنگی اور سیٹنگز
          </p>
        </div>

        <button
          type="button"
          onClick={checkStatus}
          disabled={checkingDb}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all self-start sm:self-auto border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checkingDb ? "animate-spin" : ""}`} />
          <span>{checkingDb ? "Checking Connection..." : "Test Connection"}</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 animate-in fade-in ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : msg.type === "error"
              ? "bg-rose-50 text-rose-900 border-rose-300"
              : "bg-blue-50 text-blue-900 border-blue-300"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
          )}
          <span className="font-medium text-sm leading-relaxed">{msg.text}</span>
        </div>
      )}

      {/* Section 1: Live MongoDB Status & Diagnostics Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                dbStatus?.connected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>MongoDB Atlas Cloud Cluster</span>
                <span
                  className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                    dbStatus?.connected
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}
                >
                  {dbStatus?.connected ? "🟢 LIVE CONNECTED" : "🔴 AUTH / CONNECTION ERROR"}
                </span>
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {dbStatus?.uriMasked || "cluster0.uwu4cgq.mongodb.net"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Latency: {dbStatus?.pingTimeMs || 0} ms</span>
          </div>
        </div>

        {/* Error alert if authentication failed */}
        {dbStatus && !dbStatus.connected && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>MongoDB Atlas Authentication Notice (پاس ورڈ یا یوزر کی تصدیق درکار ہے)</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              MongoDB Atlas cluster returned: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold">{dbStatus.error}</code>.
            </p>
            <p className="text-slate-700 font-urdu leading-relaxed">
              اگر آپ نے MongoDB Atlas کنسول میں ڈیٹا بیس یوزر کا پاس ورڈ تبدیل کیا ہے یا نیا کلکٹر کنکشن بنایا ہے تو نیچے دیے گئے باکس میں نیا کنکشن سٹرنگ پیسٹ کر کے <strong>"Save & Test Connection"</strong> پر کلک کریں۔
            </p>
          </div>
        )}

        {/* Collection Counts Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>Live MongoDB Collections & Cloud Records</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Customers (گاہک)", count: store.getCustomers().length, icon: "👥" },
              { label: "Installment Plans (کھاتے)", count: store.getPlans().length, icon: "📋" },
              { label: "Products (پروڈکٹس)", count: store.getProducts().length, icon: "📦" },
              { label: "Ledger Audit Blocks", count: store.getLedgerChain().length, icon: "⛓️" },
              { label: "Route Zones (روٹ)", count: store.getRouteZones().length, icon: "📍" },
              { label: "Staff Users (سٹاف)", count: store.getUsers().length, icon: "🛡️" },
              { label: "Warranty Claims", count: store.getClaimRequests().length, icon: "🛠️" },
              { label: "Wallets / Tills", count: store.getWallets().length, icon: "💼" },
            ].map((col, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block">{col.label}</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{col.count}</span>
                </div>
                <span className="text-xl">{col.icon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2-Way Sync Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={handlePushAllToMongo}
            disabled={pushingData}
            className="p-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <CloudUpload className="w-5 h-5 text-emerald-200" />
              <div className="text-left">
                <span className="block font-black text-sm">
                  {pushingData ? "Pushing Data to Cloud..." : "Push All Data to MongoDB Cloud"}
                </span>
                <span className="block text-[11px] font-urdu font-normal text-emerald-100">
                  تمام کسٹمرز اور کھاتے مونگو ڈی بی کلاؤڈ پر محفوظ کریں
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handlePullAllFromMongo}
            disabled={pullingData}
            className="p-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <CloudDownload className="w-5 h-5 text-slate-300" />
              <div className="text-left">
                <span className="block font-black text-sm">
                  {pullingData ? "Loading from Cloud..." : "Fetch Fresh Data from MongoDB"}
                </span>
                <span className="block text-[11px] font-urdu font-normal text-slate-300">
                  کلاؤڈ سے تمام کھاتے اور ڈیٹا ریفریش کریں
                </span>
              </div>
            </div>
            <RefreshCw className={`w-4 h-4 text-slate-300 ${pullingData ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Section 2: Update Connection String Form (Super Admin & Owner) */}
      {isSuperAdminOrOwner && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-black text-slate-900">
                Update MongoDB Atlas Connection URI
              </h2>
            </div>
            <span className="text-xs font-urdu text-slate-500">کنکشن سٹرنگ یا پاس ورڈ تبدیل کریں</span>
          </div>

          <form onSubmit={handleUpdateUri} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                MongoDB Connection String (URI)
              </label>
              <input
                type="text"
                placeholder="mongodb+srv://username:password@cluster0.uwu4cgq.mongodb.net/rajpoot_traders_db?retryWrites=true&w=majority"
                value={customUriInput}
                onChange={(e) => setCustomUriInput(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-urdu">
                مثال: اگر آپ نے پاس ورڈ تبدیل کیا ہے تو نیا کنکشن سٹرنگ یہاں درج کر کے Save پر کلک کریں۔
              </p>
            </div>

            <button
              type="submit"
              disabled={updatingUri || !customUriInput.trim()}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{updatingUri ? "Testing & Saving Connection..." : "Verify & Save MongoDB Connection"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Section 3: Clean Mode vs Sandbox Demo Dataset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Option A: Start Fresh Clean Mode */}
        <div className="bg-white rounded-3xl border-2 border-emerald-600 p-6 sm:p-8 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Recommended for Live Shop
              </span>
              <Trash2 className="w-5 h-5 text-emerald-700" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Start Fresh (Clean Production Slate)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Wipes all dummy test customers and mock expenses. Initializes your empty production register ready for real showroom and field recovery operations.
            </p>
            <p className="text-xs font-urdu font-semibold text-emerald-800">
              ڈیمو ڈیٹا صاف کر کے اصل کسٹمرز کا اندراج شروع کریں۔
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleResetToClean}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              Clear Demo Data & Start Live Production
            </button>
          </div>
        </div>

        {/* Option B: Restore Sample Demo Dataset */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                Sandbox Mode
              </span>
              <RefreshCw className="w-5 h-5 text-slate-500" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Restore Sample Demo Data
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Loads comprehensive sample Pakistani records (Haier Inverter AC, Honda CD70, 5kW Solar, dual guarantors, short arrears test cases).
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleRestoreDemo}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
            >
              Restore Sample Demo Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

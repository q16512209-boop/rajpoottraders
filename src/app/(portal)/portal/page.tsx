"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatPhone, formatCNIC } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { QuickRecoveryModal } from "@/components/recovery/QuickRecoveryModal";
import {
  Wallet,
  Users,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Bike,
  Printer,
  ArrowRight,
  Plus,
  Upload,
  Database,
  Receipt,
  UserPlus,
  Search,
  Calendar,
  RefreshCw,
  Clock,
  Phone,
  Filter,
  Zap,
  MapPin,
  TrendingUp,
  Percent,
} from "lucide-react";
import {
  subscribeToSyncStatus,
  syncOfflineQueueToMongo,
  SyncStatus,
} from "@/lib/db/live-sync";

type StatusFilterType = "ALL" | "ACTIVE" | "COMPLETED" | "REPOSSESSED";

export default function PortalDashboard() {
  const router = useRouter();
  const { currentUser, currentTenant } = useAuth();

  // Redirect Super Admin immediately to business oversight
  useEffect(() => {
    if (currentUser && currentUser.role === "SUPER_ADMIN") {
      router.replace("/portal/admin/businesses");
    }
  }, [currentUser, router]);

  // State
  const [plans, setPlans] = useState(() => store.getPlans(currentTenant?.id));
  const [wallets, setWallets] = useState(() => store.getWallets(currentTenant?.id));
  const [customers, setCustomers] = useState(() => store.getCustomers(currentTenant?.id));
  const [routes, setRoutes] = useState(() => store.getRouteZones(currentTenant?.id));

  // Sync & Offline State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: true,
    isSyncing: false,
    pendingOfflineCount: 0,
  });
  const [syncToast, setSyncToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [selectedRoute, setSelectedRoute] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quick Recovery Modal State
  const [quickRecoveryOpen, setQuickRecoveryOpen] = useState(false);

  // Subscribe to live sync and offline queue updates
  useEffect(() => {
    const unsub = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return () => unsub();
  }, []);

  const refreshData = () => {
    if (!currentTenant) return;
    setPlans([...store.getPlans(currentTenant.id)]);
    setWallets([...store.getWallets(currentTenant.id)]);
    setCustomers([...store.getCustomers(currentTenant.id)]);
    setRoutes([...store.getRouteZones(currentTenant.id)]);
  };

  // Listen for storage events / quick recovery updates
  useEffect(() => {
    const handleStorage = () => refreshData();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [currentTenant]);

  if (!currentUser || !currentTenant) return null;

  const role = currentUser.role;

  // 1-Click Offline Sync Trigger
  const handleTriggerOfflineSync = async () => {
    const result = await syncOfflineQueueToMongo(store);
    refreshData();
    setSyncToast({
      type: result.success ? "success" : "error",
      message: result.message,
    });
    setTimeout(() => setSyncToast(null), 6000);
  };

  // Wallets
  const ownerPocket = wallets.find((w) => w.type === "OWNER_POCKET")?.balance || 0;
  const counterTill = wallets.find((w) => w.type === "COUNTER_TILL")?.balance || 0;
  const allFieldInTransit = wallets
    .filter((w) => w.type === "FIELD_IN_TRANSIT")
    .reduce((acc, curr) => acc + curr.balance, 0);

  // Calculations for Boss-Approved Top 4 Executive KPI Cards
  const totalKhatas = plans.length;
  const activeCount = plans.filter((p) => p.status === "ACTIVE").length;
  const completedCount = plans.filter(
    (p) => p.status === "COMPLETED" || p.status === "COMPLETED_EARLY_SETTLED"
  ).length;
  const repossessedCount = plans.filter(
    (p) => p.status === "DEFAULTED_REPOSSESSED" || p.status === "WRITTEN_OFF" || p.status === "DEFAULTED"
  ).length;

  // Financial Aggregate Totals
  let totalFinancedSum = 0;
  let totalRecoveredSum = 0;

  plans.forEach((plan) => {
    totalFinancedSum += plan.totalFinanced || 0;
    const paidInSchedule = (plan.schedule || []).reduce((acc, s) => acc + (s.amountPaid || 0), 0);
    const paidTotal = paidInSchedule + (plan.downPayment || 0);
    totalRecoveredSum += paidTotal;
  });

  const totalMarketOutstanding = Math.max(0, totalFinancedSum - totalRecoveredSum);
  const collectionEfficiency = totalFinancedSum > 0 ? ((totalRecoveredSum / totalFinancedSum) * 100).toFixed(1) : "0";

  // Filter Khatas matching Route, Status, and Search
  const filteredPlans = plans.filter((plan) => {
    // Route Filter
    if (selectedRoute !== "ALL" && plan.areaZone !== selectedRoute) {
      return false;
    }

    // Status Filter
    if (statusFilter === "ACTIVE" && plan.status !== "ACTIVE") return false;
    if (
      statusFilter === "COMPLETED" &&
      plan.status !== "COMPLETED" &&
      plan.status !== "COMPLETED_EARLY_SETTLED"
    )
      return false;
    if (
      statusFilter === "REPOSSESSED" &&
      plan.status !== "DEFAULTED_REPOSSESSED" &&
      plan.status !== "WRITTEN_OFF" &&
      plan.status !== "DEFAULTED"
    )
      return false;

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        (plan.khataNumber && plan.khataNumber.toLowerCase().includes(q)) ||
        (plan.customerName && plan.customerName.toLowerCase().includes(q)) ||
        (plan.customerPhone && plan.customerPhone.includes(q)) ||
        (plan.customerCnic && plan.customerCnic.includes(q)) ||
        (plan.planNumber && plan.planNumber.toLowerCase().includes(q)) ||
        (plan.areaZone && plan.areaZone.toLowerCase().includes(q)) ||
        (plan.productTitle && plan.productTitle.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP FLASHING OFFLINE SYNC BANNER */}
      {(syncStatus.pendingOfflineCount || 0) > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-4 rounded-3xl shadow-lg border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-emerald-800 rounded-xl font-black text-sm">
              {syncStatus.pendingOfflineCount || 0}
            </div>
            <div>
              <h4 className="font-extrabold text-sm tracking-wide">
                Pending Offline Recovery Records Detected!
              </h4>
              <p className="text-xs text-emerald-100 font-urdu">
                فیلڈ ریکوری کا ڈیٹا محفوظ ہے۔ 1-کلک سے لائیو کلاؤڈ پر منتقل کریں۔
              </p>
            </div>
          </div>
          <button
            onClick={handleTriggerOfflineSync}
            disabled={syncStatus.isSyncing}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-700 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
            <span>
              {syncStatus.isSyncing
                ? "Syncing to MongoDB Atlas..."
                : `🔄 Sync Pending Offline Data (${syncStatus.pendingOfflineCount || 0} Records)`}
            </span>
          </button>
        </div>
      )}

      {/* Sync Toast */}
      {syncToast && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            syncToast.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncToast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{syncToast.message}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-slate-400 hover:text-slate-700 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 2. EXECUTIVE HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-700/80 text-emerald-100 px-3 py-0.5 rounded-full border border-emerald-500/30">
              {currentTenant.name}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-900/60 text-amber-200 border-amber-600">
              {role === "OWNER" ? "Shop Owner (مالک)" : role === "BRANCH_MANAGER" ? "Branch Manager" : "Staff User"}
            </span>
            <UrduSpeaker customText={`خوش آمدید ${currentUser.name}۔ راجپوت ٹریڈرز چنیوٹ ڈائری ریکوری و کھاتہ پورٹل۔`} size="sm" showLabel />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight font-urdu">
            چنیوٹ ڈائری ریکوری و ماسٹر کھاتہ جات
          </h1>
          <p className="text-xs text-slate-300 font-urdu">
            کھاتہ نمبر فرسٹ سسٹم: تمام یومیہ وصولیاں، مارکیٹ بقایا جات اور بازاری روٹس ایک ہی سکرین پر۔
          </p>
        </div>

        {/* Quick Recovery Action in Banner */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={() => setQuickRecoveryOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-2xl text-xs font-black shadow-xl flex items-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span className="font-urdu text-sm">⚡ فوری ڈیلی ریکوری درج کریں</span>
          </button>

          <Link
            href="/portal/print/route-sheet"
            className="px-4 py-3 bg-slate-900/90 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-urdu">A4 ڈائری پرنٹ</span>
          </Link>
        </div>
      </div>

      {/* 3. TOP 4 EXECUTIVE RECOVERY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: کل درج کھاتے (Total Khatas) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-black uppercase tracking-wider">
            <span className="font-urdu text-sm text-slate-700">کل درج کھاتے (Total Khatas)</span>
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {totalKhatas}
            <span className="text-xs font-urdu font-bold text-slate-500 ml-2">اکاؤنٹس</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-urdu font-bold border-t border-slate-100">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
              جاری: {activeCount}
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              کلئیر: {completedCount}
            </span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
              مال واپس: {repossessedCount}
            </span>
          </div>
        </div>

        {/* Card 2: کل وصولی جو آ چکی ہے (Total Recovered) */}
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-3xl p-5 shadow-lg space-y-3 flex flex-col justify-between border border-emerald-500/40">
          <div className="flex items-center justify-between text-emerald-200 text-xs font-black uppercase tracking-wider">
            <span className="font-urdu text-sm text-emerald-100">کل وصولی جو آ چکی ہے (Total Recovered)</span>
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
          </div>
          <div className="text-3xl font-black text-amber-300 font-mono tracking-tight">
            {formatPKR(totalRecoveredSum)}
          </div>
          <p className="text-[11px] text-emerald-100 font-urdu border-t border-emerald-600/50 pt-1">
            ڈاؤن پیمنٹ بمع تمام موصول شدہ فیلڈ و کاؤنٹر اقساط
          </p>
        </div>

        {/* Card 3: مارکیٹ سے کل بقایا (Total Market Outstanding) */}
        <div className="bg-gradient-to-br from-rose-700 to-rose-950 text-white rounded-3xl p-5 shadow-lg space-y-3 flex flex-col justify-between border border-rose-500/40">
          <div className="flex items-center justify-between text-rose-200 text-xs font-black uppercase tracking-wider">
            <span className="font-urdu text-sm text-rose-100">مارکیٹ سے کل بقایا (Total Outstanding)</span>
            <AlertTriangle className="w-5 h-5 text-rose-300" />
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {formatPKR(totalMarketOutstanding)}
          </div>
          <p className="text-[11px] text-rose-100 font-urdu border-t border-rose-600/50 pt-1">
            مارکیٹ اور گاہکوں کے ذمہ واجب الوصول نیٹ بقایا رقم
          </p>
        </div>

        {/* Card 4: ریکوری کی شرح (Collection Efficiency %) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-black uppercase tracking-wider">
            <span className="font-urdu text-sm text-slate-700">ریکوری کی شرح (Efficiency)</span>
            <Percent className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-800 font-mono">
              {collectionEfficiency}%
            </span>
            <span className="text-xs font-bold text-slate-500">کامیاب وصولی</span>
          </div>
          <div className="space-y-1 border-t border-slate-100 pt-1">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, Number(collectionEfficiency)))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0%</span>
              <span>ہدف: 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CASH TILL & POCKET STRIP */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md text-xs">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-amber-400" />
          <span className="font-urdu font-bold text-slate-300">لائیو کیش سمری:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-urdu">جیب کیش (Owner Pocket):</span>
            <span className="text-amber-300 font-black">{formatPKR(ownerPocket)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-urdu">دکان دراز (Showroom Till):</span>
            <span className="text-emerald-400 font-black">{formatPKR(counterTill)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-urdu">فیلڈ بیگ (In-Transit):</span>
            <span className="text-cyan-400 font-black">{formatPKR(allFieldInTransit)}</span>
          </div>
        </div>
        <Link
          href="/portal/treasury"
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-[11px] transition-colors"
        >
          کھاتہ دیکھیں &rarr;
        </Link>
      </div>

      {/* 5. MASTER CHINIOT BAZAAR ROUTE & STATUS FILTERS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> کیفیت:
            </span>
            {(
              [
                { key: "ALL", label: "تمام کھاتے (All)", badge: totalKhatas },
                { key: "ACTIVE", label: "جاری کھاتے (Active)", badge: activeCount },
                { key: "COMPLETED", label: "مکمل کلئیر (Completed)", badge: completedCount },
                { key: "REPOSSESSED", label: "مال واپس (Wapsi)", badge: repossessedCount },
              ] as Array<{ key: StatusFilterType; label: string; badge: number }>
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === item.key
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    statusFilter === item.key ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-800"
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Local Chiniot Bazaar Route Filter */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600 max-w-[280px]"
            >
              <option value="ALL">تمام چنیوٹ روٹس و بازار ({plans.length} کھاتے)</option>
              {routes.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Real-time Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="کھاتہ نمبر (e.g. 14)، خریدار کا نام، ولدیت، موبائل نمبر، شناختی کارڈ یا پروڈکٹ سے تلاش کریں..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white rounded-2xl text-xs sm:text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* 6. MASTER KHATA RECOVERY TABLE (KHATA # FIRST) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>ماسٹر کھاتہ جات رجسٹر ({filteredPlans.length} ریکارڈز)</span>
            </h3>
            <p className="text-xs text-slate-500 font-urdu">
              کھاتہ نمبر، خریدار، کل قیمت، موصولی اور نیٹ بقایا کا مکمل کھاتہ۔
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickRecoveryOpen(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span className="font-urdu">⚡ فوری قسط درج کریں</span>
            </button>
            <Link
              href="/portal/customers/legacy-entry"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ نیا کھاتہ</span>
            </Link>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {filteredPlans.length === 0 ? (
            <div className="p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-800">کوئی کھاتہ موجود نہیں ہے۔</p>
                <p className="text-xs text-slate-500 font-urdu">
                  مطلوبہ فلٹر یا تلاش کے مطابق کوئی ریکارڈ نہیں ملا۔ نیا کھاتہ درج کرنے کے لیے اوپر دیے گئے بٹن پر کلک کریں۔
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Link
                  href="/portal/customers/legacy-entry"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ نیا گاہک / کھاتہ شامل کریں</span>
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 uppercase font-black tracking-wider text-[11px]">
                  {/* Column 1: MUST BE KHATA # */}
                  <th className="p-3.5 pl-5 w-24">کھاتہ #</th>
                  <th className="p-3.5">خریدار بمع ولدیت و فون</th>
                  <th className="p-3.5">دکان / پتہ / بازار</th>
                  <th className="p-3.5 text-right">کل رقم</th>
                  <th className="p-3.5 text-right">کل وصولی</th>
                  <th className="p-3.5 text-right">نیٹ بقایا</th>
                  <th className="p-3.5 text-center">کیفیت</th>
                  <th className="p-3.5 pr-5 text-right">فوری ایکشن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredPlans.map((plan) => {
                  const cust = customers.find((c) => c.id === plan.customerId);
                  const paidInSchedule = (plan.schedule || []).reduce(
                    (sum, s) => sum + (s.amountPaid || 0),
                    0
                  );
                  const planTotalPaid = paidInSchedule + (plan.downPayment || 0);
                  const planRemaining = Math.max(0, (plan.totalFinanced || 0) - planTotalPaid);

                  const isCompleted =
                    plan.status === "COMPLETED" ||
                    plan.status === "COMPLETED_EARLY_SETTLED" ||
                    planRemaining <= 0;
                  const isRepossessed =
                    plan.status === "DEFAULTED_REPOSSESSED" ||
                    plan.status === "WRITTEN_OFF" ||
                    plan.status === "DEFAULTED";

                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/90 transition-colors group">
                      {/* 1. Khata Number (Bold Gold Badge First Column) */}
                      <td className="p-3.5 pl-5">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-amber-400 text-slate-950 font-mono font-black text-xs sm:text-sm rounded-xl border border-amber-500 shadow-sm">
                          #{plan.khataNumber || plan.planNumber}
                        </span>
                      </td>

                      {/* 2. Customer Name & Father Name & Phone */}
                      <td className="p-3.5">
                        <div className="font-black text-slate-900 text-xs sm:text-sm">
                          {plan.customerName}
                          {cust?.fatherName ? (
                            <span className="text-slate-500 font-normal font-urdu ml-1.5">
                              ولد {cust.fatherName}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-700" />
                          <span>{formatPhone(plan.customerPhone)}</span>
                        </div>
                      </td>

                      {/* 3. Shop / Address / Bazaar */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 text-xs truncate max-w-[180px]">
                          {cust?.address || plan.areaZone}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold truncate max-w-[180px]">
                          {plan.areaZone} • {plan.productTitle}
                        </div>
                      </td>

                      {/* 4. Total Financed */}
                      <td className="p-3.5 text-right font-bold text-slate-700 text-xs sm:text-sm">
                        {formatPKR(plan.totalFinanced)}
                      </td>

                      {/* 5. Total Paid */}
                      <td className="p-3.5 text-right font-black text-emerald-800 text-xs sm:text-sm">
                        {formatPKR(planTotalPaid)}
                      </td>

                      {/* 6. Remaining Net Balance */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`font-black text-xs sm:text-sm ${
                            planRemaining > 0 ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          {formatPKR(planRemaining)}
                        </span>
                      </td>

                      {/* 7. Status Badges */}
                      <td className="p-3.5 text-center">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] rounded-full font-urdu">
                            مکمل کلئیر ✓
                          </span>
                        ) : isRepossessed ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 font-black text-[10px] rounded-full font-urdu">
                            مال واپس
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] rounded-full font-urdu">
                            جاری کھاتہ
                          </span>
                        )}
                      </td>

                      {/* 8. Quick Actions */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCompleted && !isRepossessed && (
                            <button
                              onClick={() => setQuickRecoveryOpen(true)}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] rounded-xl shadow-sm transition-all flex items-center gap-1"
                              title="فوری قسط وصول کریں"
                            >
                              <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                              <span className="font-urdu">فوری قسط</span>
                            </button>
                          )}
                          <Link
                            href={`/portal/print/receipt/${plan.id}`}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                            title="پرنٹ رسید"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          </Link>
                          <Link
                            href={`/portal/plans/${plan.id}`}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                            title="کھاتہ تفصیل"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 7. QUICK RECOVERY MODAL */}
      <QuickRecoveryModal
        isOpen={quickRecoveryOpen}
        onClose={() => setQuickRecoveryOpen(false)}
        onPaymentRecorded={() => refreshData()}
      />
    </div>
  );
}

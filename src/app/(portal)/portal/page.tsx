"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatCNIC, formatPhone, getStatusBadgeClass } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  Wallet,
  Users,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Bike,
  CreditCard,
  Printer,
  ShieldCheck,
  ArrowRight,
  Plus,
  Lock,
  DollarSign,
  Upload,
  Database,
  Receipt,
  UserPlus,
  ArrowRightLeft,
  MessageSquare,
  Wrench,
  CheckSquare,
  BarChart3,
  MapPin,
  ShoppingCart,
  Search,
  Calendar,
  RefreshCw,
  Clock,
  Phone,
  Filter,
} from "lucide-react";
import {
  subscribeToSyncStatus,
  syncOfflineQueueToMongo,
  SyncStatus,
  getOfflineQueueCount,
} from "@/lib/db/live-sync";

type DateFilterType = "TODAY" | "YESTERDAY" | "THIS_MONTH" | "ALL_TIME" | "CUSTOM";

export default function PortalDashboard() {
  const router = useRouter();
  const { currentUser, currentTenant } = useAuth();

  // State
  const [plans, setPlans] = useState(() => store.getPlans(currentTenant?.id));
  const [wallets, setWallets] = useState(() => store.getWallets(currentTenant?.id));
  const [customers, setCustomers] = useState(() => store.getCustomers(currentTenant?.id));
  const [handovers, setHandovers] = useState(() => store.getHandovers(currentTenant?.id));
  const [routes, setRoutes] = useState(() => store.getRouteZones(currentTenant?.id));

  // Redirect Super Admin immediately to business oversight
  useEffect(() => {
    if (currentUser && currentUser.role === "SUPER_ADMIN") {
      router.replace("/portal/admin/businesses");
    }
  }, [currentUser, router]);

  // Sync & Offline State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: true,
    isSyncing: false,
    pendingOfflineCount: 0,
  });
  const [syncToast, setSyncToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilterType>("TODAY");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quick Payment Modal
  const [payModalPlan, setPayModalPlan] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

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
    setHandovers([...store.getHandovers(currentTenant.id)]);
    setRoutes([...store.getRouteZones(currentTenant.id)]);
  };

  if (!currentUser || !currentTenant) return null;

  const role = currentUser.role;

  // Wallets
  const ownerPocket = wallets.find((w) => w.type === "OWNER_POCKET")?.balance || 0;
  const counterTill = wallets.find((w) => w.type === "COUNTER_TILL")?.balance || 0;
  const myFieldBag = wallets.find((w) => w.officerId === currentUser.id)?.balance || 0;
  const allFieldInTransit = wallets
    .filter((w) => w.type === "FIELD_IN_TRANSIT")
    .reduce((acc, curr) => acc + curr.balance, 0);
  const bankBalances = wallets
    .filter((w) => w.type === "DIGITAL_BANK")
    .reduce((acc, curr) => acc + curr.balance, 0);

  // Date Calculation Helpers
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const currentMonthPrefix = todayStr.substring(0, 7); // e.g. "2026-10"

  // Filter Installments matching Date, Route, and Search
  const filteredInstallmentRows: Array<{
    plan: any;
    inst: any;
    isOverdue: boolean;
    isDueToday: boolean;
  }> = [];

  plans.forEach((plan) => {
    // Route Filter
    if (selectedRoute !== "ALL" && plan.areaZone !== selectedRoute) {
      return;
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        plan.customerName?.toLowerCase().includes(q) ||
        plan.customerPhone?.includes(q) ||
        plan.customerCnic?.includes(q) ||
        plan.planNumber?.toLowerCase().includes(q) ||
        plan.khataNumber?.toLowerCase().includes(q) ||
        plan.productTitle?.toLowerCase().includes(q);
      if (!matchSearch) return;
    }

    // Check each installment in schedule
    plan.schedule.forEach((inst: any) => {
      let dateMatch = false;

      if (dateFilter === "TODAY") {
        dateMatch = inst.dueDate === todayStr || inst.paidDate === todayStr;
      } else if (dateFilter === "YESTERDAY") {
        dateMatch = inst.dueDate === yesterdayStr || inst.paidDate === yesterdayStr;
      } else if (dateFilter === "THIS_MONTH") {
        dateMatch = (inst.dueDate && inst.dueDate.startsWith(currentMonthPrefix)) || (inst.paidDate && inst.paidDate.startsWith(currentMonthPrefix));
      } else if (dateFilter === "ALL_TIME") {
        dateMatch = true;
      } else if (dateFilter === "CUSTOM") {
        const d = inst.paidDate || inst.dueDate;
        if (customStartDate && customEndDate) {
          dateMatch = d >= customStartDate && d <= customEndDate;
        } else if (customStartDate) {
          dateMatch = d >= customStartDate;
        } else {
          dateMatch = true;
        }
      }

      if (dateMatch) {
        filteredInstallmentRows.push({
          plan,
          inst,
          isOverdue: inst.status === "PENDING" && inst.dueDate < todayStr,
          isDueToday: inst.dueDate === todayStr,
        });
      }
    });
  });

  // Calculate Key KPI Summary Numbers
  const todayTarget = plans.reduce((acc, plan) => {
    const dueItems = plan.schedule.filter((s: any) => s.dueDate === todayStr);
    return acc + dueItems.reduce((sum: number, s: any) => sum + s.totalDue, 0);
  }, 0);

  const collectedToday = plans.reduce((acc, plan) => {
    const paidTodayItems = plan.schedule.filter((s: any) => s.paidDate === todayStr);
    return acc + paidTodayItems.reduce((sum: number, s: any) => sum + (s.amountPaid || 0), 0);
  }, 0);

  const remainingDueToday = Math.max(0, todayTarget - collectedToday);
  const totalArrears = plans.reduce((acc, curr) => acc + curr.accumulatedShortArrears, 0);

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

  // Open Receive Payment Modal
  const handleOpenReceive = (plan: any, isFull: boolean) => {
    setPayModalPlan(plan);
    const nextPending = plan.schedule.find((s: any) => s.status !== "PAID") || plan.schedule[0];
    const expected = nextPending ? nextPending.totalDue - (nextPending.amountPaid || 0) : plan.monthlyInstallment;
    setPayAmount(isFull ? expected : Math.round(expected / 2));
    setPayNotes("");
  };

  // Submit Quick Payment
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalPlan || payAmount <= 0) return;
    setIsProcessingPayment(true);

    try {
      const nextPending = payModalPlan.schedule.find((s: any) => s.status !== "PAID") || payModalPlan.schedule[0];
      const instNo = nextPending ? nextPending.installmentNo : 1;
      const res = store.recordInstallmentPayment({
        planId: payModalPlan.id,
        installmentNo: instNo,
        amountPaid: payAmount,
        collectedBy: currentUser.name,
        targetWalletType: "COUNTER_TILL",
        notes: payNotes || "Counter collection at showroom",
      });
      refreshData();
      setPayModalPlan(null);
      setSyncToast({
        type: "success",
        message: `ادائیگی موصول ہو گئی: ${formatPKR(payAmount)} برائے ${payModalPlan.customerName} (رسید #${res.receiptId})`,
      });
      setTimeout(() => setSyncToast(null), 5000);
    } catch (err: any) {
      setSyncToast({
        type: "error",
        message: err.message || "Payment processing failed.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP FLASHING OFFLINE SYNC BANNER */}
      {(syncStatus.pendingOfflineCount || 0) > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-lg border-2 border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
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

      {/* 2. HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-700/80 text-emerald-100 px-3 py-0.5 rounded-full border border-emerald-500/30">
              {currentTenant.name}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-900/60 text-amber-200 border-amber-600">
              {role === "SUPER_ADMIN" ? "Super Admin" : role === "OWNER" ? "Shop Owner" : "Branch Manager"}
            </span>
            <UrduSpeaker customText={`خوش آمدید ${currentUser.name}۔ راجپوت ٹریڈرز لائیو ریکوری و کھاتہ پورٹل۔`} size="sm" showLabel />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            All-in-One Live Management Dashboard
          </h1>
          <p className="text-xs text-slate-300 font-urdu">
            تمام کھاتہ جات، یومیہ وصولیاں، بقایا جات اور کیش ان ہینڈ ایک ہی سکرین پر۔
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 relative z-10">
          <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
            <Database className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="text-slate-400 block font-medium">MongoDB Atlas Cloud</span>
            <strong className="text-emerald-400 font-bold">Single Source of Truth ✓</strong>
          </div>
        </div>
      </div>

      {/* 3. TOP SUMMARY CARDS (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Today's Recovery Target */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Today's Target</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900">
            {formatPKR(todayTarget)}
          </div>
          <p className="text-[11px] text-slate-500 font-urdu">
            آج کے واجب الادا اقساط
          </p>
        </div>

        {/* Card 2: Collected Today */}
        <div className="bg-white rounded-2xl border-2 border-emerald-500 p-4 sm:p-5 shadow-sm space-y-1 bg-emerald-50/10">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Collected Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-900">
            {formatPKR(collectedToday)}
          </div>
          <p className="text-[11px] text-emerald-700 font-urdu">
            آج کی کل وصولی
          </p>
        </div>

        {/* Card 3: Remaining Due Today */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Remaining Due</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-900">
            {formatPKR(remainingDueToday)}
          </div>
          <p className="text-[11px] text-slate-500 font-urdu">
            آج کی باقی وصولی
          </p>
        </div>

        {/* Card 4: Short Arrears */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/20 p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold uppercase tracking-wider">
            <span>Total Arrears (بقایا)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-900">
            {formatPKR(totalArrears)}
          </div>
          <p className="text-[11px] text-rose-700 font-urdu">
            کل بقایا اقساط
          </p>
        </div>

        {/* Card 5: Cash in Owner Pocket & Till */}
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-4 sm:p-5 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span>Owner Pocket & Till</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900">
            {formatPKR(ownerPocket + counterTill)}
          </div>
          <p className="text-[11px] text-slate-500">
            Pocket: {formatPKR(ownerPocket)} | Till: {formatPKR(counterTill)}
          </p>
        </div>
      </div>

      {/* 4. MASTER QUICK-FILTER BAR */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Date Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Date:
            </span>
            {(["TODAY", "YESTERDAY", "THIS_MONTH", "ALL_TIME", "CUSTOM"] as DateFilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDateFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateFilter === type
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {type === "TODAY" && "Today (آج)"}
                {type === "YESTERDAY" && "Yesterday (کل)"}
                {type === "THIS_MONTH" && "This Month (اس ماہ)"}
                {type === "ALL_TIME" && "All Time"}
                {type === "CUSTOM" && "Custom Range"}
              </button>
            ))}
          </div>

          {/* Route Dropdown */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
            >
              <option value="ALL">All Routes & Zones ({plans.length} Accounts)</option>
              <option value="Route-A (Gulberg / Model Town)">Route-A (Gulberg / Model Town)</option>
              <option value="Route-B (Johar Town / Faisal Town)">Route-B (Johar Town / Faisal Town)</option>
              <option value="محلہ رحمن آباد و مسلم بازار چنیوٹ">محلہ رحمن آباد و مسلم بازار چنیوٹ</option>
              <option value="لاہور روڈ و کچہری بازار چنیوٹ">لاہور روڈ و کچہری بازار چنیوٹ</option>
              <option value="جھنگ روڈ و فیصل آباد روڈ چنیوٹ">جھنگ روڈ و فیصل آباد روڈ چنیوٹ</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers (if CUSTOM selected) */}
        {dateFilter === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="font-bold text-slate-600">From Date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none"
            />
            <span className="font-bold text-slate-600">To Date:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none"
            />
          </div>
        )}

        {/* Real-time Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Customer Name, Phone, CNIC, Plan # (RT-2026-001), Khata #, or Product..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* 5. LIVE ACTION TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              Live Installment Action Ledger ({filteredInstallmentRows.length} Records)
            </h3>
            <p className="text-xs text-slate-500 font-urdu">
              ایک کلک سے مکمل یا جزوی وصولی درج کریں اور فوری رسید پرنٹ کریں۔
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/portal/customers/legacy-entry"
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ New Khata</span>
            </Link>
            <Link
              href="/portal/recovery/route-sheet"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Route Sheet</span>
            </Link>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {filteredInstallmentRows.length === 0 ? (
            <div className="p-12 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-800">Filhal koi record mojood nahi hai.</p>
                <p className="text-xs text-slate-500 font-urdu">
                  فی الحال کوئی ریکارڈ موجود نہیں ہے۔ نیا کسٹمر شامل کرنے کے لیے اوپر دیے گئے بٹن پر کلک کریں۔
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Link
                  href="/portal/customers/legacy-entry"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Naya Customer / Khata Shamil Karein</span>
                </Link>
                <Link
                  href="/portal/import"
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Excel Bulk Migration</span>
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-extrabold tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5">Customer & Khata</th>
                  <th className="p-3.5">Product Details</th>
                  <th className="p-3.5">Route / Zone</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-right">Expected</th>
                  <th className="p-3.5 text-right">Paid</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstallmentRows.map(({ plan, inst, isOverdue, isDueToday }, idx) => (
                  <tr key={`${plan.id}-${inst.installmentNo}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    {/* Customer */}
                    <td className="p-3.5 pl-5">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {plan.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                        <span>{formatPhone(plan.customerPhone)}</span>
                        {plan.khataNumber && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-[10px]">
                            کھاتہ #{plan.khataNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800 truncate max-w-[180px]">
                        {plan.productTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {plan.planNumber} {plan.imeiSerial ? `• ${plan.imeiSerial}` : ""}
                      </div>
                    </td>

                    {/* Route */}
                    <td className="p-3.5">
                      <span className="text-[11px] font-medium text-slate-600 block truncate max-w-[140px]">
                        {plan.areaZone}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="p-3.5">
                      <div className={`font-bold text-[11px] ${isOverdue ? "text-rose-600 font-black" : isDueToday ? "text-emerald-700" : "text-slate-700"}`}>
                        {formatDate(inst.dueDate)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Inst #{inst.installmentNo}
                      </div>
                    </td>

                    {/* Expected */}
                    <td className="p-3.5 text-right font-black text-slate-900 text-xs sm:text-sm">
                      {formatPKR(inst.totalDue)}
                    </td>

                    {/* Paid */}
                    <td className="p-3.5 text-right font-bold text-emerald-800 text-xs sm:text-sm">
                      {formatPKR(inst.amountPaid || 0)}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getStatusBadgeClass(inst.status)}`}>
                        {inst.status === "PAID" ? "PAID ✓" : inst.status === "SHORT_PAID" ? "SHORT" : isOverdue ? "OVERDUE" : "PENDING"}
                      </span>
                    </td>

                    {/* Quick 1-Click Action Buttons */}
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inst.status !== "PAID" && (
                          <>
                            <button
                              onClick={() => handleOpenReceive(plan, true)}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all"
                              title="Receive Full Installment"
                            >
                              Receive Full
                            </button>
                            <button
                              onClick={() => handleOpenReceive(plan, false)}
                              className="px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] rounded-lg transition-all"
                              title="Receive Partial / Short"
                            >
                              Receive Short
                            </button>
                          </>
                        )}
                        <Link
                          href={`/portal/print/receipt/${plan.id}`}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                          title="Print Receipt Slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Print Slip</span>
                        </Link>
                        <Link
                          href={`/portal/plans/${plan.id}`}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                          title="View Full Khata Plan"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 6. QUICK OPERATIONS SHORTCUTS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Management & Recovery Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <Link
            href="/portal/recovery"
            className="p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all shadow-sm"
          >
            <Bike className="w-5 h-5 text-emerald-700" />
            <span>Mobile Recovery</span>
          </Link>
          <Link
            href="/portal/customers"
            className="p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl border border-amber-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all shadow-sm"
          >
            <Users className="w-5 h-5 text-amber-700" />
            <span>Customers & KYC</span>
          </Link>
          <Link
            href="/portal/plans"
            className="p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5 text-blue-700" />
            <span>All Khata Plans</span>
          </Link>
          <Link
            href="/portal/treasury"
            className="p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl border border-amber-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all shadow-sm"
          >
            <Wallet className="w-5 h-5 text-amber-700" />
            <span>Cash & Treasury</span>
          </Link>
          <Link
            href="/portal/import"
            className="p-3.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-2xl border border-purple-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all shadow-sm"
          >
            <Upload className="w-5 h-5 text-purple-700" />
            <span>Excel Migration</span>
          </Link>
        </div>
      </div>

      {/* 7. QUICK RECEIVE PAYMENT MODAL */}
      {payModalPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Receive Installment Payment
                </h3>
                <p className="text-xs text-slate-500 font-urdu">
                  کھاتہ: {payModalPlan.customerName} ({payModalPlan.planNumber})
                </p>
              </div>
              <button
                onClick={() => setPayModalPlan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Received Amount (PKR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-emerald-500 rounded-xl text-lg font-black text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Notes / Receipt Ref
                </label>
                <input
                  type="text"
                  placeholder="Optional notes or receipt details..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold">Target Wallet:</span>
                  <span>Chiniot Showroom Counter Till</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Recorded By:</span>
                  <span>{currentUser.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalPlan(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? "Processing..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

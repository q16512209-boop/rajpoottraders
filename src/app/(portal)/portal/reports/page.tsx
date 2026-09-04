"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate } from "@/lib/formatters";
import { IStaffTarget, User, InstallmentPlan } from "@/lib/db/types";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  CreditCard,
  Banknote,
  Users,
  AlertCircle,
  CheckCircle2,
  Package,
  RotateCcw,
  Plus,
  Trash2,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Printer,
  ShieldCheck,
  Clock,
  ChevronRight,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

export default function MasterReportsPage() {
  const { currentUser, currentTenant } = useAuth();

  // Date filters
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [filterPreset, setFilterPreset] = useState<"ALL" | "TODAY" | "7_DAYS" | "MONTH" | "CUSTOM">("MONTH");
  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Targets state
  const [targets, setTargets] = useState<IStaffTarget[]>(() => store.getStaffTargets(currentTenant.id));
  const [showAddTargetModal, setShowAddTargetModal] = useState(false);
  const [targetStaffId, setTargetStaffId] = useState("");
  const [targetType, setTargetType] = useState<"RECOVERY_AMOUNT" | "SALES_AMOUNT" | "NEW_CUSTOMERS">("RECOVERY_AMOUNT");
  const [targetValue, setTargetValue] = useState<number>(200000);
  const [targetPeriod, setTargetPeriod] = useState<"DAILY_5_DAYS" | "FIFTEEN_DAYS" | "MONTHLY" | "CUSTOM">("MONTHLY");
  const [targetStartDate, setTargetStartDate] = useState(firstDayOfMonthStr);
  const [targetEndDate, setTargetEndDate] = useState(todayStr);
  const [targetNotes, setTargetNotes] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const staffUsers = useMemo(() => store.getUsers(currentTenant.id), [currentTenant.id]);
  const allPlans = useMemo(() => store.getPlans(currentTenant.id), [currentTenant.id]);
  const allCustomers = useMemo(() => store.getCustomers(currentTenant.id), [currentTenant.id]);
  const allProducts = useMemo(() => store.getProducts(currentTenant.id), [currentTenant.id]);
  const allClaims = useMemo(() => store.getClaimRequests(currentTenant.id), [currentTenant.id]);
  const ledgerBlocks = useMemo(() => store.getLedgerChain(), []);

  if (!currentUser) return null;

  const isOwnerOrAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER" || currentUser.role === "BRANCH_MANAGER";
  if (!isOwnerOrAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2 max-w-lg mx-auto mt-10">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">Only Shop Owner, Super Admin, and Showroom Managers can view master reports and staff performance targets.</p>
      </div>
    );
  }

  // Handle Preset Clicks
  const handleApplyPreset = (preset: "ALL" | "TODAY" | "7_DAYS" | "MONTH") => {
    setFilterPreset(preset);
    const now = new Date();
    if (preset === "TODAY") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "7_DAYS") {
      const past7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().split("T")[0];
      setStartDate(past7);
      setEndDate(todayStr);
    } else if (preset === "MONTH") {
      setStartDate(firstDayOfMonthStr);
      setEndDate(todayStr);
    } else if (preset === "ALL") {
      setStartDate("2026-01-01");
      setEndDate(todayStr);
    }
  };

  // --- Analytical Calculations in Selected Date Window ---
  const reportData = useMemo(() => {
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

    // Plans created in date range
    const plansInPeriod = allPlans.filter((p) => {
      const pDate = new Date(p.startDate || p.endDate);
      return pDate >= startObj && pDate <= endObj;
    });

    const totalFinancedInPeriod = plansInPeriod.reduce((sum, p) => sum + p.totalFinanced, 0);
    const totalDownPaymentInPeriod = plansInPeriod.reduce((sum, p) => sum + p.downPayment, 0);

    // Installment collections in date range
    let totalRecoveryAmount = 0;
    let totalReceiptsCount = 0;
    const recoveryByOfficer: Record<string, { officerName: string; amount: number; count: number }> = {};

    allPlans.forEach((plan) => {
      plan.schedule.forEach((item) => {
        if (item.status === "PAID" && item.paidDate) {
          const pDate = new Date(item.paidDate);
          if (pDate >= startObj && pDate <= endObj) {
            totalRecoveryAmount += item.amountPaid;
            totalReceiptsCount += 1;
            const collector = item.collectedBy || plan.salesmanName || "General Recovery";
            if (!recoveryByOfficer[collector]) {
              recoveryByOfficer[collector] = { officerName: collector, amount: 0, count: 0 };
            }
            recoveryByOfficer[collector].amount += item.amountPaid;
            recoveryByOfficer[collector].count += 1;
          }
        }
      });
    });

    // Active customer arrears status (as of current date)
    const activePlans = allPlans.filter((p) => p.status === "ACTIVE");
    const smoothPlans = activePlans.filter((p) => (p.accumulatedShortArrears || 0) === 0);
    const shortArrearsPlans = activePlans.filter((p) => (p.accumulatedShortArrears || 0) > 0);
    const totalAccumulatedArrears = shortArrearsPlans.reduce((sum, p) => sum + p.accumulatedShortArrears, 0);

    // Claims in period
    const claimsInPeriod = allClaims.filter((c) => {
      const cDate = new Date(c.createdAt);
      return cDate >= startObj && cDate <= endObj;
    });
    const totalWapsiCount = claimsInPeriod.filter((c) => c.type === "RETURN_WAPSI").length;
    const totalClaimsCount = claimsInPeriod.filter((c) => c.type === "WARRANTY_CLAIM").length;
    const totalResolvedClaims = claimsInPeriod.filter((c) => c.status === "RESOLVED").length;

    // Stock condition breakdown
    const stockNew = allProducts.filter((p) => !p.condition || p.condition === "NEW").reduce((s, p) => s + (p.stockQuantity || 0), 0);
    const stockRefurbished = allProducts.filter((p) => p.condition === "USED_REFURBISHED").reduce((s, p) => s + (p.stockQuantity || 0), 0);
    const stockDefective = allProducts.filter((p) => p.condition === "DEFECTIVE_DAMAGED").reduce((s, p) => s + (p.stockQuantity || 0), 0);

    return {
      plansInPeriod,
      totalPlansCount: plansInPeriod.length,
      totalFinancedInPeriod,
      totalDownPaymentInPeriod,
      totalRecoveryAmount,
      totalReceiptsCount,
      recoveryByOfficer: Object.values(recoveryByOfficer),
      activePlansCount: activePlans.length,
      smoothPlansCount: smoothPlans.length,
      shortArrearsPlans,
      shortArrearsPlansCount: shortArrearsPlans.length,
      totalAccumulatedArrears,
      totalWapsiCount,
      totalClaimsCount,
      totalResolvedClaims,
      stockNew,
      stockRefurbished,
      stockDefective,
    };
  }, [allPlans, allClaims, allProducts, startDate, endDate]);

  // --- Target Creation ---
  const handleCreateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const staff = staffUsers.find((u) => u.id === targetStaffId);
      if (!staff) throw new Error("Please select a staff member.");

      const created = store.createStaffTarget(currentUser, {
        tenantId: currentTenant.id,
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        targetType,
        targetValue,
        periodType: targetPeriod,
        startDate: targetStartDate,
        endDate: targetEndDate,
        status: "ACTIVE",
        notes: targetNotes,
      });

      setTargets([...store.getStaffTargets(currentTenant.id)]);
      setShowAddTargetModal(false);
      setTargetNotes("");
      setMsg({ type: "success", text: `Performance target set for ${created.staffName} (${formatPKR(created.targetValue)}).` });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to set target" });
    }
  };

  const handleDeleteTarget = (id: string) => {
    if (confirm("Delete this staff performance target?")) {
      store.deleteStaffTarget(currentUser, id);
      setTargets([...store.getStaffTargets(currentTenant.id)]);
      setMsg({ type: "success", text: "Target deleted." });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Executive Analytics & Target Center
            </span>
            <UrduSpeaker customText="یہاں سے دکان کا مالک کسی بھی تاریخ کی سیلز، ریکوری، کسٹمرز کے شارٹ بقایا جات اور اسٹاف کے ٹارگٹس کی کارکردگی دیکھ سکتا ہے۔" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Owner Master Business Reports & Target Tracker
          </h1>
          <p className="text-xs text-slate-500">
            Real-time financial turnover, field recovery breakdown, customer short arrears, inventory condition, and staff KPI goals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => setShowAddTargetModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md text-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set Staff Target</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Box */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Select Report Date Range:</span>
          </span>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleApplyPreset("TODAY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterPreset === "TODAY" ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleApplyPreset("7_DAYS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterPreset === "7_DAYS" ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleApplyPreset("MONTH")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterPreset === "MONTH" ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleApplyPreset("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterPreset === "ALL" ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-500 font-bold whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setFilterPreset("CUSTOM");
              }}
              className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-500 font-bold whitespace-nowrap">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setFilterPreset("CUSTOM");
              }}
              className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none w-full sm:w-auto"
            />
          </div>

          <span className="text-[11px] text-slate-400 font-medium sm:ml-auto">
            Showing records from <strong>{formatDate(startDate)}</strong> to <strong>{formatDate(endDate)}</strong>
          </span>
        </div>
      </div>

      {/* Alert Messages */}
      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between ${
            msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-700 font-black">
            ✕
          </button>
        </div>
      )}

      {/* 4 Core Metric KPI Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Financed Sales */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">New Sales in Period</span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-slate-900 block">{formatPKR(reportData.totalFinancedInPeriod)}</strong>
            <span className="text-xs text-blue-700 font-bold block mt-0.5">
              {reportData.totalPlansCount} Contracts (Advance: {formatPKR(reportData.totalDownPaymentInPeriod)})
            </span>
          </div>
        </div>

        {/* 2. Total Recovery Collected */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recovery Collected</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-emerald-700 block">{formatPKR(reportData.totalRecoveryAmount)}</strong>
            <span className="text-xs text-emerald-800 font-bold block mt-0.5">
              {reportData.totalReceiptsCount} Verified Receipts in period
            </span>
          </div>
        </div>

        {/* 3. Short Arrears vs Smooth Accounts */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Short Arrears</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-amber-700 block">{formatPKR(reportData.totalAccumulatedArrears)}</strong>
            <span className="text-xs text-amber-900 font-bold block mt-0.5">
              {reportData.shortArrearsPlansCount} Accounts in Arrears ({reportData.smoothPlansCount} Smooth)
            </span>
          </div>
        </div>

        {/* 4. Stock & Returns Summary */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock & Returns</span>
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <strong className="text-2xl font-black text-slate-900 block">{reportData.stockNew + reportData.stockRefurbished} Units In Stock</strong>
            <span className="text-xs text-purple-700 font-bold block mt-0.5">
              {reportData.totalWapsiCount} Returns • {reportData.stockDefective} Defective
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Field Recovery Officer Performance Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Recovery Collected By Officer (In Selected Period)</span>
            </h3>
            <p className="text-xs text-slate-400">Total cash collected and verified receipts logged per field officer in this date range.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportData.recoveryByOfficer.map((rec) => (
            <div key={rec.officerName} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-sm font-black text-slate-900">{rec.officerName}</strong>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {rec.count} Receipts
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-slate-500 font-medium">Total Collected:</span>
                <strong className="text-lg font-black text-emerald-700">{formatPKR(rec.amount)}</strong>
              </div>
            </div>
          ))}

          {reportData.recoveryByOfficer.length === 0 && (
            <div className="col-span-full text-center py-6 text-xs text-slate-400">
              No installment payments logged during this date period.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Staff Performance Targets Tracker (5 Days, 15 Days, Monthly) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span>Staff Performance Targets & Achievement Goals</span>
            </h3>
            <p className="text-xs text-slate-400">Owner-assigned targets for Salesmen and Recovery Officers with progress tracking.</p>
          </div>
          <button
            onClick={() => setShowAddTargetModal(true)}
            className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Target</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((tgt) => {
            // Calculate actual progress based on target type
            let actualValue = 0;
            if (tgt.targetType === "RECOVERY_AMOUNT") {
              actualValue = reportData.totalRecoveryAmount;
            } else if (tgt.targetType === "SALES_AMOUNT") {
              actualValue = reportData.totalFinancedInPeriod;
            } else {
              actualValue = reportData.totalPlansCount;
            }

            const pct = Math.min(100, Math.round((actualValue / (tgt.targetValue || 1)) * 100));
            const isAhead = pct >= 80;

            return (
              <div
                key={tgt.id}
                className="p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-3xl shadow-sm space-y-3 relative group"
              >
                <button
                  onClick={() => handleDeleteTarget(tgt.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 transition-colors p-1"
                  title="Delete Target"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {tgt.periodType.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(tgt.startDate)} → {formatDate(tgt.endDate)}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">{tgt.staffName}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Goal: <strong>{tgt.targetType.replace("_", " ")}</strong> • Target: <strong>{tgt.targetType.includes("AMOUNT") ? formatPKR(tgt.targetValue) : `${tgt.targetValue} Customers`}</strong>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Achieved: {tgt.targetType.includes("AMOUNT") ? formatPKR(actualValue) : actualValue}</span>
                    <span className={isAhead ? "text-emerald-700" : "text-amber-700"}>{pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 100
                          ? "bg-emerald-600"
                          : pct >= 50
                          ? "bg-gradient-to-r from-blue-500 to-emerald-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {tgt.notes && <p className="text-[11px] text-slate-400 italic">&ldquo;{tgt.notes}&rdquo;</p>}
              </div>
            );
          })}

          {targets.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No staff performance targets configured yet. Click &quot;Add Target&quot; above to set KPI goals.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Detailed Khata Arrears & Customer Health Drill-Down */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span>Customer Khata Arrears & Health Roster ({reportData.shortArrearsPlansCount} Overdue / Short Accounts)</span>
            </h3>
            <p className="text-xs text-slate-400">List of all customers with pending short arrears and collection days for immediate field follow-up.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Khata / Contract</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile Phone</th>
                <th className="py-3 px-4">Route Zone</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-amber-900">Short Arrears</th>
                <th className="py-3 px-4">Installment Cycle</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {reportData.shortArrearsPlans.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    #{p.khataNumber || p.planNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.customerName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.customerPhone}</td>
                  <td className="py-3 px-4 text-slate-700">{p.areaZone}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{p.productTitle}</td>
                  <td className="py-3 px-4 font-black text-rose-700 text-sm">{formatPKR(p.accumulatedShortArrears)}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {formatPKR(p.monthlyInstallment)} ({p.collectionDayName || "Weekly"})
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                      SHORT ARREARS
                    </span>
                  </td>
                </tr>
              ))}

              {reportData.shortArrearsPlans.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 font-bold">
                    All customer accounts are 100% smooth and up-to-date! No short arrears found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Set Staff Performance Target */}
      {showAddTargetModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-300">
                  Performance Goal
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Assign Staff Target</h3>
              </div>
              <button onClick={() => setShowAddTargetModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTarget} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Staff Member *</label>
                <select
                  required
                  value={targetStaffId}
                  onChange={(e) => setTargetStaffId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                >
                  <option value="">-- Select Salesman or Recovery Officer --</option>
                  {staffUsers
                    .filter((u) => u.role === "FIELD_RECOVERY" || u.role === "BRANCH_MANAGER" || u.role === "OWNER")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Metric *</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="RECOVERY_AMOUNT">Installment Recovery (PKR)</option>
                    <option value="SALES_AMOUNT">New Sales Financed (PKR)</option>
                    <option value="NEW_CUSTOMERS">New Customers Count</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Value *</label>
                  <input
                    type="number"
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Period Cycle *</label>
                  <select
                    value={targetPeriod}
                    onChange={(e) => setTargetPeriod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="DAILY_5_DAYS">5 Days Sprint</option>
                    <option value="FIFTEEN_DAYS">15 Days (Mid-Month)</option>
                    <option value="MONTHLY">Full Month</option>
                    <option value="CUSTOM">Custom Date Window</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={targetStartDate}
                    onChange={(e) => setTargetStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={targetEndDate}
                    onChange={(e) => setTargetEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Goal Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Target recovery for Muslim Bazaar and Mohallah Rehman Abad route..."
                  value={targetNotes}
                  onChange={(e) => setTargetNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddTargetModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Set Performance Target</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

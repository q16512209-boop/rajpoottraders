"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatCNIC, getStatusBadgeClass } from "@/lib/formatters";
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
} from "lucide-react";

export default function PortalDashboard() {
  const { currentUser, currentTenant } = useAuth();

  if (!currentUser) return null;

  const wallets = store.getWallets(currentTenant.id);
  const plans = store.getPlans(currentTenant.id);
  const customers = store.getCustomers(currentTenant.id);
  const handovers = store.getHandovers(currentTenant.id);
  const expenses = store.getExpenses(currentTenant.id);
  const chainVerification = store.verifyChainIntegrity();

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

  const activePlansCount = plans.filter((p) => p.status === "ACTIVE").length;
  const totalArrears = plans.reduce((acc, curr) => acc + curr.accumulatedShortArrears, 0);
  const defaultersCount = customers.filter((c) => c.isDefaulter).length;
  const pendingHandovers = handovers.filter((h) => h.status === "PENDING");

  // Role Description Badges
  const roleDisplay: Record<string, { label: string; tier: string; desc: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin (Main Boss)", tier: "Tier 0", desc: "تمام برانچز کا مکمل مالیاتی و سیکیورٹی کنٹرول", color: "bg-purple-900/60 text-purple-200 border-purple-600" },
    OWNER: { label: "Shop Owner (دکان کا مالک)", tier: "Tier 1", desc: "اونر جیب والٹ، کاؤنٹر ٹل اور ہینڈ اوور کی منظوری", color: "bg-amber-900/60 text-amber-200 border-amber-600" },
    BRANCH_MANAGER: { label: "Branch Manager (برانچ مینیجر)", tier: "Tier 2", desc: "شو روم کاؤنٹر، کسٹمر KYC تصدیق اور نیا پلان", color: "bg-blue-900/60 text-blue-200 border-blue-600" },
    FIELD_RECOVERY: { label: "Field Recovery Officer (فیلڈ ریکوری)", tier: "Tier 3", desc: "موٹر سائیکل روٹ وصولی، واٹس ایپ رسید اور ہینڈ اوور", color: "bg-emerald-900/60 text-emerald-200 border-emerald-600" },
    CUSTOMER: { label: "Customer / Kharedar (خریدار)", tier: "Tier 4", desc: "اقساط کا شیڈول اور تصدیق شدہ رسیدیں", color: "bg-teal-900/60 text-teal-200 border-teal-600" },
  };

  const currentRoleInfo = roleDisplay[role] || roleDisplay.SUPER_ADMIN;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-700/80 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500/30">
              {currentTenant.name}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentRoleInfo.color}`}>
              {currentRoleInfo.tier}: {currentRoleInfo.label}
            </span>
            <UrduSpeaker customText={`خوش آمدید ${currentUser.name}۔ راجپوت ٹریڈرز پورٹل میں آپ کا رول ${currentRoleInfo.label} ہے۔`} size="sm" showLabel />
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            {currentRoleInfo.desc}
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3 relative z-10 self-start md:self-auto">
          <div className={`p-2 rounded-xl ${chainVerification.isValid ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"}`}>
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-xs">
            <span className="text-slate-400 block font-medium">SHA-256 Ledger Security</span>
            <strong className={`font-bold ${chainVerification.isValid ? "text-emerald-400" : "text-rose-400"}`}>
              {chainVerification.isValid ? "Audit Chain Intact ✓" : "Integrity Alert!"}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. ROLE SPECIFIC DASHBOARD VIEWS */}

      {/* VIEW A: FIELD RECOVERY OFFICER */}
      {role === "FIELD_RECOVERY" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                My In-Transit Cash Bag (میری وصولی)
              </span>
              <div className="text-2xl font-black text-slate-900">
                {formatPKR(myFieldBag)}
              </div>
              <p className="text-[11px] text-slate-500 font-urdu">
                آپ کے بیگ میں موجود کل نقد رقم
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Assigned Route Zone
              </span>
              <div className="text-lg font-bold text-emerald-700">
                {currentUser.assignedRouteZone || "Route-A (Gulberg / Model Town)"}
              </div>
              <p className="text-[11px] text-slate-500 font-urdu">
                مقرر کردہ فیلڈ علاقہ
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Total Route Visits
              </span>
              <div className="text-2xl font-black text-slate-900">
                {plans.length} Clients
              </div>
              <p className="text-[11px] text-slate-500 font-urdu">
                کل اقساط کے گاہک
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Field Recovery Fast Actions (فوری اقدامات)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <Link
                href="/portal/recovery"
                className="p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-200 font-bold flex flex-col items-center justify-center gap-2 text-center"
              >
                <Bike className="w-6 h-6 text-emerald-700" />
                <span>Mobile Recovery (وصولی لاگ کریں)</span>
              </Link>
              <Link
                href="/portal/recovery/route-sheet"
                className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 font-bold flex flex-col items-center justify-center gap-2 text-center"
              >
                <Printer className="w-6 h-6 text-slate-700" />
                <span>Print Route Sheet (روٹ لسٹ)</span>
              </Link>
              <Link
                href="/portal/handovers"
                className="p-4 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl border border-amber-200 font-bold flex flex-col items-center justify-center gap-2 text-center"
              >
                <CheckCircle2 className="w-6 h-6 text-amber-700" />
                <span>Submit Cash Handover (شام کا کیش)</span>
              </Link>
              <Link
                href="/portal/plans"
                className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 font-bold flex flex-col items-center justify-center gap-2 text-center"
              >
                <FileSpreadsheet className="w-6 h-6 text-slate-700" />
                <span>Client Portfolio (کھاتہ دیکھیں)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: CUSTOMER / KHAREDAR */}
      {role === "CUSTOMER" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Welcome to Your Rajpoot Traders Portal
            </h3>
            <p className="text-xs text-slate-600 font-urdu leading-relaxed">
              یہاں سے آپ اپنی تمام خریدی گئی اشیاء، ماہانہ اقساط کا شیڈول، ادا شدہ رقم اور سرکاری پی ڈی ایف رسیدیں دیکھ سکتے ہیں۔
            </p>
            <div className="pt-2">
              <Link
                href="/portal/customer-portal"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow"
              >
                <Receipt className="w-4 h-4" />
                <span>Go to My Installment Plans & Receipts</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: SUPER ADMIN / OWNER / BRANCH MANAGER */}
      {(role === "SUPER_ADMIN" || role === "OWNER" || role === "BRANCH_MANAGER") && (
        <>
          {/* Multi-Wallet Split Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-700" />
                Treasury Multi-Wallet Split
                <UrduSpeaker guideKey="TREASURY" size="sm" />
              </h2>
              {(role === "SUPER_ADMIN" || role === "OWNER") && (
                <Link href="/portal/treasury" className="text-xs font-bold text-emerald-700 hover:underline">
                  Manage Wallets →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {(role === "SUPER_ADMIN" || role === "OWNER") && (
                <div className="bg-white rounded-2xl border-2 border-amber-200 p-4 sm:p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Owner Pocket Wallet
                    </span>
                    <span className="p-1.5 bg-amber-50 rounded-lg text-amber-700 font-bold text-[11px]">
                      Physical
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {formatPKR(ownerPocket)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-urdu">
                    مالکان کے پاس موجود فزیکل کیش
                  </p>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Counter Till
                  </span>
                  <span className="p-1.5 bg-blue-50 rounded-lg text-blue-700 font-bold text-[11px]">
                    Showroom
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {formatPKR(counterTill)}
                </div>
                <p className="text-[11px] text-slate-500 font-urdu">
                  دکان کاؤنٹر کی کل وصولی
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Field In-Transit Bag
                  </span>
                  <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 font-bold text-[11px]">
                    Recovery Bags
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {formatPKR(allFieldInTransit)}
                </div>
                <p className="text-[11px] text-slate-500 font-urdu">
                  فیلڈ ریکوری افسران کا کیش
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Bank & Digital
                  </span>
                  <span className="p-1.5 bg-purple-50 rounded-lg text-purple-700 font-bold text-[11px]">
                    Meezan & Jazz
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {formatPKR(bankBalances)}
                </div>
                <p className="text-[11px] text-slate-500 font-urdu">
                  بینک اور جاز کیش اکاؤنٹ
                </p>
              </div>
            </div>
          </div>

          {/* Operations KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Active Plans</span>
                <strong className="text-base sm:text-xl font-bold text-slate-900">{activePlansCount} Plans</strong>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Short Arrears</span>
                <strong className="text-base sm:text-xl font-bold text-amber-700">{formatPKR(totalArrears)}</strong>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Defaulter Radar</span>
                <strong className="text-base sm:text-xl font-bold text-rose-700">{defaultersCount} Flagged</strong>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Handovers</span>
                <strong className="text-base sm:text-xl font-bold text-blue-700">{pendingHandovers.length} Pending</strong>
              </div>
            </div>
          </div>

          {/* Fast Action Workflows */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
                Fast Action Workflows ({role})
              </h3>
              <span className="text-xs text-slate-400 font-urdu">فوری اقدامات</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
              <Link
                href="/portal/plans/new"
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-2xl border border-slate-200 font-bold transition-all text-center group"
              >
                <Plus className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="truncate">New Plan</span>
                <UrduSpeaker guideKey="NEW_PLAN" size="sm" />
              </Link>

              <Link
                href="/portal/import"
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-900 text-emerald-900 rounded-2xl border border-emerald-300 font-bold transition-all text-center group"
              >
                <Upload className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
                <span className="truncate">Excel Import</span>
                <UrduSpeaker guideKey="IMPORT_EXCEL" size="sm" />
              </Link>

              <Link
                href="/portal/customers/new"
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-2xl border border-slate-200 font-bold transition-all text-center group"
              >
                <Users className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="truncate">Add Customer</span>
                <UrduSpeaker guideKey="CUSTOMER_KYC" size="sm" />
              </Link>

              {(role === "SUPER_ADMIN" || role === "OWNER") && (
                <Link
                  href="/portal/users"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-2xl border border-purple-200 font-bold transition-all text-center group"
                >
                  <UserPlus className="w-5 h-5 text-purple-700 group-hover:scale-110 transition-transform" />
                  <span className="truncate">Manage Staff</span>
                </Link>
              )}

              <Link
                href="/portal/handovers"
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-2xl border border-slate-200 font-bold transition-all text-center group"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="truncate">Handover Queue</span>
                <UrduSpeaker guideKey="HANDOVER" size="sm" />
              </Link>

              <Link
                href="/portal/expenses"
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-2xl border border-slate-200 font-bold transition-all text-center group"
              >
                <DollarSign className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="truncate">Expenses</span>
                <UrduSpeaker guideKey="EXPENSE" size="sm" />
              </Link>
            </div>
          </div>

          {/* Active Plans Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Active Installment Portfolios & Arrears
                </h3>
                <p className="text-xs text-slate-500 font-urdu">
                  تمام فعال اقساط، بقایا رقم اور کسٹمر کھاتہ
                </p>
              </div>
              <Link href="/portal/plans" className="text-xs font-bold text-emerald-700 hover:underline">
                All Plans ({plans.length}) →
              </Link>
            </div>

            {plans.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
                <p className="font-bold text-slate-700">کوئی فعال قسط موجود نہیں ہے (Clean Production Slate)</p>
                <p>آپ نیا پلان بنا سکتے ہیں یا ایکسل سے پرانا ڈیٹا امپورٹ کر سکتے ہیں۔</p>
                <div className="pt-2 flex justify-center gap-3">
                  <Link href="/portal/plans/new" className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold">
                    Create New Plan
                  </Link>
                  <Link href="/portal/import" className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold">
                    Import from Excel
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                      <th className="py-3 px-4">Plan #</th>
                      <th className="py-3 px-4">Kharedar (Customer)</th>
                      <th className="py-3 px-4">Product / Serial</th>
                      <th className="py-3 px-4">Monthly Due</th>
                      <th className="py-3 px-4">Short Arrears</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <Link href={`/portal/plans/${plan.id}`} className="hover:text-emerald-700">
                            {plan.planNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <strong className="text-slate-900 block">{plan.customerName}</strong>
                          <span className="text-slate-400 font-mono text-[11px]">{formatCNIC(plan.customerCnic)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block truncate max-w-[180px]">{plan.productTitle}</span>
                          <span className="text-slate-400 font-mono text-[10px]">IMEI: {plan.imeiSerial}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatPKR(plan.monthlyInstallment)}
                        </td>
                        <td className="py-3 px-4">
                          {plan.accumulatedShortArrears > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {formatPKR(plan.accumulatedShortArrears)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Rs. 0</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(plan.status)}`}>
                            {plan.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Link
                            href={`/portal/plans/${plan.id}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px]"
                          >
                            Manage
                          </Link>
                          <Link
                            href={`/portal/print/contract/${plan.id}`}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px]"
                          >
                            Legal Stamp
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
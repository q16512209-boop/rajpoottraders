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
  Wrench,
  CheckSquare,
  BarChart3,
  MapPin,
  ShoppingCart,
} from "lucide-react";

export default function PortalDashboard() {
  const { currentUser, currentTenant } = useAuth();

  if (!currentUser) return null;

  const wallets = store.getWallets(currentTenant.id);
  const plans = store.getPlans(currentTenant.id);
  const customers = store.getCustomers(currentTenant.id);
  const handovers = store.getHandovers(currentTenant.id);
  const expenses = store.getExpenses(currentTenant.id);
  const claims = store.getClaimRequests(currentTenant.id);
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
  const pendingClaims = claims.filter((c) => c.status === "PENDING_APPROVAL").length;

  // Role Description Badges in English
  const roleDisplay: Record<string, { label: string; tier: string; desc: string; color: string }> = {
    SUPER_ADMIN: { label: "Super Admin", tier: "Tier 0", desc: "Complete multi-branch financial oversight & blockchain security control", color: "bg-purple-900/60 text-purple-200 border-purple-600" },
    OWNER: { label: "Shop Owner", tier: "Tier 1", desc: "Owner pocket treasury, counter till reconciliation, and handover approvals", color: "bg-amber-900/60 text-amber-200 border-amber-600" },
    BRANCH_MANAGER: { label: "Branch Manager", tier: "Tier 2", desc: "Showroom counter operations, customer KYC verification, and plan setup", color: "bg-blue-900/60 text-blue-200 border-blue-600" },
    FIELD_RECOVERY: { label: "Field Recovery Officer", tier: "Tier 3", desc: "Motorcycle route collections, receipts, customer registration, and cash handovers", color: "bg-emerald-900/60 text-emerald-200 border-emerald-600" },
    CUSTOMER: { label: "Customer", tier: "Tier 4", desc: "Installment schedule and verified payment receipts", color: "bg-teal-900/60 text-teal-200 border-teal-600" },
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
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                My In-Transit Cash Bag
              </span>
              <div className="text-2xl font-black text-slate-900">
                {formatPKR(myFieldBag)}
              </div>
              <p className="text-[11px] text-slate-500">
                Current unhanded collection cash
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Assigned Route Zone
              </span>
              <div className="text-base font-bold text-emerald-700">
                {currentUser.assignedRouteZone || "Chiniot Main Center"}
              </div>
              <p className="text-[11px] text-slate-500">
                Primary recovery route
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Total Route Visits
              </span>
              <div className="text-2xl font-black text-slate-900">
                {plans.length} Clients
              </div>
              <p className="text-[11px] text-slate-500">
                Active installment accounts
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-5 shadow-sm space-y-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                Warranty & Returns
              </span>
              <div className="text-2xl font-black text-amber-900">
                {pendingClaims} Pending
              </div>
              <p className="text-[11px] text-slate-500">
                Active product claims
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Field Recovery Fast Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <Link
                href="/portal/recovery"
                className="p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all"
              >
                <Bike className="w-6 h-6 text-emerald-700" />
                <span>Mobile Recovery</span>
              </Link>
              <Link
                href="/portal/customers/legacy-entry"
                className="p-4 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all"
              >
                <UserPlus className="w-6 h-6 text-blue-700" />
                <span>Register Customer</span>
              </Link>
              <Link
                href="/portal/claims"
                className="p-4 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl border border-amber-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all"
              >
                <Wrench className="w-6 h-6 text-amber-700" />
                <span>Claim & Return</span>
              </Link>
              <Link
                href="/portal/recovery/route-sheet"
                className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all"
              >
                <Printer className="w-6 h-6 text-slate-700" />
                <span>Route Sheets</span>
              </Link>
              <Link
                href="/portal/handovers"
                className="p-4 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl border border-amber-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all"
              >
                <CheckCircle2 className="w-6 h-6 text-amber-700" />
                <span>Cash Handover</span>
              </Link>
              <Link
                href="/portal/plans"
                className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 font-bold flex flex-col items-center justify-center gap-2 text-center transition-all"
              >
                <FileSpreadsheet className="w-6 h-6 text-slate-700" />
                <span>Client Portfolio</span>
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
              Welcome to Your Customer Account
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              View your active installment plans, upcoming schedule dates, past payments, and download official stamp paper agreements and receipts.
            </p>
            <div className="pt-2">
              <Link
                href="/portal/customer-portal"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow"
              >
                <Receipt className="w-4 h-4" />
                <span>View My Plans & Receipts</span>
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
                  <p className="text-[11px] text-slate-500">
                    Physical liquidity held by shop owners
                  </p>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Counter Till Drawer
                  </span>
                  <span className="p-1.5 bg-blue-50 rounded-lg text-blue-700 font-bold text-[11px]">
                    Showroom
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {formatPKR(counterTill)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Showroom cash for advance & counter installments
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Field in-Transit Bags
                  </span>
                  <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 font-bold text-[11px]">
                    Routes
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {formatPKR(allFieldInTransit)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Total recovery cash on motorcycles
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Corporate Bank Balances
                  </span>
                  <span className="p-1.5 bg-purple-50 rounded-lg text-purple-700 font-bold text-[11px]">
                    Digital
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {formatPKR(bankBalances)}
                </div>
                <p className="text-[11px] text-slate-500">
                  Online bank accounts
                </p>
              </div>
            </div>
          </div>

          {/* Quick Operations Strip */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700">
              Quick Operations & Shortcuts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
              <Link
                href="/portal/reports"
                className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-2xl border border-purple-200 font-bold flex flex-col items-center justify-center gap-1.5 text-center transition-all shadow-sm"
              >
                <BarChart3 className="w-5 h-5 text-purple-700" />
                <span>Reports & Targets</span>
              </Link>
              <Link
                href="/portal/routes"
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-200 font-bold flex flex-col items-center justify-center gap-1.5 text-center transition-all shadow-sm"
              >
                <MapPin className="w-5 h-5 text-emerald-700" />
                <span>Custom Routes</span>
              </Link>
              <Link
                href="/portal/orders"
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 font-bold flex flex-col items-center justify-center gap-1.5 text-center transition-all shadow-sm"
              >
                <ShoppingCart className="w-5 h-5 text-blue-700" />
                <span>Field Orders</span>
              </Link>
              <Link
                href="/portal/customers/legacy-entry"
                className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl border border-amber-200 font-bold flex flex-col items-center justify-center gap-1.5 text-center transition-all shadow-sm"
              >
                <UserPlus className="w-5 h-5 text-amber-700" />
                <span>Old Khata Entry</span>
              </Link>
              <Link
                href="/portal/claims"
                className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-900 rounded-2xl border border-rose-200 font-bold flex flex-col items-center justify-center gap-1.5 text-center transition-all shadow-sm"
              >
                <Wrench className="w-5 h-5 text-rose-700" />
                <span>Claims & Wapsi</span>
              </Link>
              <Link
                href="/portal/recovery"
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-200 font-bold flex flex-col items-center justify-center gap-1.5 text-center transition-all shadow-sm"
              >
                <Bike className="w-5 h-5 text-emerald-700" />
                <span>Field Recovery</span>
              </Link>
              <Link
                href="/portal/expenses"
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-2xl border border-slate-200 font-bold flex flex-col items-center justify-center gap-1.5 text-center transition-all shadow-sm"
              >
                <DollarSign className="w-5 h-5 text-slate-700" />
                <span>Add Expense</span>
              </Link>
              <Link
                href="/portal/handovers"
                className="p-3 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-2xl border border-teal-200 font-bold flex flex-col items-center justify-center gap-1.5 text-center transition-all shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5 text-teal-700" />
                <span>Cash Handovers</span>
              </Link>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Active Installment Portfolio
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {activePlansCount} Contracts
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">
                On-schedule repayment accounts
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Accumulated Short Arrears
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-600">
                {formatPKR(totalArrears)}
              </div>
              <p className="text-[11px] text-slate-500">
                Partial payment arrears
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Defaulter Radar
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-700">
                {defaultersCount} Flagged
              </div>
              <p className="text-[11px] text-slate-500">
                Household & Guarantor cross-checks
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Handovers
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-600">
                {pendingHandovers.length} Requests
              </div>
              <p className="text-[11px] text-slate-500">
                Awaiting showroom approval
              </p>
            </div>
          </div>

          {/* Recent Plans Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Recent Installment Agreements
                </h3>
                <p className="text-xs text-slate-500">
                  Latest hire-purchase accounts and ledger balances
                </p>
              </div>
              <Link href="/portal/plans" className="text-xs font-bold text-emerald-700 hover:underline">
                View All Plans →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-2.5 px-3">Contract / Khata</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Product Item</th>
                    <th className="py-2.5 px-3">Terms & Installment</th>
                    <th className="py-2.5 px-3">Arrears</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plans.slice(0, 5).map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono">
                        <strong className="text-slate-900 block">{plan.planNumber}</strong>
                        {plan.khataNumber && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            Khata #{plan.khataNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-800 block">{plan.customerName}</strong>
                        <span className="text-slate-400 font-mono text-[11px]">{plan.customerPhone}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 block">{plan.productTitle}</span>
                        {plan.salesmanName && (
                          <span className="text-[10px] text-slate-400">Salesman: {plan.salesmanName}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {formatPKR(plan.monthlyInstallment)} / {plan.installmentFrequency || "Month"}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {plan.accumulatedShortArrears > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {formatPKR(plan.accumulatedShortArrears)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">Rs. 0</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(plan.status)}`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/portal/plans/${plan.id}`}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                        >
                          View Ledger
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

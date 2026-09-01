"use client";

import React from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatCNIC, getStatusBadgeClass } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { Receipt, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function CustomerPortalPage() {
  const { currentTenant, currentUser } = useAuth();
  const plans = store.getPlans(currentTenant.id);
  // Filter for customer's plans
  const myPlans = plans.filter((p) => p.customerName.includes("Usman") || p.customerId === currentUser.customerId);
  const activePlan = myPlans[0] || plans[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-700 text-emerald-100 px-3 py-1 rounded-full">
            Tier 4: Kharedar Self-Service Portal
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">
          Welcome, {currentUser.name}
        </h1>
        <p className="text-xs text-emerald-200">
          راجپوت ٹریڈرز کا محفوظ کسٹمر پورٹل — اپنی اقساط اور تصدیقی رسیدیں دیکھیں
        </p>
      </div>

      {activePlan && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                Plan #{activePlan.planNumber}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {activePlan.productTitle}
              </h2>
            </div>
            <Link
              href={`/portal/print/receipt/${activePlan.id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
            >
              <Receipt className="w-4 h-4" />
              <span>Download Official Payment Receipt</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block">Monthly Due</span>
              <strong className="text-base text-slate-900">{formatPKR(activePlan.monthlyInstallment)}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block">Pending Short Arrears</span>
              <strong className={`text-base font-bold ${activePlan.accumulatedShortArrears > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                {formatPKR(activePlan.accumulatedShortArrears)}
              </strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block">Down Payment Paid</span>
              <strong className="text-base text-slate-900">{formatPKR(activePlan.downPayment)}</strong>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block">Status</span>
              <strong className="text-base text-emerald-700 font-bold">{activePlan.status}</strong>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Your Repayment History</h3>
            <div className="space-y-2">
              {activePlan.schedule.map((item) => (
                <div
                  key={item.installmentNo}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-slate-900">Installment #{item.installmentNo}</strong>
                    <span className="text-slate-500 block text-[11px]">Due: {formatDate(item.dueDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{formatPKR(item.totalDue)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
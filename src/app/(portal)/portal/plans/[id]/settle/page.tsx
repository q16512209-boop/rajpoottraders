"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { useAuth } from "@/lib/context/auth-context";
import { calculateEarlySettlement } from "@/lib/calculations";
import { formatPKR, formatDate, formatCNIC } from "@/lib/formatters";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Percent,
  Wallet,
  ShieldCheck,
  Award,
  FileCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export default function EarlySettlementPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, currentTenant } = useAuth();
  const planId = params.id as string;

  const plan = store.getPlanById(planId);
  const wallets = store.getWallets(currentTenant.id).filter((w) => w.type === "COUNTER_TILL" || w.type === "DIGITAL_BANK" || w.type === "OWNER_POCKET");

  const [rebatePct, setRebatePct] = useState<number>(20);
  const [targetWalletId, setTargetWalletId] = useState(wallets[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) return null;
  if (!plan) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
        Contract not found.
      </div>
    );
  }

  const calc = calculateEarlySettlement(plan, rebatePct);
  const isAuthorizedForRebate = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rebatePct > 0 && !isAuthorizedForRebate) {
      setError("منافع میں رعایت (Rebate > 0%) صرف سپر ایڈمن یا دکان کے مالک کے اختیار میں ہے۔");
      return;
    }

    if (!targetWalletId) {
      setError("براہ کرم رقم وصولی کے لیے والٹ منتخب کریں۔");
      return;
    }

    setIsSubmitting(true);
    try {
      const { settlement } = store.settlePlanEarly({
        planId: plan.id,
        rebatePercentage: rebatePct,
        approvedBy: `${currentUser.name} (${currentUser.role})`,
        targetWalletId,
        actorId: currentUser.id,
      });

      router.push(`/portal/print/noc/${settlement.nocCertificateId}`);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
      <Link
        href={`/portal/plans/${plan.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Plan Details</span>
      </Link>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-700/80 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Early Payoff & Profit Rebate Clearance
            </span>
            <UrduSpeaker customText="قبل از وقت مکمل ادائیگی اور منافع میں رعایت۔ کلیئرنس سرٹیفکیٹ جاری کریں۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Early Settlement Calculator (قبل از وقت یکمشت ادائیگی)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            بقیہ غیر واجب الادا منافع پر گاہک کو رعایت دے کر فوری این او سی (NOC) کلیئرنس جاری کرنا
          </p>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-center self-start md:self-auto">
          <span className="text-[10px] text-slate-400 block font-mono">Contract Number</span>
          <strong className="text-base font-mono font-bold text-emerald-400">{plan.planNumber}</strong>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-urdu flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSettle} className="space-y-6">
        {/* Step 1: Contract Snapshot */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
            1. Contract Status Overview (معاہدے کی موجودہ پوزیشن)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Kharedar (گاہک)</span>
              <strong className="text-slate-900 font-bold block">{plan.customerName}</strong>
              <span className="text-slate-400 font-mono text-[10px]">{formatCNIC(plan.customerCnic)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Product Title</span>
              <strong className="text-slate-900 font-bold block truncate">{plan.productTitle}</strong>
              <span className="text-slate-400 font-mono text-[10px]">IMEI: {plan.imeiSerial}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Principal Paid So Far</span>
              <strong className="text-emerald-700 font-bold text-sm">{formatPKR(calc.totalPrincipalPaid)}</strong>
              <span className="text-slate-400 text-[10px]">Estimated</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Unearned Markup (بقیہ منافع)</span>
              <strong className="text-purple-700 font-bold text-sm">{formatPKR(calc.unearnedMarkup)}</strong>
              <span className="text-slate-400 text-[10px]">Future profit</span>
            </div>
          </div>
        </div>

        {/* Step 2: Rebate Percentage Selector */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                2. Unearned Profit Rebate Discount (غیر واجب الادا منافع میں رعایت)
              </h2>
              <p className="text-xs text-slate-500 font-urdu">
                گاہک کی جلد ادائیگی پر منافع کا کتنا فیصد معاف کیا جائے؟
              </p>
            </div>

            {!isAuthorizedForRebate && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                ⚠️ Requires Super Admin / Shop Owner approval for Rebate &gt; 0%
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={rebatePct}
                onChange={(e) => setRebatePct(Number(e.target.value))}
                className="flex-1 accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="w-20 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-center">
                <span className="text-base font-black text-emerald-800 font-mono">{rebatePct}%</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {[0, 10, 20, 30, 40, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setRebatePct(pct)}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors ${
                    rebatePct === pct
                      ? "bg-emerald-700 text-white border-emerald-800 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {pct}% Rebate
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Calculation Breakdown & Customer Savings Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Settlement Ledger Breakdown
            </span>
            <span className="text-xs font-urdu text-emerald-400">حتمی کلیئرنس رقم</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Remaining Principal</span>
              <strong className="text-base font-bold text-white">{formatPKR(calc.remainingPrincipal)}</strong>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Accrued Short Arrears</span>
              <strong className={calc.accruedPenalties > 0 ? "text-base font-bold text-rose-400" : "text-base font-bold text-emerald-400"}>
                {formatPKR(calc.accruedPenalties)}
              </strong>
            </div>

            <div className="p-3.5 bg-emerald-950/60 rounded-2xl border border-emerald-800">
              <span className="text-emerald-300 block text-[11px]">Rebate Discount Given</span>
              <strong className="text-base font-bold text-amber-300">- {formatPKR(calc.rebateDiscountGiven)}</strong>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl text-white shadow-lg">
              <span className="text-emerald-100 block text-[11px] font-bold">Final Settlement Amount</span>
              <strong className="text-xl font-black">{formatPKR(calc.finalSettlementAmount)}</strong>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-urdu">گاہک کو ملنے والا کل فائدہ (Total Customer Savings):</span>
            <span className="text-sm font-black text-amber-300 font-mono">{formatPKR(calc.customerSavings)}</span>
          </div>
        </div>

        {/* Step 4: Wallet Deposit & Approval */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
            3. Deposit Settlement Cash (رقم وصولی کا والٹ)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Deposit Destination Wallet (رقم کہاں جمع ہو؟) *
              </label>
              <select
                value={targetWalletId}
                onChange={(e) => setTargetWalletId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — Current: {formatPKR(w.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Approved By (منظور کنندہ)
              </label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.role})`}
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FileCheck className="w-4 h-4 text-amber-300" />
            <span>Approve Settlement & Print NOC (ادائیگی منظور کریں اور این او سی بنائیں)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
"use client";

import React, { useState, useMemo } from "react";
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
  Package,
  Layers,
  CheckSquare,
  Square,
} from "lucide-react";

export default function EarlySettlementPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, currentTenant } = useAuth();
  const planId = params.id as string;

  const plan = store.getPlanById(planId);
  const wallets = store.getWallets(currentTenant.id).filter(
    (w) => w.type === "COUNTER_TILL" || w.type === "DIGITAL_BANK" || w.type === "OWNER_POCKET"
  );

  const [rebatePct, setRebatePct] = useState<number>(20);
  const [targetWalletId, setTargetWalletId] = useState(wallets[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-Plan Settlement: Check other active plans for this customer
  const otherActivePlans = useMemo(() => {
    if (!plan) return [];
    return store
      .getPlans(currentTenant.id)
      .filter((p) => p.customerId === plan.customerId && p.id !== plan.id && p.status === "ACTIVE");
  }, [plan, currentTenant.id]);

  const [selectedOtherPlanIds, setSelectedOtherPlanIds] = useState<string[]>([]);

  const toggleOtherPlan = (id: string) => {
    if (selectedOtherPlanIds.includes(id)) {
      setSelectedOtherPlanIds(selectedOtherPlanIds.filter((x) => x !== id));
    } else {
      setSelectedOtherPlanIds([...selectedOtherPlanIds, id]);
    }
  };

  const selectAllCustomerPlans = () => {
    if (selectedOtherPlanIds.length === otherActivePlans.length) {
      setSelectedOtherPlanIds([]);
    } else {
      setSelectedOtherPlanIds(otherActivePlans.map((p) => p.id));
    }
  };

  // Selected plans list for settlement
  const allSelectedPlans = useMemo(() => {
    if (!plan) return [];
    const others = otherActivePlans.filter((p) => selectedOtherPlanIds.includes(p.id));
    return [plan, ...others];
  }, [plan, otherActivePlans, selectedOtherPlanIds]);

  // Combined Settlement Calculation across all selected plans
  const combinedCalc = useMemo(() => {
    let totalFinanced = 0;
    let totalPrincipalPaid = 0;
    let remainingPrincipal = 0;
    let totalMarkup = 0;
    let unearnedMarkup = 0;
    let rebateDiscountGiven = 0;
    let accruedPenalties = 0;
    let finalSettlementAmount = 0;
    let customerSavings = 0;

    allSelectedPlans.forEach((p) => {
      const c = calculateEarlySettlement(p, rebatePct);
      totalFinanced += c.totalFinanced;
      totalPrincipalPaid += c.totalPrincipalPaid;
      remainingPrincipal += c.remainingPrincipal;
      totalMarkup += c.totalMarkup;
      unearnedMarkup += c.unearnedMarkup;
      rebateDiscountGiven += c.rebateDiscountGiven;
      accruedPenalties += c.accruedPenalties;
      finalSettlementAmount += c.finalSettlementAmount;
      customerSavings += c.customerSavings;
    });

    return {
      totalFinanced,
      totalPrincipalPaid,
      remainingPrincipal,
      totalMarkup,
      unearnedMarkup,
      rebateDiscountGiven,
      accruedPenalties,
      finalSettlementAmount,
      customerSavings,
    };
  }, [allSelectedPlans, rebatePct]);

  if (!currentUser) return null;
  if (!plan) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
        Contract not found.
      </div>
    );
  }

  const isAuthorizedForRebate = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rebatePct > 0 && !isAuthorizedForRebate) {
      setError("Markup Rebate (> 0%) requires authorization from Super Admin or Shop Owner.");
      return;
    }

    if (!targetWalletId) {
      setError("Please select a destination cash wallet.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (allSelectedPlans.length > 1) {
        const { settlement } = store.settleMultiplePlansEarly({
          planIds: allSelectedPlans.map((p) => p.id),
          rebatePercentage: rebatePct,
          approvedBy: currentUser.name + " (" + currentUser.role + ")",
          targetWalletId,
          actorId: currentUser.id,
        });
        router.push("/portal/print/noc/" + settlement.nocCertificateId);
      } else {
        const { settlement } = store.settlePlanEarly({
          planId: plan.id,
          rebatePercentage: rebatePct,
          approvedBy: currentUser.name + " (" + currentUser.role + ")",
          targetWalletId,
          actorId: currentUser.id,
        });
        router.push("/portal/print/noc/" + settlement.nocCertificateId);
      }
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16">
      <Link
        href={"/portal/plans/" + plan.id}
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
            <UrduSpeaker
              customText="قبل از وقت مکمل ادائیگی اور منافع میں رعایت۔ اگر گاہک نے دو یا زائد پروڈکٹس لی ہیں تو ان کا مشترکہ کلیئرنس سرٹیفکیٹ جاری کریں۔"
              size="sm"
              showLabel
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Multi-Product & Early Settlement Clearance
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-urdu leading-relaxed">
            Provide unearned profit discount for early lump-sum payment and issue instant NOC clearance.
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
        {/* Step 1: Contract Snapshot & Multi-Product Items */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>1. Contract & Product Items Breakdown</span>
            </h2>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {allSelectedPlans.length} Plan(s) in Settlement
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Customer</span>
              <strong className="text-slate-900 font-bold block truncate">{plan.customerName}</strong>
              <span className="text-slate-400 font-mono text-[10px]">{formatCNIC(plan.customerCnic)}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Primary Product</span>
              <strong className="text-slate-900 font-bold block truncate">{plan.productTitle}</strong>
              <span className="text-slate-400 font-mono text-[10px]">IMEI: {plan.imeiSerial}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Principal Paid So Far</span>
              <strong className="text-emerald-700 font-bold text-sm">
                {formatPKR(combinedCalc.totalPrincipalPaid)}
              </strong>
              <span className="text-slate-400 text-[10px]">Across selected plans</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px]">Unearned Markup</span>
              <strong className="text-purple-700 font-bold text-sm">
                {formatPKR(combinedCalc.unearnedMarkup)}
              </strong>
              <span className="text-slate-400 text-[10px]">Future profit discountable</span>
            </div>
          </div>

          {/* If the current contract contains multiple product line items */}
          {plan.items && plan.items.length > 0 && (
            <div className="mt-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
              <span className="text-xs font-black text-emerald-950 block">
                Products Included in this Contract ({plan.items.length} Items):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {plan.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-2.5 bg-white border border-emerald-100 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-slate-900 font-bold block">{item.productTitle}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">SN: {item.imeiSerial || "N/A"}</span>
                    </div>
                    <span className="text-xs font-mono font-black text-emerald-800">
                      {formatPKR(item.installmentPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Multi-Plan Consolidation (If customer has other active contracts) */}
        {otherActivePlans.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-emerald-300 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <div>
                <h2 className="text-sm font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-700" />
                  <span>Consolidate Other Active Contracts of {plan.customerName}</span>
                </h2>
                <p className="text-xs text-slate-500 font-urdu">
                  اس گاہک کے دیگر فعال کھاتے بھی ایک ہی دفعہ سیٹل کر کے مشترکہ NOC جاری کریں۔
                </p>
              </div>

              <button
                type="button"
                onClick={selectAllCustomerPlans}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 self-start sm:self-auto"
              >
                {selectedOtherPlanIds.length === otherActivePlans.length ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                    <span>Deselect All Other Plans</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-400" />
                    <span>Select All Active Plans ({otherActivePlans.length})</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {otherActivePlans.map((other) => {
                const isSelected = selectedOtherPlanIds.includes(other.id);
                const otherCalc = calculateEarlySettlement(other, rebatePct);
                return (
                  <div
                    key={other.id}
                    onClick={() => toggleOtherPlan(other.id)}
                    className={"p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between " + (isSelected ? "bg-emerald-50/80 border-emerald-500 shadow-sm" : "bg-slate-50 border-slate-200 hover:bg-slate-100/70")}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-700 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block truncate">
                          {other.productTitle}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Plan #{other.planNumber} • Khata #{other.khataNumber || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Payoff</span>
                      <strong className="text-xs font-black text-emerald-800 font-mono">
                        {formatPKR(otherCalc.finalSettlementAmount)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Rebate Percentage Selector */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                2. Unearned Profit Rebate Discount
              </h2>
              <p className="text-xs text-slate-500 font-urdu">
                قبل از وقت ادائیگی پر منافع میں رعایت کا فیصد منتخب کریں:
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
                  className={"px-3 py-1.5 rounded-xl border font-bold text-xs transition-colors " + (rebatePct === pct ? "bg-emerald-700 text-white border-emerald-800 shadow-sm" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100")}
                >
                  {pct}% Rebate
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 4: Calculation Breakdown & Customer Savings Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Settlement Ledger Breakdown ({allSelectedPlans.length} Contract(s))
            </span>
            <span className="text-xs font-urdu text-emerald-400">Final Settlement Payable</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Remaining Principal</span>
              <strong className="text-base font-bold text-white">
                {formatPKR(combinedCalc.remainingPrincipal)}
              </strong>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Accrued Short Arrears</span>
              <strong
                className={
                  combinedCalc.accruedPenalties > 0
                    ? "text-base font-bold text-rose-400"
                    : "text-base font-bold text-emerald-400"
                }
              >
                {formatPKR(combinedCalc.accruedPenalties)}
              </strong>
            </div>

            <div className="p-3.5 bg-emerald-950/60 rounded-2xl border border-emerald-800">
              <span className="text-emerald-300 block text-[11px]">Rebate Discount Given</span>
              <strong className="text-base font-bold text-amber-300">
                - {formatPKR(combinedCalc.rebateDiscountGiven)}
              </strong>
            </div>

            <div className="p-3.5 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl text-white shadow-lg">
              <span className="text-emerald-100 block text-[11px] font-bold">Final Settlement Amount</span>
              <strong className="text-xl font-black">{formatPKR(combinedCalc.finalSettlementAmount)}</strong>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-urdu">Total Customer Savings via Rebate:</span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {formatPKR(combinedCalc.customerSavings)}
            </span>
          </div>
        </div>

        {/* Step 5: Wallet Deposit & Approval */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
            3. Deposit Settlement Cash
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Deposit Destination Wallet *
              </label>
              <select
                value={targetWalletId}
                onChange={(e) => setTargetWalletId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Balance: {formatPKR(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Authorized Approver
              </label>
              <input
                type="text"
                disabled
                value={currentUser.name + " (" + currentUser.role + ")"}
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-urdu">
            Upon settlement, {allSelectedPlans.length} contract(s) will be marked COMPLETED and master NOC generated.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Settling...</span>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>
                  Settle {allSelectedPlans.length > 1 ? allSelectedPlans.length + " Contracts" : "Contract"} & Issue NOC
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

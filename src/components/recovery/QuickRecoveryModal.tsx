"use client";

import React, { useState, useEffect, useRef } from "react";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatPhone } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import {
  Zap,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  FileSpreadsheet,
  Receipt,
  RotateCcw,
  Sparkles,
  Printer,
} from "lucide-react";

interface QuickRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded?: () => void;
}

export function QuickRecoveryModal({ isOpen, onClose, onPaymentRecorded }: QuickRecoveryModalProps) {
  const { currentUser, currentTenant } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const [khataQuery, setKhataQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState<string>("فوری ڈیلی ریکوری (Chiniot Bazaar)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    receiptId: string;
    khataNo: string;
    customerName: string;
    amount: number;
    planId: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset state on close
      setKhataQuery("");
      setSelectedPlan(null);
      setPayAmount("");
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser || !currentTenant) return null;

  const allPlans = store.getPlans(currentTenant.id);
  const customers = store.getCustomers(currentTenant.id);

  // Real-time lookup
  const cleanQuery = khataQuery.trim().toLowerCase();
  let matchedPlans = cleanQuery
    ? allPlans.filter((p) => {
        const kNo = (p.khataNumber || "").toLowerCase();
        const pNo = (p.planNumber || "").toLowerCase();
        const cPhone = (p.customerPhone || "").replace(/[^0-9]/g, "");
        const cCnic = (p.customerCnic || "").replace(/[^0-9]/g, "");
        const cName = (p.customerName || "").toLowerCase();
        const qDigits = cleanQuery.replace(/[^0-9]/g, "");

        return (
          kNo === cleanQuery ||
          kNo.includes(cleanQuery) ||
          pNo === cleanQuery ||
          pNo.includes(cleanQuery) ||
          (qDigits && (cPhone.includes(qDigits) || cCnic.includes(qDigits))) ||
          cName.includes(cleanQuery)
        );
      })
    : [];

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    const nextPending = plan.schedule.find((s: any) => s.status !== "PAID") || plan.schedule[0];
    const expected = nextPending ? Math.max(0, nextPending.totalDue - (nextPending.amountPaid || 0)) : (plan.monthlyInstallment || 500);
    setPayAmount(expected);
    setTimeout(() => {
      amountRef.current?.focus();
      amountRef.current?.select();
    }, 100);
  };

  const handleQueryChange = (val: string) => {
    setKhataQuery(val);
    setErrorMsg(null);

    const q = val.trim().toLowerCase();
    if (!q) {
      setSelectedPlan(null);
      setPayAmount("");
      return;
    }

    // Exact khata number match
    const exactMatch = allPlans.find(
      (p) => (p.khataNumber || "").toLowerCase() === q || (p.planNumber || "").toLowerCase() === q
    );
    if (exactMatch) {
      handleSelectPlan(exactMatch);
    } else {
      setSelectedPlan(null);
    }
  };

  // Submit payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      setErrorMsg("براہ کرم پہلے کھاتہ نمبر منتخب کریں۔");
      inputRef.current?.focus();
      return;
    }

    const numAmount = Number(payAmount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg("براہ کرم درست قسط کی رقم درج کریں۔");
      amountRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const nextPending = selectedPlan.schedule.find((s: any) => s.status !== "PAID") || selectedPlan.schedule[0];
      const instNo = nextPending ? nextPending.installmentNo : 1;

      const res = store.recordInstallmentPayment({
        planId: selectedPlan.id,
        installmentNo: instNo,
        amountPaid: numAmount,
        collectedBy: currentUser.name,
        collectorRole: currentUser.role,
        targetWalletType: "COUNTER_TILL",
        customPaidDate: payDate ? `${payDate}T12:00:00.000Z` : undefined,
        notes: payNotes || "فوری ڈیلی ریکوری",
      });

      // Save success receipt
      const recId = res.receiptId || `RCPT-${Date.now().toString().slice(-6)}`;
      setLastReceipt({
        receiptId: recId,
        khataNo: selectedPlan.khataNumber || selectedPlan.planNumber,
        customerName: selectedPlan.customerName,
        amount: numAmount,
        planId: selectedPlan.id,
      });

      // Notify parent to refresh counters
      if (onPaymentRecorded) {
        onPaymentRecorded();
      }

      // Reset for next immediate entry
      setKhataQuery("");
      setSelectedPlan(null);
      setPayAmount("");
      setIsSubmitting(false);

      // Re-focus khata input for next entry!
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "قسط درج کرنے میں خرابی واقع ہوئی ہے۔");
    }
  };

  // Get matching customer full details (Walad, Shop, Address)
  const custDetail = selectedPlan ? customers.find((c) => c.id === selectedPlan.customerId) : null;
  const totalPaid = selectedPlan
    ? (selectedPlan.schedule || []).reduce((sum: number, s: any) => sum + (s.amountPaid || 0), 0) + (selectedPlan.downPayment || 0)
    : 0;
  const totalFinanced = selectedPlan ? (selectedPlan.totalFinanced || 0) : 0;
  const remainingBalance = Math.max(0, totalFinanced - totalPaid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white border-2 border-emerald-500 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-slate-900 to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Zap className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                  High-Speed Daily Entry
                </span>
                <UrduSpeaker customText="فوری ڈیلی ریکوری پورٹل۔ کھاتہ نمبر درج کریں اور قسط پوسٹ کریں۔" size="sm" />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                ⚡ فوری ڈیلی ریکوری درج کریں (Quick Recovery)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="بند کریں (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Last Transaction Success Banner */}
          {lastReceipt && (
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-950 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block font-black">
                    ✓ کھاتہ #{lastReceipt.khataNo} ({lastReceipt.customerName}) کی قسط {formatPKR(lastReceipt.amount)} موصول ہو گئی۔
                  </strong>
                  <span className="text-[11px] text-emerald-800 font-mono">
                    رسید نمبر: #{lastReceipt.receiptId}
                  </span>
                </div>
              </div>
              <a
                href={`/portal/print/receipt/${lastReceipt.planId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow shrink-0"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>پرنٹ سلپ</span>
              </a>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-2 text-xs text-rose-800 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {/* 1. Khata Number Input */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-emerald-700" />
                  کھاتہ نمبر / خریدار کا نام / موبائل نمبر درج کریں *
                </span>
                <span className="text-[11px] font-normal text-slate-500 font-mono">
                  (Type Khata # e.g. 14, 43, 188)
                </span>
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={khataQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="کھاتہ نمبر درج کریں (مثلاً: 14 یا 43)..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-2xl text-sm sm:text-base font-black text-slate-900 outline-none transition-all placeholder:text-slate-400"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                {khataQuery && (
                  <button
                    type="button"
                    onClick={() => handleQueryChange("")}
                    className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Match Suggestions (if multiple matches and not yet selected) */}
            {!selectedPlan && matchedPlans.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 block">
                  ملتے جلتے کھاتے ({matchedPlans.length})
                </span>
                {matchedPlans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlan(p)}
                    className="w-full text-left p-2.5 hover:bg-emerald-50 rounded-xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 font-black rounded-lg text-xs">
                        کھاتہ #{p.khataNumber || p.planNumber}
                      </span>
                      <div>
                        <strong className="text-slate-900 block group-hover:text-emerald-800">
                          {p.customerName}
                        </strong>
                        <span className="text-[11px] text-slate-500">{p.areaZone} • {formatPhone(p.customerPhone)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="text-slate-900 font-black">{formatPKR(p.monthlyInstallment || 500)}</strong>
                      <span className="text-[10px] text-slate-400 block">{p.productTitle}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 2. Selected Khata Details Card (Instant Auto-Fill) */}
            {selectedPlan && (
              <div className="p-4 bg-gradient-to-br from-amber-50/60 to-emerald-50/40 border-2 border-emerald-400 rounded-2xl space-y-3 animate-in zoom-in-95 duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-sm border border-amber-500">
                      کھاتہ #{selectedPlan.khataNumber || selectedPlan.planNumber}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900">
                        {selectedPlan.customerName} {custDetail?.fatherName ? `ولد ${custDetail.fatherName}` : ""}
                      </h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{formatPhone(selectedPlan.customerPhone)}</span>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{custDetail?.address || selectedPlan.areaZone}</span>
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
                    {selectedPlan.productTitle}
                  </span>
                </div>

                {/* Financial Overview Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-bold">کل رقم (Total)</span>
                    <strong className="text-slate-900 font-black text-xs sm:text-sm">
                      {formatPKR(totalFinanced)}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                    <span className="text-emerald-800 text-[10px] block font-bold">اب تک وصولی</span>
                    <strong className="text-emerald-800 font-black text-xs sm:text-sm">
                      {formatPKR(totalPaid)}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-rose-200 bg-rose-50/40">
                    <span className="text-rose-800 text-[10px] block font-bold">نیٹ بقایا (Balance)</span>
                    <strong className="text-rose-700 font-black text-xs sm:text-sm">
                      {formatPKR(remainingBalance)}
                    </strong>
                  </div>
                </div>

                {/* 3. Payment Entry Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      قسط کی وصول شدہ رقم (Rs.) *
                    </label>
                    <input
                      ref={amountRef}
                      type="number"
                      required
                      min="1"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 500"
                      className="w-full p-2.5 bg-white border-2 border-emerald-500 focus:ring-2 focus:ring-emerald-400 rounded-xl font-mono font-black text-slate-900 text-base outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      وصولی کی تاریخ (Date)
                    </label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500">فوری رقم:</span>
                  {[500, 1000, 1500, 2000, 2500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPayAmount(amt)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                  {remainingBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(remainingBalance)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 transition-colors ml-auto"
                    >
                      مکمل بقایا ({formatPKR(remainingBalance)})
                    </button>
                  )}
                </div>

                {/* Action Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                    <span>
                      {isSubmitting ? "پوسٹ ہو رہا ہے..." : `قسط وصول کریں اور کھاتہ اپ ڈیٹ کریں [Enter]`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer Tips */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-urdu">
          <span>💡 ٹپ: کھاتہ نمبر لکھ کر Enter دبائیں، رقم درج کر کے دوبارہ Enter دبائیں تو قسط فورا درج ہو جائے گی۔</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
          >
            بند کریں (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

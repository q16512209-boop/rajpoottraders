"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatDateTime, formatCNIC, getStatusBadgeClass } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import {
  FileSpreadsheet,
  Printer,
  FileText,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  DollarSign,
  Edit3,
  ArrowLeftRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const { currentTenant, currentUser } = useAuth();
  const [plan, setPlan] = useState(() => store.getPlanById(params.id));
  const allPlans = store.getPlans(currentTenant.id).filter((p) => p.id !== params.id);

  // Pay Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeInstallmentNo, setActiveInstallmentNo] = useState<number>(1);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>("");

  // Khata Correction Modal State (Owner/SuperAdmin Only)
  const [corrModalOpen, setCorrModalOpen] = useState(false);
  const [corrInstNo, setCorrInstNo] = useState<number>(1);
  const [corrAmount, setCorrAmount] = useState<number>(0);
  const [corrStatus, setCorrStatus] = useState<"PAID" | "SHORT_PAID" | "PENDING" | "OVERDUE">("PAID");
  const [corrReason, setCorrReason] = useState<string>("");

  // Transfer Mistaken Payment Modal State (Owner/SuperAdmin Only)
  const [xferModalOpen, setXferModalOpen] = useState(false);
  const [targetPlanId, setTargetPlanId] = useState<string>(allPlans[0]?.id || "");
  const [xferAmount, setXferAmount] = useState<number>(0);
  const [xferReason, setXferReason] = useState<string>("");

  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) return null;
  if (!plan) return <div className="p-8 text-center font-bold">Plan not found</div>;

  const isOwnerOrSuperAdmin = currentUser.role === "SUPER_ADMIN" || currentUser.role === "OWNER";

  const handleOpenPay = (instNo: number, dueAmount: number) => {
    setActiveInstallmentNo(instNo);
    setPaidAmount(dueAmount);
    setPayNotes("");
    setPayModalOpen(true);
    setMsg(null);
  };

  const handleOpenCorrection = (item: any) => {
    setCorrInstNo(item.installmentNo);
    setCorrAmount(item.amountPaid || 0);
    setCorrStatus(item.status);
    setCorrReason("");
    setCorrModalOpen(true);
    setMsg(null);
  };

  const handleOpenTransfer = () => {
    const totalPaid = plan.schedule.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
    setXferAmount(Math.min(plan.monthlyInstallment, totalPaid));
    setXferReason("");
    setXferModalOpen(true);
    setMsg(null);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = store.recordInstallmentPayment({
        planId: plan.id,
        installmentNo: activeInstallmentNo,
        amountPaid: Number(paidAmount),
        collectedBy: currentUser.name,
        collectorRole: currentUser.role,
        notes: payNotes,
      });
      setPlan({ ...store.getPlanById(plan.id)! });
      setPayModalOpen(false);
      setMsg({ type: "success", text: `Payment recorded successfully! ${res.allocation.summary} (Receipt #${res.receiptId})` });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Payment logging failed" });
    }
  };

  const handleConfirmCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrReason.trim()) {
      alert("براہ کرم کھاتہ میں تصحیح کی باضابطہ وجہ درج کریں۔");
      return;
    }

    try {
      store.correctInstallmentPayment({
        planId: plan.id,
        installmentNo: corrInstNo,
        newAmountPaid: Number(corrAmount),
        newStatus: corrStatus,
        reason: corrReason,
        editorUser: currentUser,
      });

      setPlan({ ...store.getPlanById(plan.id)! });
      setCorrModalOpen(false);
      setMsg({
        type: "success",
        text: `کھاتہ قسط #${corrInstNo} میں کامیابی سے ترمیم کر دی گئی۔ آڈٹ لاگ بلاک چین پر محفوظ ہو گیا۔`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlanId) {
      alert("براہ کرم دوسرا کھاتہ منتخب کریں۔");
      return;
    }
    if (!xferReason.trim()) {
      alert("براہ کرم کھاتہ ٹرانسفر کی وجہ درج کریں۔");
      return;
    }

    try {
      store.transferKhataPayment({
        fromPlanId: plan.id,
        toPlanId: targetPlanId,
        amount: Number(xferAmount),
        reason: xferReason,
        editorUser: currentUser,
      });

      setPlan({ ...store.getPlanById(plan.id)! });
      setXferModalOpen(false);
      setMsg({
        type: "success",
        text: `رقم ${formatPKR(xferAmount)} غلط کھاتے سے نکال کر صحیح کھاتے میں کامیابی سے منتقل کر دی گئی۔`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-bold">
              {plan.planNumber}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(plan.status)}`}>
              {plan.status}
            </span>
            <UrduSpeaker customText="اقساط معاہدہ کی تفصیلات، اقساط کی وصولی یا کھاتہ میں تصحیح۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {plan.productTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kharedar: <strong className="text-slate-900">{plan.customerName}</strong> ({formatCNIC(plan.customerCnic)}) • Area: {plan.areaZone}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOwnerOrSuperAdmin && (
            <button
              onClick={handleOpenTransfer}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer Payment (غلط کھاتہ ٹرانسفر)</span>
            </button>
          )}

          {plan.status === "COMPLETED_EARLY_SETTLED" && plan.settlementRecordId && (
            <Link
              href={`/portal/print/noc/${plan.settlementRecordId}`}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow transition-colors"
            >
              <Receipt className="w-4 h-4 text-amber-300" />
              <span>Print Official NOC</span>
            </Link>
          )}

          {plan.status === "ACTIVE" && (
            <>
              <Link
                href={`/portal/plans/${plan.id}/settle`}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                <DollarSign className="w-4 h-4 text-amber-300" />
                <span>Early Settlement & Rebate</span>
              </Link>

              <Link
                href={`/portal/plans/${plan.id}/repossess`}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Repossess Item</span>
              </Link>
            </>
          )}

          <Link
            href={`/portal/print/contract/${plan.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>Print Stamp Paper</span>
          </Link>
          <Link
            href={`/portal/print/receipt/${plan.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Thermal / A4 Slip</span>
          </Link>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="font-urdu leading-relaxed">{msg.text}</span>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Monthly Installment</span>
          <strong className="text-lg font-black text-slate-900">{formatPKR(plan.monthlyInstallment)}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Down Payment</span>
          <strong className="text-lg font-bold text-emerald-700">{formatPKR(plan.downPayment)}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Accumulated Short Arrears</span>
          <strong className={`text-lg font-black ${plan.accumulatedShortArrears > 0 ? "text-rose-700" : "text-slate-900"}`}>
            {formatPKR(plan.accumulatedShortArrears)}
          </strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Financed Value</span>
          <strong className="text-lg font-bold text-slate-900">{formatPKR(plan.totalFinanced)}</strong>
        </div>
      </div>

      {/* Amortization Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Payment Amortization & Khata Schedule ({plan.durationMonths} Months)
            </h2>
            <p className="text-xs text-slate-500 font-urdu">
              اقساط کا مکمل حساب کتاب۔ دکان کا مالک کسی بھی غلط اندراج کو درست کر سکتا ہے۔
            </p>
          </div>

          {isOwnerOrSuperAdmin && (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Owner Khata Edit Authority Enabled</span>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[10px]">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Principal</th>
                <th className="py-3 px-3">Late Fee</th>
                <th className="py-3 px-3">Short Arrears</th>
                <th className="py-3 px-3">Total Obligation</th>
                <th className="py-3 px-3">Amount Paid</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.schedule.map((item) => (
                <tr key={item.installmentNo} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                    {item.installmentNo}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {formatDate(item.dueDate)}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {formatPKR(item.principalDue)}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {item.lateFee > 0 ? <span className="text-rose-700 font-bold">+{formatPKR(item.lateFee)}</span> : "-"}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {item.shortArrears > 0 ? <span className="text-amber-700 font-bold">+{formatPKR(item.shortArrears)}</span> : "-"}
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900">
                    {formatPKR(item.totalDue)}
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-800">
                    {item.amountPaid > 0 ? formatPKR(item.amountPaid) : "-"}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status !== "PAID" ? (
                        <button
                          onClick={() => handleOpenPay(item.installmentNo, item.totalDue)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg shadow transition-colors"
                        >
                          Log Payment
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">
                          {item.receiptId || "PAID"}
                        </span>
                      )}

                      {/* Owner Khata Correction Button */}
                      {isOwnerOrSuperAdmin && (
                        <button
                          onClick={() => handleOpenCorrection(item)}
                          title="کھاتہ درست کریں (Edit / Correct Khata)"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Standard Payment Logger */}
      {payModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Log Repayment #{activeInstallmentNo}
              </h3>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Amount to Pay (Rs.)</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-slate-900 font-mono outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Payment Memo / Receipt Note</label>
                <input
                  type="text"
                  placeholder="e.g. Paid at branch counter"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Owner Khata Correction & Ledger Edit */}
      {corrModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Owner Khata Correction Tool
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Correct Installment #{corrInstNo} ({plan.customerName})
                </h3>
              </div>
              <button onClick={() => setCorrModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Corrected Amount Paid (وصول شدہ اصل رقم - Rs.) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={corrAmount}
                  onChange={(e) => setCorrAmount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 text-base outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status (حیثیت) *</label>
                <select
                  value={corrStatus}
                  onChange={(e) => setCorrStatus(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                >
                  <option value="PAID">PAID (مکمل ادا شدہ)</option>
                  <option value="SHORT_PAID">SHORT_PAID (جزوی قسط / بقایا باقی)</option>
                  <option value="PENDING">PENDING (غیر ادا شدہ)</option>
                  <option value="OVERDUE">OVERDUE (تاخیر کا شکار)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Correction Reason (تصحیح کی باضابطہ وجہ) *</label>
                <textarea
                  required
                  rows={3}
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder="مثلاً: ریکوری افسر نے غلطی سے 3000 کی جگہ 5000 درج کر دیا تھا یا کیش ایڈجسٹمنٹ..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-amber-600 font-urdu"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-urdu leading-relaxed">
                یہ تصحیح بلاک چین آڈٹ چین پر درج ہوگی تاکہ کھاتے میں شفافیت برقرار رہے۔
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update & Save Khata (کھاتہ اپڈیٹ کریں)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Transfer Payment from Wrong Khata to Correct Khata */}
      {xferModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-300">
                  Transfer Misallocated Payment
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Move Payment to Another Customer Khata
                </h3>
              </div>
              <button onClick={() => setXferModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <span className="text-slate-500 block text-[11px]">From Khata (جہاں غلطی سے درج ہوئی):</span>
                <strong className="text-slate-900 block font-bold">{plan.customerName} ({plan.planNumber})</strong>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">To Destination Khata (صحیح گاہک کا کھاتہ منتخب کریں) *</label>
                <select
                  value={targetPlanId}
                  onChange={(e) => setTargetPlanId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                >
                  {allPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.customerName} — {p.productTitle} ({p.planNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Amount to Transfer (رقم منتقل کریں - Rs.) *</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={xferAmount}
                  onChange={(e) => setXferAmount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 text-base outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mistake Explanation Note (غلطی کی وضاحت) *</label>
                <textarea
                  required
                  rows={3}
                  value={xferReason}
                  onChange={(e) => setXferReason(e.target.value)}
                  placeholder="مثلاً: ریکوری افسر نے غلطی سے کھاتہ 33 میں رقم درج کر دی تھی جبکہ یہ کھاتہ 13 کی قسط تھی..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none font-urdu"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setXferModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Transfer Money (رقم ٹرانسفر کریں)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
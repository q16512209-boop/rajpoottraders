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
  Calendar,
  Clock,
  UserCheck,
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

  // Reschedule Due Date Modal (For Recovery Officers & Salesmen)
  const [reschedModalOpen, setReschedModalOpen] = useState(false);
  const [reschedInstNo, setReschedInstNo] = useState<number>(1);
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [reschedReason, setReschedReason] = useState<string>("گاہک نے تاریخ تبدیل کروائی");

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

  const handleOpenReschedule = (item: any) => {
    setReschedInstNo(item.installmentNo);
    setNewDueDate(item.dueDate);
    setReschedReason("گاہک نے تاریخ تبدیل کروائی");
    setReschedModalOpen(true);
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
      setMsg({ type: "success", text: `ادائیگی کامیابی سے درج ہو گئی! ${res.allocation.summary} (Receipt #${res.receiptId})` });
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
        text: `کھاتہ قسط #${corrInstNo} میں کامیابی سے ترمیم کر دی گئی۔ آڈٹ لاگ محفوظ ہو گیا۔`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.updatePlanNextDueDate({
        planId: plan.id,
        installmentNo: reschedInstNo,
        newDueDate,
        reason: reschedReason,
        updater: currentUser,
      });

      setPlan({ ...store.getPlanById(plan.id)! });
      setReschedModalOpen(false);
      setMsg({
        type: "success",
        text: `قسط #${reschedInstNo} کی تاریخ کامیابی سے بدل کر (${newDueDate}) کر دی گئی۔ روٹ شیٹ اپڈیٹ ہو گئی۔`,
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono bg-emerald-100 text-emerald-900 px-3 py-1 rounded-lg font-black border border-emerald-300">
              کھاتہ نمبر: {plan.khataNumber || plan.planNumber}
            </span>
            <span className="text-xs font-bold bg-slate-900 text-amber-300 px-3 py-1 rounded-lg border border-slate-700 font-urdu">
              سیل مین: {plan.salesmanName || "ضہیم"}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadgeClass(plan.status)}`}>
              {plan.status}
            </span>
            <UrduSpeaker customText="اقساط معاہدہ کی تفصیلات، قسط وصولی، تاریخ تبدیلی یا کھاتہ تصحیح۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-urdu">
            نام اشیاء: {plan.productTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-urdu">
            نام خریدار: <strong className="text-slate-900">{plan.customerName}</strong> ({formatCNIC(plan.customerCnic)}) • کسٹمر فون: <strong className="text-slate-900">{plan.customerPhone}</strong>
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
            <span>پرنٹ قانونی معاہدہ</span>
          </Link>
          <Link
            href={`/portal/print/receipt/${plan.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>پرنٹ پرچی رسید</span>
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

      {/* Financial Overview Cards (Matching Register) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">قسط کا شیڈول</span>
          <strong className="text-lg font-black text-slate-900">
            {formatPKR(plan.monthlyInstallment)} {plan.installmentFrequency === "WEEKLY" ? "(ہفتہ)" : "(ماہ)"}
          </strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">ایڈوانس رقم</span>
          <strong className="text-lg font-bold text-emerald-700">{formatPKR(plan.downPayment)}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">شارٹ بقایا جات</span>
          <strong className={`text-lg font-black ${plan.accumulatedShortArrears > 0 ? "text-rose-700" : "text-slate-900"}`}>
            {formatPKR(plan.accumulatedShortArrears)}
          </strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">کل قیمت (Total Price)</span>
          <strong className="text-lg font-bold text-slate-900">{formatPKR(plan.totalFinanced)}</strong>
        </div>
      </div>

      {/* Amortization Schedule Table (Exact Register Format) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 font-urdu">
              کھاتہ اقساط شیڈول ({plan.schedule.length} اقساط) • قسط کا دن: {plan.collectionDayName || "ہفتہ"}
            </h2>
            <p className="text-xs text-slate-500 font-urdu">
              رجسٹر کے مطابق تاریخ، وصولی، بقایا رقم اور وصول کنندہ کا باضابطہ ریکارڈ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-lg font-urdu">
              ریکوری سائیکل: ہر {plan.collectionIntervalDays || 7} دن بعد
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black text-[11px] font-urdu">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">تاریخ (Due Date)</th>
                <th className="py-3 px-3">قسط رقم (Obligation)</th>
                <th className="py-3 px-3 text-emerald-800">جمع شدہ (Paid)</th>
                <th className="py-3 px-3">حیثیت (Status)</th>
                <th className="py-3 px-3">وصول کنندہ / نوٹس</th>
                <th className="py-3 px-3 text-right">ایکشن (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.schedule.map((item) => (
                <tr key={item.installmentNo} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                    {item.installmentNo}
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-bold font-mono">
                    {formatDate(item.dueDate)}
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900">
                    {formatPKR(item.totalDue)}
                  </td>
                  <td className="py-3 px-3 font-black text-emerald-800 text-sm">
                    {item.amountPaid > 0 ? formatPKR(item.amountPaid) : "-"}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {item.collectedBy || item.notes || "-"}
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

                      {/* Reschedule Date Button (For Salesman / Recovery Man) */}
                      {item.status !== "PAID" && (
                        <button
                          onClick={() => handleOpenReschedule(item)}
                          title="تاریخ تبدیل کریں (Reschedule Collection Day)"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
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
                قسط وصولی درج کریں (Inst #{activeInstallmentNo})
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
                <label className="block text-slate-600 font-bold mb-1">وصول شدہ رقم (Rs.) *</label>
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
                <label className="block text-slate-600 font-bold mb-1">وصولی کا نوٹ / تفصیل</label>
                <input
                  type="text"
                  placeholder="مثلاً: دکان پر ادا کی یا ریکوری مین نے وصول کی"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none font-urdu"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow"
                >
                  ادائیگی محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Date Rescheduler (For Customer Requested Day Changes) */}
      {reschedModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-300">
                  Reschedule Installment Due Date
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  قسط #{reschedInstNo} کی تاریخ تبدیل کریں
                </h3>
              </div>
              <button onClick={() => setReschedModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">نئی وصولی تاریخ (New Due Date) *</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تاریخ تبدیلی کی وجہ (Reason) *</label>
                <input
                  type="text"
                  required
                  value={reschedReason}
                  onChange={(e) => setReschedReason(e.target.value)}
                  placeholder="مثلاً: گاہک نے کہا کہ جمعہ کو تنخواہ ملے گی تو تب آنا..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none font-urdu"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تاریخ محفوظ کریں (Save New Date)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Owner Khata Correction & Ledger Edit */}
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

      {/* MODAL 4: Transfer Payment from Wrong Khata to Correct Khata */}
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
                      {p.customerName} — {p.productTitle} (کھاتہ #{p.khataNumber || p.planNumber})
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

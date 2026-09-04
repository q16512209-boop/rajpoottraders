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
  const [reschedReason, setReschedReason] = useState<string>("Customer requested reschedule");

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
    setReschedReason("Customer requested reschedule");
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
      setMsg({ type: "success", text: `Payment recorded successfully! ${res.allocation.summary} (Receipt #${res.receiptId})` });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Payment logging failed" });
    }
  };

  const handleConfirmCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrReason.trim()) {
      alert("Please enter a valid reason for khata correction.");
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
        text: `Khata installment #${corrInstNo} corrected successfully! Audit log created.`,
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
        text: `Installment #${reschedInstNo} due date rescheduled to (${newDueDate}). Route sheet updated.`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlanId) {
      alert("Please select destination khata.");
      return;
    }
    if (!xferReason.trim()) {
      alert("Please enter transfer reason note.");
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
        text: `Successfully transferred ${formatPKR(xferAmount)} from misposted khata to destination khata.`,
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
              Khata #{plan.khataNumber || plan.planNumber}
            </span>
            <span className="text-xs font-bold bg-slate-900 text-amber-300 px-3 py-1 rounded-lg border border-slate-700 font-urdu">
              Salesman: {plan.salesmanName || "Zaheem"}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadgeClass(plan.status)}`}>
              {plan.status}
            </span>
            <UrduSpeaker customText="اقساط معاہدہ کی تفصیلات، قسط وصولی، تاریخ تبدیلی یا کھاتہ تصحیح۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-urdu">
            Product Title: {plan.productTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-urdu">
            Customer: <strong className="text-slate-900">{plan.customerName}</strong> ({formatCNIC(plan.customerCnic)}) • Phone: <strong className="text-slate-900">{plan.customerPhone}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOwnerOrSuperAdmin && (
            <button
              onClick={handleOpenTransfer}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer Misposted Payment</span>
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
            <span>Print Legal Agreement</span>
          </Link>
          <Link
            href={`/portal/print/receipt/${plan.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>Print Thermal Receipt</span>
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
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">Installment Schedule</span>
          <strong className="text-lg font-black text-slate-900">
            {formatPKR(plan.monthlyInstallment)} {plan.installmentFrequency === "WEEKLY" ? "/ Week" : "/ Month"}
          </strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">Down Payment</span>
          <strong className="text-lg font-bold text-emerald-700">{formatPKR(plan.downPayment)}</strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">Short Balance / Arrears</span>
          <strong className={`text-lg font-black ${plan.accumulatedShortArrears > 0 ? "text-rose-700" : "text-slate-900"}`}>
            {formatPKR(plan.accumulatedShortArrears)}
          </strong>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block font-urdu">Total Price (Total Price)</span>
          <strong className="text-lg font-bold text-slate-900">{formatPKR(plan.totalFinanced)}</strong>
        </div>
      </div>

      {/* Amortization Schedule Table (Exact Register Format) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 font-urdu">
              Installment Ledger Schedule ({plan.schedule.length} Installments) • Collection Day: {plan.collectionDayName || "Saturday"}
            </h2>
            <p className="text-xs text-slate-500 font-urdu">
              Official ledger records, payment collection history, short arrears, and collector audit trail
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-lg font-urdu">
              Collection Cycle: Every {plan.collectionIntervalDays || 7} Days
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black text-[11px] font-urdu">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Due Amount</th>
                <th className="py-3 px-3 text-emerald-800">Paid (PKR)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Collector / Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
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
                          title="Reschedule Due Date / Collection Day"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Owner Khata Correction Button */}
                      {isOwnerOrSuperAdmin && (
                        <button
                          onClick={() => handleOpenCorrection(item)}
                          title="Owner Khata Correction & Audit"
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
                Record Installment Payment (Inst #{activeInstallmentNo})
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
                <label className="block text-slate-600 font-bold mb-1">Amount Paid (PKR) *</label>
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
                <label className="block text-slate-600 font-bold mb-1">Payment Receipt Note</label>
                <input
                  type="text"
                  placeholder="e.g. Paid at shop counter or collected by field officer"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow"
                >
                  Record Payment
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
                  Reschedule Due Date (Inst #{reschedInstNo})
                </h3>
              </div>
              <button onClick={() => setReschedModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">New Due Date *</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reschedule Reason *</label>
                <input
                  type="text"
                  required
                  value={reschedReason}
                  onChange={(e) => setReschedReason(e.target.value)}
                  placeholder="e.g. Customer requested salary day alignment..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none font-urdu"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save New Due Date</span>
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
                <label className="block text-slate-700 font-bold mb-1">Corrected Amount Paid (Rs.) *</label>
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
                <label className="block text-slate-700 font-bold mb-1">Installment Status *</label>
                <select
                  value={corrStatus}
                  onChange={(e) => setCorrStatus(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                >
                  <option value="PAID">PAID (Fully Paid)</option>
                  <option value="SHORT_PAID">SHORT_PAID (Partial / Short Payment)</option>
                  <option value="PENDING">PENDING (Unpaid / Due)</option>
                  <option value="OVERDUE">OVERDUE (Defaulted / Overdue)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Correction & Adjustment Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder="e.g. Officer miskeyed 5000 instead of 3000 or cash adjustment..."
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
                  <span>Update & Save Khata Record</span>
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
                <span className="text-slate-500 block text-[11px]">Source Khata (Misposted Account):</span>
                <strong className="text-slate-900 block font-bold">{plan.customerName} ({plan.planNumber})</strong>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Destination Khata (Target Customer Account) *</label>
                <select
                  value={targetPlanId}
                  onChange={(e) => setTargetPlanId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                >
                  {allPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.customerName} — {p.productTitle} (Khata #{p.khataNumber || p.planNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Amount to Transfer (PKR) *</label>
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
                <label className="block text-slate-700 font-bold mb-1">Transfer & Audit Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={xferReason}
                  onChange={(e) => setXferReason(e.target.value)}
                  placeholder="e.g. Officer mistakenly credited Khata #33 instead of Khata #13..."
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
                  <span>Execute Khata Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

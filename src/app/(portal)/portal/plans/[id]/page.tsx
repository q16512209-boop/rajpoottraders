"use client";

import React, { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
} from "lucide-react";

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const { currentTenant, currentUser } = useAuth();
  const [plan, setPlan] = useState(() => store.getPlanById(params.id));
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeInstallmentNo, setActiveInstallmentNo] = useState<number>(1);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!plan) return <div className="p-8 text-center font-bold">Plan not found</div>;

  const handleOpenPay = (instNo: number, dueAmount: number) => {
    setActiveInstallmentNo(instNo);
    setPaidAmount(dueAmount);
    setPayNotes("");
    setPayModalOpen(true);
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

  return (
    <div className="space-y-8 pb-12">
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
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {plan.productTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kharedar: <strong className="text-slate-900">{plan.customerName}</strong> ({formatCNIC(plan.customerCnic)})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/portal/print/contract/${plan.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>Print Stamp Paper</span>
          </Link>
          <Link
            href={`/portal/print/receipt/${plan.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
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
          <span>{msg.text}</span>
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Payment Amortization & Repayment Waterfall Schedule
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {plan.durationMonths} Consecutive Months
          </span>
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
                    {item.status !== "PAID" ? (
                      <button
                        onClick={() => handleOpenPay(item.installmentNo, item.totalDue)}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg shadow transition-colors"
                      >
                        Log Payment
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono font-semibold">
                        {item.receiptId}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waterfall Payment Logger Modal */}
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

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Waterfall Allocation Rule:</strong> Payment settles Late Penalty first, then Past Short Arrears, then Principal. Any unpaid portion is rolled into short arrears.
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount Paid by Customer (PKR) *</label>
                <input
                  type="number"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-base text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Collector Notes / Receipt Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash at showroom desk"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
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
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow"
                >
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
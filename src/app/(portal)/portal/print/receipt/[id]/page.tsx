"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatDateTime, formatCNIC, formatPhone } from "@/lib/formatters";
import QRCode from "qrcode";
import { Printer, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ReceiptPrintPage({ params }: { params: { id: string } }) {
  const plan = store.getPlanById(params.id);
  const [layoutMode, setLayoutMode] = useState<"THERMAL" | "A4">("THERMAL");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    if (plan) {
      const verifyUrl = `https://rajpoottraders.com/verify?plan=${plan.planNumber}&hash=${plan.tamperProofHash}`;
      QRCode.toDataURL(verifyUrl, { width: 160, margin: 1 })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("QR generation error:", err));
    }
  }, [plan]);

  if (!plan) return <div className="p-8 text-center font-bold">Plan not found</div>;

  const tenant = store.getTenantById(plan.tenantId) || store.getTenants()[0];
  const lastPaidItem = plan.schedule.filter((s) => s.status === "PAID" || s.status === "SHORT_PAID").pop() || plan.schedule[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Top No-Print Control Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/portal/plans/${plan.id}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plan Schedule</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setLayoutMode("THERMAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                layoutMode === "THERMAL" ? "bg-white text-emerald-800 shadow" : "text-slate-600"
              }`}
            >
              80mm Thermal Slip
            </button>
            <button
              onClick={() => setLayoutMode("A4")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                layoutMode === "A4" ? "bg-white text-emerald-800 shadow" : "text-slate-600"
              }`}
            >
              Standard A4 Invoice
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* 1. 80mm Thermal Receipt Layout */}
      {layoutMode === "THERMAL" ? (
        <div className="thermal-receipt-page bg-white border border-slate-300 shadow-xl p-5 mx-auto max-w-[320px] font-mono text-[11px] text-slate-900 leading-tight space-y-3">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-2">
            <h2 className="font-bold text-sm text-slate-950 uppercase tracking-tight">
              RAJPOOT TRADERS
            </h2>
            <p className="text-[10px] text-slate-600 font-sans">
              Easy Installments & Electronics Hub
            </p>
            <p className="text-[9px] text-slate-500">{tenant.address}</p>
            <p className="text-[9px] text-slate-500">Helpline: {tenant.contact}</p>
          </div>

          {/* Receipt Meta */}
          <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 text-[10px]">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <strong className="font-bold">{lastPaidItem.receiptId || "RCPT-ADV-001"}</strong>
            </div>
            <div className="flex justify-between">
              <span>Date/Time:</span>
              <span>{formatDateTime(new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span>Plan Ref:</span>
              <strong className="font-bold">{plan.planNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span>Collector:</span>
              <span>{lastPaidItem.collectedBy || "Showroom Desk"}</span>
            </div>
          </div>

          {/* Customer & Asset */}
          <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 text-[10px]">
            <div>
              <span className="text-slate-500">Customer:</span>{" "}
              <strong>{plan.customerName}</strong>
            </div>
            <div>
              <span className="text-slate-500">CNIC:</span> {formatCNIC(plan.customerCnic)}
            </div>
            <div>
              <span className="text-slate-500">Asset:</span> {plan.productTitle}
            </div>
            <div>
              <span className="text-slate-500">IMEI:</span> {plan.imeiSerial}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="space-y-1 border-b-2 border-slate-900 pb-2">
            <div className="flex justify-between font-bold text-xs">
              <span>AMOUNT RECEIVED:</span>
              <span className="text-sm">{formatPKR(lastPaidItem.amountPaid || plan.downPayment)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Installment Month:</span>
              <span>#{lastPaidItem.installmentNo} of {plan.durationMonths}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Accumulated Arrears:</span>
              <span className={plan.accumulatedShortArrears > 0 ? "font-bold text-rose-700" : ""}>
                {formatPKR(plan.accumulatedShortArrears)}
              </span>
            </div>
          </div>

          {/* Tamper-Proof QR Code & Signature */}
          <div className="text-center pt-1 space-y-2">
            {qrCodeDataUrl && (
              <div className="flex justify-center">
                <img src={qrCodeDataUrl} alt="Verify QR" className="w-24 h-24" />
              </div>
            )}
            <p className="text-[8px] text-slate-400 break-all font-mono">
              HASH: {plan.tamperProofHash.slice(0, 28)}
            </p>
            <p className="text-[10px] font-sans font-urdu text-slate-800">
              Thank you for trusting Rajpoot Traders • Official Payment Receipt
            </p>
            <div className="pt-3 border-t border-slate-300 flex justify-between text-[9px] text-slate-500">
              <span>Operator Sign</span>
              <span>Customer Sign</span>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Standard A4 Invoice Layout */
        <div className="bg-white border border-slate-300 shadow-2xl p-8 sm:p-12 mx-auto max-w-3xl font-sans text-slate-900 space-y-6">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {tenant.brandHeader}
              </h1>
              <p className="text-xs font-urdu font-bold text-emerald-800 mt-0.5">
                {tenant.urduBrandName}
              </p>
              <p className="text-xs text-slate-600 mt-1">{tenant.address}</p>
              <p className="text-xs text-slate-600">Helpline: {tenant.contact}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded">
                OFFICIAL PAYMENT RECEIPT
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1">Receipt #{lastPaidItem.receiptId || "RCPT-ADV-001"}</p>
              <p className="text-xs text-slate-500">Date: {formatDate(new Date())}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-bold">Kharedar (Purchaser):</span>
              <strong className="text-sm text-slate-900 block mt-0.5">{plan.customerName}</strong>
              <p>CNIC: {formatCNIC(plan.customerCnic)}</p>
              <p>Mobile: {plan.customerPhone}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-bold">Financed Asset Details:</span>
              <strong className="text-sm text-slate-900 block mt-0.5">{plan.productTitle}</strong>
              <p className="font-mono">IMEI/Serial: {plan.imeiSerial}</p>
              <p>Plan Reference: {plan.planNumber}</p>
            </div>
          </div>

          {/* Payment Table */}
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 uppercase font-extrabold text-[10px]">
              <tr>
                <th className="p-3 border">Description</th>
                <th className="p-3 border">Installment Month</th>
                <th className="p-3 border text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border">
                  <strong>Monthly Installment Repayment</strong>
                  <span className="block text-slate-500 text-[11px]">Settled via Cash / Recovery Officer ({lastPaidItem.collectedBy || "Counter"})</span>
                </td>
                <td className="p-3 border">
                  Month #{lastPaidItem.installmentNo} of {plan.durationMonths}
                </td>
                <td className="p-3 border text-right font-black text-sm text-emerald-800">
                  {formatPKR(lastPaidItem.amountPaid || plan.downPayment)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Arrears & Signature */}
          <div className="flex justify-between items-center bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs">
            <div>
              <span className="font-bold text-amber-900 block">Remaining Short Arrears Balance:</span>
              <span className="text-slate-600">Pending deficit rolled over to subsequent pay cycle.</span>
            </div>
            <strong className="text-base font-black text-amber-900">
              {formatPKR(plan.accumulatedShortArrears)}
            </strong>
          </div>

          <div className="pt-10 flex justify-between items-end border-t border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR" className="w-20 h-20 border p-1 rounded" />}
              <div className="text-[10px] text-slate-500 font-mono">
                <p className="font-bold text-slate-700">Cryptographically Signed</p>
                <p>Hash: {plan.tamperProofHash.slice(0, 20)}...</p>
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="w-40 border-b border-slate-400"></div>
              <span className="font-bold text-slate-800 block text-[11px]">Authorized Showroom Signatory</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
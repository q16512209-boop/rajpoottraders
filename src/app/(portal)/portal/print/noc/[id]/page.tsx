"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { store } from "@/lib/db/store";
import { useAuth } from "@/lib/context/auth-context";
import { formatPKR, formatDate, formatCNIC } from "@/lib/formatters";
import { Printer, ArrowLeft, CheckCircle2, ShieldCheck, Award } from "lucide-react";

export default function NOCPrintPage() {
  const params = useParams();
  const router = useRouter();
  const { currentTenant } = useAuth();
  const nocId = params.id as string;

  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const settlement = store.getSettlementByNOC(nocId) || store.getSettlements().find((s) => s.contractId === nocId || s.id === nocId);
  const plan = settlement ? store.getPlanById(settlement.contractId) : store.getPlanById(nocId);

  useEffect(() => {
    if (settlement || plan) {
      const verifyUrl = `https://rajpoottraders.com/verify?noc=${nocId}`;
      QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [nocId, settlement, plan]);

  if (!plan) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
        NOC Record not found.
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Non-Printable Header Navigation */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official NOC Certificate</span>
          </button>
        </div>
      </div>

      {/* Official Certificate Paper Container */}
      <div className="bg-white border-2 border-slate-800 p-8 sm:p-12 shadow-2xl rounded-3xl relative overflow-hidden text-slate-900 printable-card">
        {/* Subtle Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-6xl font-black rotate-[-25deg] uppercase">
          RAJPOOT TRADERS • CLEARED NOC
        </div>

        {/* Corporate Header */}
        <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            <span className="text-amber-400 font-serif">R</span>T
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-slate-900 uppercase">
            RAJPOOT TRADERS
          </h1>
          <p className="text-xs font-urdu font-bold text-emerald-800">
            راجپوت ٹریڈرز — آسان اقساط، الیکٹرانکس و سولر فنانسنگ کارپوریشن
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {currentTenant.address} • Phone: {currentTenant.contact}
          </p>
          <div className="pt-2">
            <span className="inline-block px-5 py-1 bg-emerald-900 text-white font-extrabold text-xs uppercase tracking-widest rounded-full shadow-sm">
              Official No Objection Certificate (NOC / Clearance Certificate)
            </span>
          </div>
        </div>

        {/* Certificate Metadata Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-slate-200 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">Certificate Serial:</span>
            <strong className="text-emerald-800 font-bold">{settlement?.nocCertificateId || `NOC-${plan.planNumber}`}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Issue Date:</span>
            <strong className="text-slate-900">{formatDate(settlement?.clearedAt || new Date().toISOString())}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Status:</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              100% PAID & DISCHARGED ✓
            </span>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="py-6 space-y-6 text-xs sm:text-sm leading-relaxed text-slate-800 relative z-10">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              1. Customer & Product Identification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Customer Full Name:</span>
                <strong className="text-slate-900 text-sm">{plan.customerName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">CNIC:</span>
                <strong className="text-slate-900 font-mono">{formatCNIC(plan.customerCnic)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Product Purchased:</span>
                <strong className="text-slate-900">{plan.productTitle}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">IMEI / Serial / Engine Number:</span>
                <strong className="text-emerald-800 font-mono">{plan.imeiSerial}</strong>
              </div>
            </div>
          </div>

          {/* Legal Statement Bilingual */}
          <div className="space-y-4 text-xs sm:text-sm">
            <p className="font-urdu leading-loose text-slate-900 text-right bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
              تصدیق کی جاتی ہے کہ مسمی <strong>{plan.customerName}</strong> ولدیت معہ شناختی کارڈ نمبر <strong>{formatCNIC(plan.customerCnic)}</strong> نے راجپوت ٹریڈرز سے خریدی گئی پروڈکٹ <strong>{plan.productTitle}</strong> (سیریل/IMEI نمبر: {plan.imeiSerial}) کے تمام تر واجبات اور ماہانہ اقساط مکمل طور پر ادا کر دیے ہیں، اور راجپوت ٹریڈرز کا اب خریدار کے ذمہ کوئی بقایا یا واجب الادا رقم نہیں ہے۔
            </p>

            <p className="leading-relaxed text-slate-700">
              This is to formally certify that all hire-purchase liabilities, financing obligations, and short arrears for Contract <strong>#{plan.planNumber}</strong> have been settled in full. The ownership of the aforementioned product is unconditionally transferred to the customer. All dual guarantors are hereby irrevocably discharged and released from their personal guarantees and legal obligations.
            </p>
          </div>

          {/* Financial Settlement Snapshot */}
          {settlement && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block uppercase mb-2">Final Clearance Summary</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 font-sans">
                <div>
                  <span className="block text-[11px]">Total Financed:</span>
                  <strong className="text-slate-900">{formatPKR(settlement.totalOriginalFinanced)}</strong>
                </div>
                <div>
                  <span className="block text-[11px]">Rebate Discount Given:</span>
                  <strong className="text-emerald-700">{formatPKR(settlement.rebateDiscountGiven)} ({settlement.rebatePercentage}%)</strong>
                </div>
                <div>
                  <span className="block text-[11px]">Final Payoff Settled:</span>
                  <strong className="text-slate-900">{formatPKR(settlement.finalSettlementPaid)}</strong>
                </div>
                <div>
                  <span className="block text-[11px]">Approved By:</span>
                  <strong className="text-slate-900">{settlement.approvedBy}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Signatures & Seal Section */}
        <div className="pt-8 border-t-2 border-slate-800 grid grid-cols-3 gap-4 text-center text-xs relative z-10">
          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">Customer Signature</span>
            <div className="border-t border-slate-400 pt-1 font-mono text-[11px] text-slate-600">
              {plan.customerName}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-1">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="NOC Verification QR" className="w-20 h-20 border border-slate-300 p-1 rounded-xl" />
            )}
            <span className="text-[9px] font-mono text-slate-400 uppercase">Cryptographic Audit Scan</span>
          </div>

          <div className="space-y-12">
            <span className="font-bold text-slate-700 block">Authorized Sign & Stamp</span>
            <div className="border-t border-slate-400 pt-1 font-mono text-[11px] text-slate-900 font-bold">
              Rajpoot Traders Finance Desk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
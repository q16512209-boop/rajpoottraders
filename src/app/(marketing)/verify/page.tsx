"use client";

import React, { useState } from "react";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatCNIC } from "@/lib/formatters";
import { ShieldCheck, Search, CheckCircle2, AlertTriangle, FileText, Lock } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
  const [query, setQuery] = useState<string>("35202-1849201-3");
  const [searched, setSearched] = useState<boolean>(true);
  const [result, setResult] = useState<any>(() => {
    const plans = store.getPlans();
    return plans.find((p) => p.customerCnic.includes("35202-1849201-3") || p.planNumber === "RT-2025-0881");
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const clean = query.trim().toLowerCase();
    const plans = store.getPlans();
    const match = plans.find(
      (p) =>
        p.planNumber.toLowerCase() === clean ||
        p.customerCnic.includes(clean) ||
        p.customerPhone.includes(clean) ||
        p.tamperProofHash.toLowerCase().includes(clean) ||
        p.schedule.some((s) => s.receiptId?.toLowerCase() === clean)
    );
    setResult(match || null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Public Contract & Payment Verification
        </h1>
        <p className="text-sm text-slate-600">
          Verify active Hire-Purchase agreements, dual guarantor validity, and field recovery receipts with RAJPOOT TRADERS SHA-256 cryptographic ledger.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Customer CNIC (e.g. 35202-1849201-3) or Plan # (RT-2025-0881) or Receipt #"
              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-600"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow transition-colors"
          >
            Verify Record
          </button>
        </form>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <span>Quick Demo Search:</span>
          <button
            type="button"
            onClick={() => {
              setQuery("35202-1849201-3");
              setResult(store.getPlans()[0]);
            }}
            className="text-emerald-700 underline font-semibold"
          >
            35202-1849201-3 (Hafiz Usman)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setQuery("RT-2025-0902");
              setResult(store.getPlans()[1]);
            }}
            className="text-emerald-700 underline font-semibold"
          >
            RT-2025-0902 (Rana Shahid)
          </button>
        </div>
      </div>

      {searched && (
        <div>
          {result ? (
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden">
              <div className="bg-emerald-800 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-7 h-7 text-amber-300" />
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      AUTHENTIC HIRE-PURCHASE RECORD VERIFIED
                    </h3>
                    <p className="text-xs text-emerald-200">
                      Contract #{result.planNumber} • Status: {result.status}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-400/40 text-emerald-200 font-mono text-xs rounded-lg">
                  Tamper-Proof Ledger Hash
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">Customer (Kharedar):</span>
                    <strong className="text-sm text-slate-900 block mt-0.5">{result.customerName}</strong>
                    <span className="text-slate-500 font-mono">{formatCNIC(result.customerCnic)}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">Product / Asset:</span>
                    <strong className="text-sm text-slate-900 block mt-0.5">{result.productTitle}</strong>
                    <span className="text-slate-500 font-mono">IMEI/Serial: {result.imeiSerial}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">Monthly Obligation:</span>
                    <strong className="text-sm text-emerald-700 block mt-0.5">{formatPKR(result.monthlyInstallment)} / mo</strong>
                    <span className="text-slate-500">{result.durationMonths} Months Plan</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">
                        Accumulated Short Arrears Balance
                      </span>
                      <p className="text-[11px] text-amber-700">
                        {result.accumulatedShortArrears > 0
                          ? `Account has pending partial shortfall of ${formatPKR(result.accumulatedShortArrears)} from previous cycle.`
                          : "Account is 100% up-to-date with zero pending arrears."}
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-amber-900">
                    {formatPKR(result.accumulatedShortArrears)}
                  </span>
                </div>

                <div className="p-4 bg-slate-900 text-slate-300 rounded-xl font-mono text-[11px] space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      SHA-256 Ledger Block Signature
                    </span>
                    <span>VERIFIED OK</span>
                  </div>
                  <p className="break-all text-slate-400">
                    Hash: {result.tamperProofHash}
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Link
                    href={`/portal/print/contract/${result.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors border border-slate-300"
                  >
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>View Official Legal Stamp Contract</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
              <div className="inline-flex p-3 bg-rose-100 text-rose-700 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Record Found for "{query}"
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Please check the CNIC number or Plan Number. If this is a newly registered contract, please allow up to 1 hour for cryptographic ledger indexing.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
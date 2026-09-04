"use client";

import React from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatCNIC, formatPhone } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { Printer, ArrowLeft } from "lucide-react";

export default function PrintRouteSheetPage() {
  const { currentTenant, currentUser } = useAuth();
  const plans = store.getPlans(currentTenant.id);

  if (!currentUser) return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <Link
          href="/portal/recovery/route-sheet"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Route Preview</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow"
        >
          <Printer className="w-4 h-4 text-amber-300" />
          <span>Print A4 Route Sheet</span>
        </button>
      </div>

      <div className="bg-white border border-slate-300 shadow-2xl p-6 sm:p-8 mx-auto max-w-5xl font-sans text-slate-900 space-y-4">
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black uppercase text-slate-900">
              {currentTenant.brandHeader}
            </h1>
            <p className="text-xs font-urdu font-bold text-emerald-800">
              Daily Field Recovery & Collection Route Sheet
            </p>
            <p className="text-[11px] text-slate-500">
              Branch: {currentTenant.name} • Date: {formatDate(new Date())}
            </p>
          </div>
          <div className="text-right text-xs">
            <p><strong>Recovery Officer:</strong> {currentUser.name}</p>
            <p><strong>Route:</strong> Route-A / Route-B Central</p>
          </div>
        </div>

        <table className="w-full text-left text-[11px] border border-slate-300 border-collapse">
          <thead className="bg-slate-100 text-slate-800 uppercase font-extrabold text-[10px]">
            <tr>
              <th className="p-2 border border-slate-300">#</th>
              <th className="p-2 border border-slate-300">Kharedar & Phone</th>
              <th className="p-2 border border-slate-300">Landmark Address</th>
              <th className="p-2 border border-slate-300">Product / IMEI</th>
              <th className="p-2 border border-slate-300">Monthly Due</th>
              <th className="p-2 border border-slate-300">Short Arrears</th>
              <th className="p-2 border border-slate-300 w-24">Amount Collected</th>
              <th className="p-2 border border-slate-300 w-28">Customer Signature</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p, idx) => (
              <tr key={p.id} className="border-b border-slate-200">
                <td className="p-2 border border-slate-300 font-mono font-bold">{idx + 1}</td>
                <td className="p-2 border border-slate-300">
                  <strong className="block text-slate-900">{p.customerName}</strong>
                  <span className="font-mono text-[10px] text-slate-600">{formatPhone(p.customerPhone)}</span>
                </td>
                <td className="p-2 border border-slate-300 text-slate-700">
                  {p.areaZone}
                </td>
                <td className="p-2 border border-slate-300 text-slate-700">
                  <span className="block font-semibold">{p.productTitle}</span>
                  <span className="font-mono text-[9px] text-slate-400">IMEI: {p.imeiSerial}</span>
                </td>
                <td className="p-2 border border-slate-300 font-bold text-slate-900">
                  {formatPKR(p.monthlyInstallment)}
                </td>
                <td className="p-2 border border-slate-300 font-bold text-rose-700">
                  {p.accumulatedShortArrears > 0 ? formatPKR(p.accumulatedShortArrears) : "0"}
                </td>
                <td className="p-2 border border-slate-300 bg-slate-50"></td>
                <td className="p-2 border border-slate-300 bg-slate-50"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-6 flex justify-between text-xs text-slate-600 border-t border-slate-200">
          <div>
            <span>Total Route Target: <strong>{formatPKR(plans.reduce((a, c) => a + c.monthlyInstallment, 0))}</strong></span>
          </div>
          <div className="space-x-12">
            <span>Recovery Officer Sign: ______________</span>
            <span>Manager Verified Sign: ______________</span>
          </div>
        </div>
      </div>
    </div>
  );
}
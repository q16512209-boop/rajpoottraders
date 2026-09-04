"use client";

import React from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatCNIC, formatPhone } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { Printer, ArrowLeft } from "lucide-react";

export default function RouteSheetPage() {
  const { currentTenant, currentUser } = useAuth();
  const allPlans = store.getPlans(currentTenant.id);
  const dynamicRoutes = store.getRouteZones(currentTenant.id);
  const [selectedZone, setSelectedZone] = React.useState<string>("ALL");

  if (!currentUser) return null;

  const plans = allPlans.filter((p) => selectedZone === "ALL" || p.areaZone === selectedZone);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/portal/recovery"
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Recovery Portal</span>
        </Link>
        <div className="flex items-center gap-2">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
          >
            <option value="ALL">All Route Zones</option>
            {dynamicRoutes.map((z) => (
              <option key={z.id} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>
          <Link
            href={`/portal/print/route-sheet${selectedZone !== "ALL" ? `?zone=${encodeURIComponent(selectedZone)}` : ""}`}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print High-Density A4 Sheet</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Daily Field Recovery & Arrears Route Sheet
            </h1>
            <p className="text-xs text-slate-500">
              {currentTenant.name} • Recovery Officer: {currentUser.name} • Route: {selectedZone === "ALL" ? "All Zones" : selectedZone} • {formatDate(new Date())}
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded">
            Visits on Sheet: {plans.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px]">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Kharedar & Contact</th>
                <th className="p-2 border">Landmark Address</th>
                <th className="p-2 border">Zamin (Guarantor)</th>
                <th className="p-2 border">Product / Serial</th>
                <th className="p-2 border">Monthly Due</th>
                <th className="p-2 border">Short Arrears</th>
                <th className="p-2 border">Collected Amount</th>
                <th className="p-2 border">Signature / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {plans.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-2 border font-mono font-bold">{idx + 1}</td>
                  <td className="p-2 border">
                    <strong className="block text-slate-900">{p.customerName}</strong>
                    <span className="text-slate-500 font-mono text-[11px]">{formatPhone(p.customerPhone)}</span>
                  </td>
                  <td className="p-2 border text-slate-600 max-w-[180px] truncate">
                    {p.areaZone}
                  </td>
                  <td className="p-2 border text-slate-600">
                    Verified Dual Zamin
                  </td>
                  <td className="p-2 border text-slate-800 font-medium max-w-[150px] truncate">
                    {p.productTitle}
                  </td>
                  <td className="p-2 border font-bold text-slate-900">
                    {formatPKR(p.monthlyInstallment)}
                  </td>
                  <td className="p-2 border font-bold text-rose-700">
                    {p.accumulatedShortArrears > 0 ? formatPKR(p.accumulatedShortArrears) : "-"}
                  </td>
                  <td className="p-2 border bg-slate-50/50 w-24"></td>
                  <td className="p-2 border bg-slate-50/50 w-32"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

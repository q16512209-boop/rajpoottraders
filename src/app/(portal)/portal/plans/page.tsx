"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatCNIC, getStatusBadgeClass } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { FileSpreadsheet, Plus, Search, Filter, AlertTriangle, FileText, ArrowRight } from "lucide-react";

export default function PlansPage() {
  const { currentTenant } = useAuth();
  const [plans, setPlans] = useState(() => store.getPlans(currentTenant.id));
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const filtered = plans.filter((p) => {
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchSearch =
      search === "" ||
      p.planNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.customerCnic.includes(search) ||
      p.productTitle.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Hire-Purchase Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Active Installment Plans & Arrears
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking amortization schedules, rolling short payments, and legal agreements.
          </p>
        </div>

        <Link
          href="/portal/plans/new"
          className="flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Create New Installment Plan</span>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by Plan #, Customer Name, CNIC, or Product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "ACTIVE", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[10px]">
                <th className="py-3 px-4">Plan #</th>
                <th className="py-3 px-4">Customer (Kharedar)</th>
                <th className="py-3 px-4">Product / Serial</th>
                <th className="py-3 px-4">Financed Total</th>
                <th className="py-3 px-4">Monthly Due</th>
                <th className="py-3 px-4">Short Arrears</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <Link href={`/portal/plans/${p.id}`} className="hover:text-emerald-700">
                      {p.planNumber}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <strong className="text-slate-900 block">{p.customerName}</strong>
                    <span className="text-slate-400 font-mono text-[11px]">{formatCNIC(p.customerCnic)}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block truncate max-w-[200px]">{p.productTitle}</span>
                    <span className="text-slate-400 font-mono text-[10px]">IMEI: {p.imeiSerial}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {formatPKR(p.totalFinanced)}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    {formatPKR(p.monthlyInstallment)}
                  </td>
                  <td className="py-3.5 px-4">
                    {p.accumulatedShortArrears > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {formatPKR(p.accumulatedShortArrears)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Rs. 0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link
                      href={`/portal/plans/${p.id}`}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors"
                    >
                      Schedule
                    </Link>
                    <Link
                      href={`/portal/print/contract/${p.id}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px]"
                    >
                      Stamp Paper
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
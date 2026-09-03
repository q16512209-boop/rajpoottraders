"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatCNIC, formatDate, formatPhone, getStatusBadgeClass } from "@/lib/formatters";
import { decryptField, maskCnic } from "@/lib/crypto/aes";
import { useAuth } from "@/lib/context/auth-context";
import { Users, UserPlus, Search, ShieldAlert, CheckCircle2, Eye, EyeOff, MapPin, Phone, UserCheck } from "lucide-react";

export default function CustomersPage() {
  const { currentTenant } = useAuth();
  const [customers, setCustomers] = useState(() => store.getCustomers(currentTenant.id));
  const [search, setSearch] = useState("");
  const [showFullCnic, setShowFullCnic] = useState<Record<string, boolean>>({});

  const toggleCnicVisibility = (id: string) => {
    setShowFullCnic((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = customers.filter((c) => {
    const rawCnic = decryptField(c.cnic);
    return (
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      rawCnic.includes(search) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            KYC Vault & Defaulter Radar
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Customer Records & Dual Guarantors (Zamin)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Encrypted with AES-256-GCM at rest with automated cross-check on shared residential addresses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/portal/customers/legacy-entry"
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow transition-all border border-amber-400"
          >
            <UserCheck className="w-4 h-4 text-slate-950" />
            <span>پرانے کسٹمر کا کھاتہ درج کریں (Old Khata Form)</span>
          </Link>

          <Link
            href="/portal/customers/new"
            className="flex items-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>نیا کسٹمر رجسٹر کریں (New Customer)</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, decrypted CNIC, phone, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <div className="text-xs font-bold text-slate-500">
          Showing {filtered.length} Customer Profiles
        </div>
      </div>

      {/* Customers Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => {
          const rawCnic = decryptField(c.cnic);
          const isRevealed = !!showFullCnic[c.id];

          return (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 flex flex-col justify-between ${
                c.isDefaulter ? "border-2 border-rose-400 bg-rose-50/20" : "border-slate-200"
              }`}
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    c.isDefaulter
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}>
                    {c.isDefaulter ? "DEFALUTER FLAGGED" : `Risk Score: ${c.riskScore}/100 (Safe)`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Registered: {formatDate(c.createdAt)}
                  </span>
                </div>

                {/* Profile Information */}
                <div>
                  <h3 className="text-base font-black text-slate-900">{c.fullName}</h3>
                  <p className="text-xs text-slate-500">S/O {c.fatherName}</p>
                </div>

                {/* Encrypted CNIC & Visibility Toggle */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans font-bold">AES-256 CNIC:</span>
                    <strong className="text-slate-900">
                      {isRevealed ? formatCNIC(rawCnic) : maskCnic(rawCnic)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCnicVisibility(c.id)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500"
                    title={isRevealed ? "Hide CNIC" : "Decrypt & Reveal CNIC"}
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Contact & Address */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatPhone(c.phone)}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{c.address}, {c.city}</span>
                  </div>
                </div>

                {/* Dual Guarantor Mini Count */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Dual Guarantors:</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {c.guarantors.length} Verified Zamin
                  </span>
                </div>

                {c.defaulterReason && (
                  <div className="p-2.5 bg-rose-100/70 border border-rose-300 rounded-xl text-[11px] text-rose-900 leading-snug">
                    <strong className="block">Defaulter Alert:</strong>
                    {c.defaulterReason}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100">
                <Link
                  href={`/portal/plans/new?cust=${c.id}`}
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  <span>Create Installment Plan</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
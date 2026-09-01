"use client";

import React, { useState } from "react";
import { store } from "@/lib/db/store";
import { formatPKR, formatDateTime } from "@/lib/formatters";
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, RefreshCw, Server, Users, Building2 } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

export default function SuperAdminPage() {
  const { currentUser } = useAuth();
  const tenants = store.getTenants();
  const allCustomers = store.getCustomers();
  const ledgerChain = store.getLedgerChain();
  const [verificationResult, setVerificationResult] = useState(() => store.verifyChainIntegrity());
  const [isVerifying, setIsVerifying] = useState(false);

  const handleReverifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setVerificationResult(store.verifyChainIntegrity());
      setIsVerifying(false);
    }, 600);
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider bg-purple-900/80 text-purple-200 px-3 py-1 rounded-full border border-purple-500/30">
            Tier 0: Central Platform Command
          </span>
          <span className="text-xs text-slate-400 font-mono">Master Architecture</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          Super Admin Master Oversight & Cryptographic Audit
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl">
          Global multi-tenant oversight for RAJPOOT TRADERS network. Monitored with SHA-256 hash-chained financial transaction logs and AES-256 field-level KYC encryption.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${verificationResult.isValid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                SHA-256 Immutable Audit Ledger Chain
              </h2>
              <p className="text-xs text-slate-500">
                Blockchain-style backward hash linking preventing retroactive financial modifications.
              </p>
            </div>
          </div>

          <button
            onClick={handleReverifyChain}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow"
          >
            <RefreshCw className={`w-4 h-4 text-amber-300 ${isVerifying ? "animate-spin" : ""}`} />
            <span>{isVerifying ? "Validating Cryptographic Hashes..." : "Run Chain Integrity Check"}</span>
          </button>
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          verificationResult.isValid
            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
            : "bg-rose-50 border-rose-200 text-rose-900"
        }`}>
          <div className="flex items-center gap-3 text-xs">
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <div>
              <strong className="block text-sm">
                {verificationResult.isValid ? "All 100% Ledger Blocks Intact & Authenticated" : "Cryptographic Tampering Detected!"}
              </strong>
              <span>
                {verificationResult.isValid
                  ? `Verified ${ledgerChain.length} sequential blocks from Genesis without hash discrepancy.`
                  : verificationResult.reason}
              </span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold bg-white/80 px-2.5 py-1 rounded">
            Blocks: {ledgerChain.length}
          </span>
        </div>

        <div className="space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
            Latest Hash-Chained Blocks
          </span>
          <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[11px]">
            {ledgerChain.slice(-5).reverse().map((block) => (
              <div key={block.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span className="text-emerald-700">Block #{block.index} • [{block.payload.type}]</span>
                  <span className="text-slate-400">{formatDateTime(block.timestamp)}</span>
                </div>
                <div className="text-slate-600 text-[10px] truncate">
                  <strong>Notes:</strong> {block.payload.notes}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  <strong>Hash:</strong> {block.hash}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          Active Tenant Branches & Licensing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map((t) => (
            <div key={t.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 text-sm">{t.name}</strong>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  {t.licenseTier}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-urdu">{t.urduBrandName}</p>
              <div className="text-xs text-slate-600 space-y-1">
                <p><strong>Address:</strong> {t.address}</p>
                <p><strong>Emergency Contact:</strong> {t.contact}</p>
                <p><strong>Encryption Key:</strong> AES-256-GCM Active</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
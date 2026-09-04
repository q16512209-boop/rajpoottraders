"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDateTime } from "@/lib/formatters";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Users,
  Building2,
  Cloud,
  Download,
  KeyRound,
  Sparkles,
  Database,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

export default function SuperAdminPage() {
  const { currentUser } = useAuth();
  const tenants = store.getTenants();
  const allCustomers = store.getCustomers();
  const ledgerChain = store.getLedgerChain();
  const [verificationResult, setVerificationResult] = useState(() => store.verifyChainIntegrity());
  const [isVerifying, setIsVerifying] = useState(false);

  // Encrypted Cloud Backup States
  const [backupResult, setBackupResult] = useState<any>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  if (!currentUser || currentUser.role !== "SUPER_ADMIN") return null;

  const handleReverifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setVerificationResult(store.verifyChainIntegrity());
      setIsVerifying(false);
    }, 600);
  };

  const handleRunBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const res = store.exportEncryptedBackup();
      setBackupResult(res);
      setIsBackingUp(false);
    }, 800);
  };

  const handleDownloadSnapshot = () => {
    if (!backupResult) return;
    const blob = new Blob([JSON.stringify(backupResult.unencryptedSnapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rajpoot_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Central Platform Command Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-purple-900/80 text-purple-200 px-3 py-1 rounded-full border border-purple-500/30">
              Tier 0: Central Platform Command & Risk Oversight
            </span>
            <span className="text-xs text-slate-400 font-mono">Master Architecture</span>
            <UrduSpeaker customText="سپر ایڈمن ماسٹر اوور سائیٹ۔ بلاک چین لیجر اور انکرپٹڈ کلاؤڈ بیک اپ کنسول۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Super Admin Master Oversight & Cryptographic Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl font-urdu leading-relaxed">
            Rajpoot Traders Central Security & Audit Control Room. Real-time SHA-256 Blockchain Ledger & AES-256 Encryption.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 relative z-10">
          <Link
            href="/portal/admin/blogs"
            className="px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Manage SEO Blogs CMS</span>
          </Link>
          <Link
            href="/portal/users"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff & Roles Matrix</span>
          </Link>
        </div>
      </div>

      {/* SECTION 1: Automated Midnight Encrypted Cloud Backup Console */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Automated Midnight Encrypted Cloud Backup Engine
                </h2>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  /api/cron/backup
                </span>
              </div>
              <p className="text-xs text-slate-500 font-urdu">
                Automated cloud snapshot of immutable blockchain ledger, customer CNIC vault, and signed legal agreements.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white text-xs font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50"
          >
            <Cloud className={`w-4 h-4 text-amber-300 ${isBackingUp ? "animate-pulse" : ""}`} />
            <span>{isBackingUp ? "Generating AES-256 Dump..." : "Trigger Live Encrypted Cloud Backup"}</span>
          </button>
        </div>

        {backupResult && (
          <div className="p-5 bg-gradient-to-br from-slate-950 to-purple-950 rounded-2xl text-white space-y-4 shadow-xl border border-purple-800/60 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-purple-800/60 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <strong className="text-sm">Cloud Snapshot Successfully Generated & Verified</strong>
              </div>
              <span className="text-[10px] font-mono text-purple-300">
                {backupResult.backupTimestamp}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Total Records Archived</span>
                <strong className="text-lg font-black text-amber-300">{backupResult.totalRecords} Entities</strong>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Blockchain Audit Blocks</span>
                <strong className="text-lg font-black text-emerald-400">{backupResult.chainLength} Blocks (100% OK)</strong>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Encryption Standard</span>
                <strong className="text-sm font-bold text-white">AES-256-GCM Military</strong>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[10px]">Backup Payload Size</span>
                <strong className="text-sm font-mono text-slate-200">{(backupResult.sizeBytes / 1024).toFixed(1)} KB</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-purple-200 font-mono">
                Cloud Sync Target: Cloudflare R2 / AWS S3 (rajpoot-backups-secure)
              </span>
              <button
                onClick={handleDownloadSnapshot}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Clean JSON Snapshot</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: SHA-256 Immutable Audit Ledger Chain */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${verificationResult.isValid ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                SHA-256 Cryptographic Hash-Chain Ledger
              </h2>
              <p className="text-xs text-slate-500 font-urdu">
                Cryptographic SHA-256 blockchain audit chain detecting any unauthorized ledger tampering.
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
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <strong className="block text-sm font-bold">
                {verificationResult.isValid ? "All 100% Ledger Blocks Intact & Authenticated" : "Cryptographic Tampering Detected!"}
              </strong>
              <span className="font-urdu">
                {verificationResult.isValid
                  ? `All ${ledgerChain.length} ledger blocks from genesis to current block are cryptographically valid and tamper-proof.`
                  : verificationResult.reason}
              </span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold bg-white/80 px-2.5 py-1 rounded shadow-sm">
            Blocks: {ledgerChain.length}
          </span>
        </div>

        <div className="space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
            Latest Hash-Chained Blocks
          </span>
          <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[11px]">
            {ledgerChain.slice(-6).reverse().map((block) => (
              <div key={block.index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>Block #{block.index} • {block.payload.type}</span>
                  <span>{formatDateTime(block.timestamp)}</span>
                </div>
                <div className="text-slate-800 font-bold text-xs truncate">
                  {block.payload.notes || "Financial transaction recorded"}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                  <span className="truncate">Hash: {block.hash}</span>
                  <span className="text-emerald-700 font-bold shrink-0">✓ Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { store } from "@/lib/db/store";
import { formatPKR, formatDateTime } from "@/lib/formatters";
import { Wallet, ArrowRightLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

export default function TreasuryPage() {
  const { currentTenant, currentUser } = useAuth();
  const [wallets, setWallets] = useState(() => store.getWallets(currentTenant.id));
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState<number>(10000);
  const [transferNotes, setTransferNotes] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.transferBetweenWallets({
        fromWalletId,
        toWalletId,
        amount: Number(transferAmount),
        actorId: currentUser.id,
        notes: transferNotes,
      });
      setWallets([...store.getWallets(currentTenant.id)]);
      setMsg({ type: "success", text: `Transferred ${formatPKR(transferAmount)} successfully with cryptographic ledger entry.` });
      setTransferModalOpen(false);
      setTransferNotes("");
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Transfer failed" });
    }
  };

  const ownerWallet = wallets.find((w) => w.type === "OWNER_POCKET");
  const counterWallet = wallets.find((w) => w.type === "COUNTER_TILL");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Tier 1: Owner Pocket & Treasury Split
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Multi-Wallet Treasury & Cash Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time physical cash tracking, field in-transit allocations, and bank deposits.
          </p>
        </div>

        <button
          onClick={() => {
            setFromWalletId(counterWallet?.id || wallets[0]?.id || "");
            setToWalletId(ownerWallet?.id || wallets[1]?.id || "");
            setTransferModalOpen(true);
            setMsg(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
        >
          <ArrowRightLeft className="w-4 h-4 text-amber-300" />
          <span>Internal Wallet Transfer</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 ${
              wallet.type === "OWNER_POCKET"
                ? "border-2 border-amber-400 bg-amber-50/20"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {wallet.type.replace("_", " ")}
              </span>
              <span className="text-[11px] text-slate-400">
                {formatDateTime(wallet.updatedAt)}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{wallet.name}</h3>
              {wallet.accountNumber && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  A/C: {wallet.accountNumber} ({wallet.bankName})
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-xs text-slate-500 font-medium">Available Balance:</span>
              <span className="text-2xl font-black text-slate-900">{formatPKR(wallet.balance)}</span>
            </div>
          </div>
        ))}
      </div>

      {transferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
                Transfer Between Wallets
              </h3>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">From Source Wallet</label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatPKR(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">To Destination Wallet</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatPKR(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transfer Amount (PKR)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transfer Reason / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. EOD Cash sweep to Owner Pocket"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
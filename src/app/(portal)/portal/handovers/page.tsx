"use client";

import React, { useState } from "react";
import { store } from "@/lib/db/store";
import { formatPKR, formatDateTime, getStatusBadgeClass } from "@/lib/formatters";
import { CheckSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

export default function HandoversPage() {
  const { currentTenant, currentUser } = useAuth();
  const [handovers, setHandovers] = useState(() => store.getHandovers(currentTenant.id));
  const wallets = store.getWallets(currentTenant.id);
  const [submitAmount, setSubmitAmount] = useState<number>(38000);
  const [targetWalletId, setTargetWalletId] = useState<string>(wallets.find((w) => w.type === "COUNTER_TILL")?.id || wallets[0]?.id || "");
  const [notes, setNotes] = useState<string>("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!currentUser) return null;

  const handleSubmitHandover = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.submitHandover({
        tenantId: currentTenant.id,
        officerId: currentUser.id,
        officerName: currentUser.name,
        requestedAmount: Number(submitAmount),
        targetWalletId,
        notes,
      });
      setHandovers([...store.getHandovers(currentTenant.id)]);
      setMsg({ type: "success", text: "Handover request submitted for physical cash verification." });
      setNotes("");
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Submission failed" });
    }
  };

  const handleApprove = (handoverId: string) => {
    try {
      store.approveHandover(handoverId, currentUser.name, "Physical currency count verified OK.");
      setHandovers([...store.getHandovers(currentTenant.id)]);
      setMsg({ type: "success", text: "Handover verified & physical cash balances moved atomically into destination wallet." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Approval failed" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          2-Step Cash Handover Verification Protocol
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
          Field Collection & Counter Till Handover
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Field recovery officers submit daily collection batches &rarr; Shop Owner or Branch Manager physically verifies cash count &rarr; System settles balances atomically with SHA-256 block.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            Step 1: Submit Daily Collection Handover
          </h2>

          <form onSubmit={handleSubmitHandover} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Submitting Officer</label>
              <input
                type="text"
                disabled
                value={currentUser.name}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Physical Cash Collected (PKR)</label>
              <input
                type="number"
                value={submitAmount}
                onChange={(e) => setSubmitAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-emerald-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Showroom Wallet</label>
              <select
                value={targetWalletId}
                onChange={(e) => setTargetWalletId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Route & Denomination Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. 5x 5000 notes, 10x 1000 notes from Route-A recoveries"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition-colors"
            >
              Submit Handover Batch
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Step 2: Verification & Approval Queue ({handovers.length})
          </h2>

          <div className="space-y-3">
            {handovers.map((h) => (
              <div
                key={h.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  h.status === "PENDING"
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{h.officerName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(h.status)}`}>
                      {h.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Requested: <strong className="text-slate-900">{formatPKR(h.requestedAmount)}</strong> • {formatDateTime(h.submittedAt)}
                  </p>
                  {h.notes && (
                    <p className="text-[11px] text-slate-500 italic">
                      "{h.notes}"
                    </p>
                  )}
                  {h.verifiedBy && (
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      ✓ Verified by {h.verifiedBy} at {formatDateTime(h.verifiedAt)}
                    </p>
                  )}
                </div>

                {h.status === "PENDING" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(h.id)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-300" />
                      <span>Count Cash & Accept</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

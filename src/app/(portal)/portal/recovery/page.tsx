"use client";

import React, { useState } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatPhone, formatCNIC, getStatusBadgeClass } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import { Bike, Phone, MapPin, CheckCircle2, AlertTriangle, Printer, DollarSign, MessageSquare } from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";

export default function RecoveryPortalPage() {
  const { currentTenant, currentUser } = useAuth();
  const [plans, setPlans] = useState(() => store.getPlans(currentTenant.id));
  const [selectedRoute, setSelectedRoute] = useState<string>("Route-A (Gulberg / Model Town)");
  const [payModalPlan, setPayModalPlan] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string; receiptId?: string; phone?: string; customerName?: string } | null>(null);

  if (!currentUser) return null;

  const routePlans = plans.filter((p) => p.areaZone === selectedRoute || selectedRoute === "ALL");

  const handleOpenCollect = (p: any) => {
    setPayModalPlan(p);
    const nextInst = p.schedule.find((s: any) => s.status !== "PAID") || p.schedule[0];
    setPayAmount(nextInst ? nextInst.totalDue : 0);
    setPayNotes("");
    setMsg(null);
  };

  const handleConfirmCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalPlan) return;
    const nextInst = payModalPlan.schedule.find((s: any) => s.status !== "PAID") || payModalPlan.schedule[0];
    if (!nextInst) return;

    try {
      const res = store.recordInstallmentPayment({
        planId: payModalPlan.id,
        installmentNo: nextInst.installmentNo,
        amountPaid: Number(payAmount),
        collectedBy: currentUser.name,
        collectorRole: "FIELD_RECOVERY",
        notes: payNotes || "Field collection by recovery officer",
      });

      setPlans([...store.getPlans(currentTenant.id)]);
      setMsg({
        type: "success",
        text: `Field collection of ${formatPKR(payAmount)} received and added to your in-transit bag.`,
        receiptId: res.receiptId,
        phone: payModalPlan.customerPhone,
        customerName: payModalPlan.customerName,
      });
      setPayModalPlan(null);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to log field collection" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-700 text-emerald-100 px-3 py-0.5 rounded-full">
              Tier 3: Field Recovery Portal
            </span>
            <span className="text-xs font-mono text-amber-300">Officer: {currentUser.name}</span>
            <UrduSpeaker guideKey="LOG_PAYMENT" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Area Route Collection & Recovery
          </h1>
          <p className="text-xs text-emerald-200">
            {currentTenant.urduBrandName} • Real-time field receipts & route sheets
          </p>
        </div>

        <Link
          href="/portal/recovery/route-sheet"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow transition-colors"
        >
          <Printer className="w-4 h-4 text-emerald-700" />
          <span>Print Route Sheet</span>
        </Link>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border space-y-2 ${
          msg.type === "success" ? "bg-emerald-50 text-emerald-900 border-emerald-300" : "bg-rose-50 text-rose-900 border-rose-300"
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <AlertTriangle className="w-4 h-4 text-rose-700" />}
            <span>{msg.text}</span>
          </div>
          {msg.receiptId && (
            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
              <span className="font-mono">Receipt #{msg.receiptId}</span>
              <a
                href={`https://wa.me/${msg.phone?.replace(/\D/g, "")}?text=Assalam-o-Alaikum%20${encodeURIComponent(msg.customerName || "")},%20your%20payment%20of%20Rs.%20${payAmount}%20has%20been%20received%20by%20Rajpoot%20Traders%20recovery%20officer.%20Receipt%20#${msg.receiptId}.`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-800 underline font-extrabold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send WhatsApp Receipt to Customer</span>
              </a>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="text-xs font-bold text-slate-700">Filter By Assigned Route Area:</label>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["Route-A (Gulberg / Model Town)", "Route-B (Johar Town / Iqbal Town)", "ALL"].map((rt) => (
            <button
              key={rt}
              onClick={() => setSelectedRoute(rt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedRoute === rt
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {rt}
            </button>
          ))}
        </div>
      </div>

      {routePlans.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          اس روٹ پر ابھی کوئی اقساط کا کھاتہ درج نہیں ہے۔
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routePlans.map((p) => {
            const nextInst = p.schedule.find((s) => s.status !== "PAID") || p.schedule[p.schedule.length - 1];

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {p.planNumber}
                    </span>
                    {nextInst && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(nextInst.status)}`}>
                        {nextInst.status} (Inst #{nextInst.installmentNo})
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900">{p.customerName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{p.productTitle}</p>
                  </div>

                  {nextInst && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Obligation:</span>
                        <strong className="text-slate-900">{formatPKR(nextInst.totalDue)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Short Arrears:</span>
                        <strong className={p.accumulatedShortArrears > 0 ? "text-rose-700 font-bold" : "text-emerald-700"}>
                          {formatPKR(p.accumulatedShortArrears)}
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-400 font-mono text-[11px] pt-1 border-t border-slate-200">
                        <span>Due Date: {formatDate(nextInst.dueDate)}</span>
                        <span>IMEI: {p.imeiSerial}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <a
                      href={`tel:${p.customerPhone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Call Customer</span>
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(p.areaZone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Open Map Pin</span>
                    </a>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenCollect(p)}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <DollarSign className="w-4 h-4 text-amber-300" />
                    <span>Log Recovery Payment (Cash)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {payModalPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Log Field Collection ({payModalPlan.customerName})
              </h3>
              <button
                onClick={() => setPayModalPlan(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCollect} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cash Received (PKR) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Collected at customer shop / residence"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalPlan(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow"
                >
                  Issue Instant Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
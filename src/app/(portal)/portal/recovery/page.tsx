"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { store } from "@/lib/db/store";
import { formatPKR, formatDate, formatPhone, formatCNIC, getStatusBadgeClass } from "@/lib/formatters";
import { useAuth } from "@/lib/context/auth-context";
import {
  Bike,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Printer,
  DollarSign,
  MessageSquare,
  Calendar,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import { UrduSpeaker } from "@/components/ui/UrduSpeaker";
import { IPTPLog, OfflineCollectionItem } from "@/lib/db/types";

export default function RecoveryPortalPage() {
  const { currentTenant, currentUser } = useAuth();
  const [plans, setPlans] = useState(() => store.getPlans(currentTenant.id));
  const [ptpLogs, setPtpLogs] = useState(() => store.getPTPLogs(currentTenant.id));
  const [selectedRoute, setSelectedRoute] = useState<string>("Route-A (Gulberg / Model Town)");

  // Offline PWA State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineCollectionItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Pay Modal State
  const [payModalPlan, setPayModalPlan] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>("");

  // PTP Modal State
  const [ptpModalPlan, setPtpModalPlan] = useState<any>(null);
  const [ptpDate, setPtpDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [ptpAmount, setPtpAmount] = useState<number>(0);
  const [ptpReason, setPtpReason] = useState<IPTPLog["reason"]>("SALARY_DELAY");
  const [ptpNotes, setPtpNotes] = useState<string>("");

  // Messages
  const [msg, setMsg] = useState<{
    type: "success" | "error" | "offline";
    text: string;
    receiptId?: string;
    phone?: string;
    customerName?: string;
    ptpReminderText?: string;
  } | null>(null);

  // Connectivity Listeners & Local Storage Offline Queue
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load offline queue
    try {
      const saved = localStorage.getItem("rt_offline_queue");
      if (saved) setOfflineQueue(JSON.parse(saved));
    } catch (e) {}

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!currentUser) return null;

  // Prioritize PTP Due accounts at top
  const todayStr = new Date().toISOString().split("T")[0];

  const sortedPlans = [...plans].filter((p) => p.areaZone === selectedRoute || selectedRoute === "ALL").sort((a, b) => {
    const aPtp = ptpLogs.find((ptp) => ptp.contractId === a.id && ptp.status === "PENDING");
    const bPtp = ptpLogs.find((ptp) => ptp.contractId === b.id && ptp.status === "PENDING");

    if (aPtp && !bPtp) return -1;
    if (!aPtp && bPtp) return 1;
    return 0;
  });

  // Offline Sync Action
  const handleSyncOffline = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);

    try {
      const res = store.syncOfflineCollections(offlineQueue);
      setPlans([...store.getPlans(currentTenant.id)]);
      setOfflineQueue([]);
      localStorage.removeItem("rt_offline_queue");
      setMsg({
        type: "success",
        text: `Success: ${res.syncedCount} offline receipts synced successfully (Total: ${formatPKR(res.totalAmount)}).`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: `Sync Failed: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Payment Collect Modal
  const handleOpenCollect = (p: any) => {
    setPayModalPlan(p);
    const nextInst = p.schedule.find((s: any) => s.status !== "PAID") || p.schedule[0];
    setPayAmount(nextInst ? nextInst.totalDue : 0);
    setPayNotes("");
    setMsg(null);
  };

  // Open PTP Modal
  const handleOpenPTP = (p: any) => {
    setPtpModalPlan(p);
    const nextInst = p.schedule.find((s: any) => s.status !== "PAID") || p.schedule[0];
    setPtpAmount(nextInst ? nextInst.totalDue : 0);
    setPtpNotes("");
    setMsg(null);
  };

  // Confirm Payment (Online or Offline-First)
  const handleConfirmCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalPlan) return;

    if (!isOnline) {
      // Offline Collection Handler
      const tempId = `off_${Date.now()}`;
      const offlineItem: OfflineCollectionItem = {
        tempId,
        planId: payModalPlan.id,
        planNumber: payModalPlan.planNumber,
        customerName: payModalPlan.customerName,
        customerPhone: payModalPlan.customerPhone,
        amount: Number(payAmount),
        collectedAt: new Date().toISOString(),
        collectedBy: currentUser.name,
        synced: false,
        offlineReceiptHash: `OFFLINE-HASH-${tempId.slice(-6)}`,
      };

      const updatedQueue = [...offlineQueue, offlineItem];
      setOfflineQueue(updatedQueue);
      localStorage.setItem("rt_offline_queue", JSON.stringify(updatedQueue));

      setMsg({
        type: "offline",
        text: `Offline receipt saved: ${formatPKR(payAmount)} stored on device. Will auto-sync when online.`,
        receiptId: tempId,
        phone: payModalPlan.customerPhone,
        customerName: payModalPlan.customerName,
      });
      setPayModalPlan(null);
      return;
    }

    // Online Collection
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
        text: `Field Recovery: Collected ${formatPKR(payAmount)} and added to Cash In Hand bag.`,
        receiptId: res.receiptId,
        phone: payModalPlan.customerPhone,
        customerName: payModalPlan.customerName,
      });
      setPayModalPlan(null);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to log field collection" });
    }
  };

  // Confirm PTP Log
  const handleConfirmPTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ptpModalPlan) return;

    try {
      const createdPtp = store.logPTP({
        planId: ptpModalPlan.id,
        promisedDate: ptpDate,
        expectedAmount: Number(ptpAmount),
        reason: ptpReason,
        notes: ptpNotes,
        officerId: currentUser.id,
        officerName: currentUser.name,
      });

      setPlans([...store.getPlans(currentTenant.id)]);
      setPtpLogs([...store.getPTPLogs(currentTenant.id)]);

      const reminderTxt = `Assalam-o-Alaikum ${ptpModalPlan.customerName}, this is a gentle confirmation from Rajpoot Traders regarding your promised installment payment of Rs. ${formatPKR(ptpAmount)} on date ${formatDate(ptpDate)}. Thank you.`;

      setMsg({
        type: "success",
        text: `PTP Promised Payment logged for ${formatDate(ptpDate)} (Amount: ${formatPKR(ptpAmount)}). Customer moved to top priority.`,
        phone: ptpModalPlan.customerPhone,
        customerName: ptpModalPlan.customerName,
        ptpReminderText: reminderTxt,
      });

      setPtpModalPlan(null);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to log PTP" });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Top Banner with Connectivity Pill */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800/40 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-700 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500/30">
              Tier 3: Field Recovery Portal
            </span>
            <span className="text-xs font-mono text-amber-300">Officer: {currentUser.name}</span>
            <UrduSpeaker customText="فیلڈ ریکوری پورٹل۔ روٹ کی وصولی کریں، وعدہ ادائیگی درج کریں یا آف لائن موڈ استعمال کریں۔" size="sm" showLabel />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Area Route Recovery & PTP Schedule
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200 font-urdu leading-relaxed">
            Live GPS Guidance, Offline Field Receipts & PTP Scheduling
          </p>
        </div>

        {/* Connectivity & Offline Sync Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 relative z-10">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
            isOnline ? "bg-emerald-950/80 text-emerald-300 border-emerald-700" : "bg-amber-950/90 text-amber-300 border-amber-600 animate-pulse"
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isOnline ? "Online Cloud Connected" : "Offline PWA Mode Active"}</span>
          </div>

          {offlineQueue.length > 0 && (
            <button
              onClick={handleSyncOffline}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>Sync {offlineQueue.length} Offline Records ({isOnline ? "Ready" : "Waiting for Net"})</span>
            </button>
          )}

          <Link
            href="/portal/recovery/route-sheet"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>Print Route Sheet</span>
          </Link>
        </div>
      </div>

      {/* Messages */}
      {msg && (
        <div className={`p-4 sm:p-5 rounded-2xl text-xs font-bold border space-y-3 ${
          msg.type === "success"
            ? "bg-emerald-50 text-emerald-950 border-emerald-300"
            : msg.type === "offline"
            ? "bg-amber-50 text-amber-950 border-amber-300"
            : "bg-rose-50 text-rose-950 border-rose-300"
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : msg.type === "offline" ? (
              <WifiOff className="w-5 h-5 text-amber-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
            )}
            <span className="font-urdu leading-relaxed">{msg.text}</span>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            {msg.receiptId && <span className="font-mono text-slate-600">Receipt Ref: #{msg.receiptId}</span>}
            {msg.phone && (
              <a
                href={`https://wa.me/${msg.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  msg.ptpReminderText ||
                    `Assalam-o-Alaikum ${msg.customerName || ""}, your payment has been received by Rajpoot Traders officer ${currentUser.name}. Official Receipt Ref #${msg.receiptId}. Shukriya.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{msg.ptpReminderText ? "Send WhatsApp PTP Confirmation" : "Send WhatsApp Digital Receipt"}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Route Filter Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="text-xs font-bold text-slate-700">Filter By Assigned Route Area:</label>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

      {/* Cards List */}
      {sortedPlans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 font-urdu space-y-2">
          <p className="font-bold text-slate-700">No active installments pending on this route (Clean Slate)</p>
          <p>Register a new customer or import from customer ledger.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedPlans.map((p) => {
            const nextInst = p.schedule.find((s) => s.status !== "PAID") || p.schedule[p.schedule.length - 1];
            const activePtp = ptpLogs.find((ptp) => ptp.contractId === p.id && ptp.status === "PENDING");
            const isPtpDueToday = activePtp && activePtp.promisedDate <= todayStr;

            return (
              <div
                key={p.id}
                className={`rounded-3xl border p-6 shadow-sm space-y-4 flex flex-col justify-between transition-all ${
                  isPtpDueToday
                    ? "bg-gradient-to-b from-amber-50/90 to-white border-2 border-amber-500 shadow-md"
                    : activePtp
                    ? "bg-purple-50/40 border-purple-200"
                    : "bg-white border-slate-200 hover:shadow-md"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top Row: Contract & Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {p.planNumber}
                      </span>
                      {activePtp && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                          isPtpDueToday
                            ? "bg-amber-500 text-white border-amber-600 animate-pulse"
                            : "bg-purple-100 text-purple-800 border-purple-300"
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>PTP: {formatDate(activePtp.promisedDate)}</span>
                        </span>
                      )}
                    </div>

                    {nextInst && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(p.status === "DEFAULTED_REPOSSESSED" ? "OVERDUE" : nextInst.status)}`}>
                        {p.status === "DEFAULTED_REPOSSESSED" ? "REPOSSESSED" : `${nextInst.status} (Inst #${nextInst.installmentNo})`}
                      </span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h3 className="text-base font-black text-slate-900">{p.customerName}</h3>
                    <p className="text-xs text-slate-500 font-medium truncate">{p.productTitle}</p>
                    <span className="text-[10px] font-mono text-slate-400 block">CNIC: {formatCNIC(p.customerCnic)}</span>
                  </div>

                  {/* Financial Obligation Snapshot */}
                  {nextInst && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Monthly Due:</span>
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

                  {/* Active PTP Reason Callout */}
                  {activePtp && (
                    <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900">Promise to Pay Details:</span>
                        <strong className="text-amber-950 font-black">{formatPKR(activePtp.expectedAmount)}</strong>
                      </div>
                      <p className="text-[11px] text-amber-800 font-urdu">
                        Reason: {activePtp.reason} {activePtp.notes ? `(${activePtp.notes})` : ""}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons: Phone & 1-Tap Live GPS */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <a
                      href={`tel:${p.customerPhone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Call Client</span>
                    </a>
                    <a
                      href={
                        p.gpsLocation?.lat
                          ? `https://www.google.com/maps/dir/?api=1&destination=${p.gpsLocation.lat},${p.gpsLocation.lng}`
                          : `https://maps.google.com/?q=${encodeURIComponent(p.areaZone)}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{p.gpsLocation?.lat ? "Live GPS Pin" : "Area Map"}</span>
                    </a>
                  </div>
                </div>

                {/* Bottom Recovery Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => handleOpenCollect(p)}
                      disabled={p.status === "DEFAULTED_REPOSSESSED"}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <DollarSign className="w-4 h-4 text-amber-300" />
                      <span>Log Cash Payment</span>
                    </button>

                    <button
                      onClick={() => handleOpenPTP(p)}
                      disabled={p.status === "DEFAULTED_REPOSSESSED"}
                      className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-700" />
                      <span>Log PTP Promise</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <Link
                      href={`/portal/plans/${p.id}/settle`}
                      className="text-emerald-700 hover:underline font-bold"
                    >
                      Early Payoff (NOC) →
                    </Link>

                    <Link
                      href={`/portal/plans/${p.id}/repossess`}
                      className="text-rose-700 hover:underline font-bold"
                    >
                      Repossess Item →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Log Payment (Online / Offline) */}
      {payModalPlan && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                  {isOnline ? "Real-Time Cloud Collection" : "⚡ Offline PWA Collection"}
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Log Field Collection ({payModalPlan.customerName})
                </h3>
              </div>
              <button onClick={() => setPayModalPlan(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCollect} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Cash Amount Collected (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-mono font-black text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Collection Notes / Receipt Memo
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Received at doorstep, 5x 1000 notes"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-urdu">
                {isOnline
                  ? "This collection will immediately record in the verified ledger and add to your cash bag."
                  : "Device is offline. Receipt is stored locally and will sync when connected."}
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
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isOnline ? "Confirm Payment" : "Save Offline Receipt"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Promise to Pay (PTP) */}
      {ptpModalPlan && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700">
                  Promise-to-Pay (PTP) Scheduling
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Log PTP Schedule ({ptpModalPlan.customerName})
                </h3>
              </div>
              <button onClick={() => setPtpModalPlan(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPTP} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Promised Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={ptpDate}
                  onChange={(e) => setPtpDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Expected Payment Amount (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min={500}
                  value={ptpAmount}
                  onChange={(e) => setPtpAmount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Delay Reason Category *
                </label>
                <select
                  value={ptpReason}
                  onChange={(e) => setPtpReason(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none focus:border-purple-600"
                >
                  <option value="SALARY_DELAY">Salary Delay / Not Paid Yet</option>
                  <option value="MEDICAL_EMERGENCY">Medical Emergency / Hospitalization</option>
                  <option value="OUT_OF_CITY_TRAVEL">Out of City / Traveling</option>
                  <option value="DISPUTED_BILL">Account Dispute / Bill Clarification</option>
                  <option value="FAMILY_ISSUE">Family Emergency</option>
                  <option value="OTHER">Other Valid Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Special Commitment Notes
                </label>
                <input
                  type="text"
                  value={ptpNotes}
                  onChange={(e) => setPtpNotes(e.target.value)}
                  placeholder="e.g. Promised on Friday evening after bank close"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPtpModalPlan(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Save PTP Commitment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}